"""Foundation Apparel & Skin Labs — Backend API.

Provides:
- /api/products            : list products synced from Printify
- /api/products/{id}       : product detail
- /api/checkout/session    : create Stripe Checkout session for a cart
- /api/checkout/status/{id}: poll Stripe Checkout session status
- /api/webhook/stripe      : Stripe webhook (signature-verified)
- /api/newsletter          : capture emails (Skin Labs drop list)
"""
import os
import re
import logging
import asyncio
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

import httpx
from fastapi import FastAPI, APIRouter, HTTPException, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout,
    CheckoutSessionRequest,
    CheckoutSessionResponse,
    CheckoutStatusResponse,
)

# ---------- Config ----------
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
PRINTIFY_API_TOKEN = os.environ["PRINTIFY_API_TOKEN"]
PRINTIFY_SHOP_ID = os.environ["PRINTIFY_SHOP_ID"]
STRIPE_API_KEY = os.environ["STRIPE_API_KEY"]

PRINTIFY_BASE = "https://api.printify.com/v1"

logger = logging.getLogger("foundation")
logging.basicConfig(level=logging.INFO)

# ---------- DB ----------
mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client[DB_NAME]

# ---------- App ----------
app = FastAPI(title="Foundation Labs API")
api = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Printify cache ----------
_printify_cache: Dict[str, Any] = {"products": None, "ts": 0.0}
_CACHE_TTL = 120  # seconds


def _clean_html(html: str) -> str:
    if not html:
        return ""
    text = re.sub(r"<[^>]+>", " ", html)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _slugify(s: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s.lower()).strip("-")
    return s[:80]


def _transform_product(p: Dict[str, Any]) -> Dict[str, Any]:
    """Convert raw Printify product into a slim, frontend-friendly shape."""
    variants = []
    enabled_prices = []
    for v in p.get("variants", []):
        if not v.get("is_available", True):
            continue
        price_cents = v.get("price", 0)
        # Filter to enabled or fallback to all-available if none enabled
        variants.append({
            "id": v["id"],
            "title": v.get("title"),
            "sku": v.get("sku"),
            "price": round(price_cents / 100, 2),
            "is_enabled": v.get("is_enabled", False),
            "is_available": v.get("is_available", True),
            "options": v.get("options", []),
        })
        if v.get("is_enabled"):
            enabled_prices.append(price_cents / 100)

    # If no enabled variants, fall back to all available
    enabled_variants = [v for v in variants if v["is_enabled"]] or variants
    prices = [v["price"] for v in enabled_variants] or [0]

    options = []
    for o in p.get("options", []):
        options.append({
            "name": o.get("name"),
            "type": o.get("type"),
            "values": [{"id": val.get("id"), "title": val.get("title"), "colors": val.get("colors")} for val in o.get("values", [])],
        })

    images = []
    for img in p.get("images", []):
        images.append({
            "src": img.get("src"),
            "variant_ids": img.get("variant_ids", []),
            "position": img.get("position"),
            "is_default": img.get("is_default", False),
        })
    # Move default to front
    images.sort(key=lambda x: (not x["is_default"], x.get("position") != "front"))

    return {
        "id": p["id"],
        "slug": _slugify(p.get("title", "product")),
        "title": p.get("title"),
        "description": _clean_html(p.get("description", "")),
        "description_html": p.get("description", ""),
        "tags": p.get("tags", []),
        "visible": p.get("visible", True),
        "blueprint_id": p.get("blueprint_id"),
        "print_provider_id": p.get("print_provider_id"),
        "price_min": min(prices),
        "price_max": max(prices),
        "images": images,
        "variants": enabled_variants,
        "options": options,
    }


async def fetch_printify_products(force: bool = False) -> List[Dict[str, Any]]:
    now = asyncio.get_event_loop().time()
    if not force and _printify_cache["products"] and (now - _printify_cache["ts"] < _CACHE_TTL):
        return _printify_cache["products"]

    headers = {"Authorization": f"Bearer {PRINTIFY_API_TOKEN}"}
    async with httpx.AsyncClient(timeout=30) as client:
        # list
        r = await client.get(f"{PRINTIFY_BASE}/shops/{PRINTIFY_SHOP_ID}/products.json", headers=headers)
        r.raise_for_status()
        data = r.json().get("data", [])
        # Need detailed for each (list endpoint already returns variants/images per Printify docs)
        products = [_transform_product(p) for p in data if p.get("visible", True)]
    _printify_cache["products"] = products
    _printify_cache["ts"] = now
    return products


async def fetch_printify_product(product_id: str) -> Optional[Dict[str, Any]]:
    headers = {"Authorization": f"Bearer {PRINTIFY_API_TOKEN}"}
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(
            f"{PRINTIFY_BASE}/shops/{PRINTIFY_SHOP_ID}/products/{product_id}.json",
            headers=headers,
        )
        # Printify returns 404 for unknown IDs and 422 for malformed IDs.
        if r.status_code in (404, 422, 400):
            return None
        r.raise_for_status()
        return _transform_product(r.json())


# ---------- Models ----------
class CartItem(BaseModel):
    product_id: str
    variant_id: int
    title: str
    variant_title: Optional[str] = None
    image: Optional[str] = None
    quantity: int = Field(ge=1, le=10)


class CheckoutCreateRequest(BaseModel):
    items: List[CartItem]
    origin_url: str
    email: Optional[EmailStr] = None


class NewsletterRequest(BaseModel):
    email: EmailStr
    source: str = "skin_labs"


# ---------- Routes ----------
@api.get("/")
async def root():
    return {"name": "Foundation Labs API", "status": "ok"}


@api.get("/products")
async def list_products():
    try:
        products = await fetch_printify_products()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Printify error: {e.response.status_code}")
    # Slim payload
    slim = []
    for p in products:
        slim.append({
            "id": p["id"],
            "slug": p["slug"],
            "title": p["title"],
            "price_min": p["price_min"],
            "price_max": p["price_max"],
            "tags": p["tags"],
            "image": p["images"][0]["src"] if p["images"] else None,
            "image_alt": p["images"][1]["src"] if len(p["images"]) > 1 else None,
        })
    return {"products": slim, "total": len(slim)}


@api.get("/products/{product_id}")
async def get_product(product_id: str):
    products = await fetch_printify_products()
    found = next((p for p in products if p["id"] == product_id), None)
    if not found:
        # try fetch directly
        found = await fetch_printify_product(product_id)
    if not found:
        raise HTTPException(404, "Product not found")
    return found


@api.post("/checkout/session")
async def create_checkout_session(payload: CheckoutCreateRequest, request: Request):
    if not payload.items:
        raise HTTPException(400, "Cart is empty")

    # Re-price server-side from Printify to prevent client tampering
    products = await fetch_printify_products()
    products_by_id = {p["id"]: p for p in products}

    line_items_meta = []
    total_cents = 0
    for it in payload.items:
        prod = products_by_id.get(it.product_id) or await fetch_printify_product(it.product_id)
        if not prod:
            raise HTTPException(400, f"Unknown product {it.product_id}")
        variant = next((v for v in prod["variants"] if v["id"] == it.variant_id), None)
        if not variant:
            raise HTTPException(400, f"Unknown variant {it.variant_id}")
        unit_cents = int(round(variant["price"] * 100))
        total_cents += unit_cents * it.quantity
        line_items_meta.append({
            "product_id": it.product_id,
            "variant_id": it.variant_id,
            "title": prod["title"],
            "variant_title": variant.get("title"),
            "unit_price": variant["price"],
            "quantity": it.quantity,
        })

    # Add flat shipping (test) — $6.99
    shipping_cents = 699
    total_cents += shipping_cents
    amount_dollars = round(total_cents / 100, 2)

    origin = payload.origin_url.rstrip("/")
    success_url = f"{origin}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/cart"

    host_url = str(request.base_url)
    webhook_url = f"{host_url.rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    metadata = {
        "source": "foundation_web",
        "item_count": str(sum(i.quantity for i in payload.items)),
        "email": payload.email or "",
    }

    checkout_req = CheckoutSessionRequest(
        amount=amount_dollars,
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata,
    )
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_req)

    # Persist transaction
    await db.payment_transactions.insert_one({
        "session_id": session.session_id,
        "amount": amount_dollars,
        "currency": "usd",
        "status": "initiated",
        "payment_status": "unpaid",
        "metadata": metadata,
        "items": line_items_meta,
        "shipping": round(shipping_cents / 100, 2),
        "email": payload.email,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "printify_order_id": None,
    })

    return {"url": session.url, "session_id": session.session_id, "amount": amount_dollars}


@api.get("/checkout/status/{session_id}")
async def checkout_status(session_id: str, request: Request):
    host_url = str(request.base_url)
    webhook_url = f"{host_url.rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    try:
        status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
    except Exception as e:
        logger.info(f"checkout_status: invalid session_id={session_id!r}: {e}")
        return {"status": "not_found", "payment_status": "unknown",
                "amount_total": None, "currency": None, "metadata": {}}

    # Idempotent update
    existing = await db.payment_transactions.find_one({"session_id": session_id})
    if existing:
        already_paid = existing.get("payment_status") == "paid"
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "status": status.status,
                "payment_status": status.payment_status,
                "amount_total": status.amount_total,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }},
        )
        # Mark order_ready once when transitioning to paid
        if status.payment_status == "paid" and not already_paid:
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"fulfillment_status": "queued"}},
            )

    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency,
        "metadata": status.metadata,
    }


@api.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature")
    host_url = str(request.base_url)
    webhook_url = f"{host_url.rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    try:
        event = await stripe_checkout.handle_webhook(body, sig)
    except Exception as e:
        logger.warning(f"Webhook verify failed: {e}")
        raise HTTPException(400, "Invalid webhook")
    if event.payment_status == "paid":
        await db.payment_transactions.update_one(
            {"session_id": event.session_id},
            {"$set": {"payment_status": "paid", "status": "complete",
                      "webhook_event_id": event.event_id,
                      "updated_at": datetime.now(timezone.utc).isoformat()}},
        )
    return {"received": True}


@api.post("/newsletter")
async def newsletter_signup(payload: NewsletterRequest):
    existing = await db.newsletter.find_one({"email": payload.email})
    if existing:
        return {"ok": True, "already_subscribed": True}
    await db.newsletter.insert_one({
        "email": payload.email,
        "source": payload.source,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"ok": True}


app.include_router(api)


@app.get("/")
async def health():
    return {"app": "Foundation Labs", "ok": True}
