"""Foundation Apparel & Skin Labs — Backend API.

Endpoints:
- Auth          : /api/auth/* (register, login, logout, me)
- Products      : /api/products, /api/products/{id}
- Reviews       : /api/products/{id}/reviews (GET, POST verified-buyer)
- Checkout      : /api/checkout/session (with shipping address), /api/checkout/status/{id}
- Webhook       : /api/webhook/stripe (auto Printify order + email)
- Account       : /api/account/orders
- Newsletter    : /api/newsletter
"""
import os
import re
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any

import httpx
from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

load_dotenv()

from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout,
    CheckoutSessionRequest,
    CheckoutSessionResponse,
    CheckoutStatusResponse,
)
from auth import router as auth_router, get_current_user, get_optional_user
from emailer import send_order_confirmation, send_abandoned_cart

# ---------- Config ----------
MONGO_URL = os.environ.get("MONGO_URL", "")
DB_NAME = os.environ.get("DB_NAME", "foundation")
PRINTIFY_API_TOKEN = os.environ.get("PRINTIFY_API_TOKEN", "")
PRINTIFY_SHOP_ID = os.environ.get("PRINTIFY_SHOP_ID", "")
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "")

PRINTIFY_BASE = "https://api.printify.com/v1"
SHIPPING_FLAT = 6.99

logger = logging.getLogger("foundation")
logging.basicConfig(level=logging.INFO)

# ---------- DB ----------
mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client[DB_NAME]

# ---------- App ----------
app = FastAPI(title="Foundation Labs API")
app.state.db = db
api = APIRouter(prefix="/api")

# CORS — explicit origin for credentialed requests
allowed_origins = [FRONTEND_URL] if FRONTEND_URL else ["*"]
# also allow localhost dev
allowed_origins += ["http://localhost:3000", "http://localhost:3001"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Printify helpers ----------
_printify_cache: Dict[str, Any] = {"products": None, "ts": 0.0}
_CACHE_TTL = 120


def _clean_html(html: str) -> str:
    if not html: return ""
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html)).strip()


def _slugify(s: str) -> str:
    return re.sub(r"[^a-zA-Z0-9]+", "-", (s or "product").lower()).strip("-")[:80]


def _transform_product(p: Dict[str, Any]) -> Dict[str, Any]:
    variants = []
    for v in p.get("variants", []):
        if not v.get("is_available", True): continue
        variants.append({
            "id": v["id"], "title": v.get("title"), "sku": v.get("sku"),
            "price": round(v.get("price", 0) / 100, 2),
            "is_enabled": v.get("is_enabled", False),
            "is_available": v.get("is_available", True),
            "options": v.get("options", []),
        })
    enabled = [v for v in variants if v["is_enabled"]] or variants
    prices = [v["price"] for v in enabled] or [0]
    options = [{
        "name": o.get("name"), "type": o.get("type"),
        "values": [{"id": v.get("id"), "title": v.get("title"), "colors": v.get("colors")} for v in o.get("values", [])],
    } for o in p.get("options", [])]
    images = [{
        "src": i.get("src"), "variant_ids": i.get("variant_ids", []),
        "position": i.get("position"), "is_default": i.get("is_default", False),
    } for i in p.get("images", [])]
    images.sort(key=lambda x: (not x["is_default"], x.get("position") != "front"))
    return {
        "id": p["id"], "slug": _slugify(p.get("title", "")),
        "title": p.get("title"), "description": _clean_html(p.get("description", "")),
        "tags": p.get("tags", []), "visible": p.get("visible", True),
        "price_min": min(prices), "price_max": max(prices),
        "images": images, "variants": enabled, "options": options,
    }


async def fetch_printify_products(force: bool = False) -> List[Dict[str, Any]]:
    now = asyncio.get_event_loop().time()
    if not force and _printify_cache["products"] and (now - _printify_cache["ts"] < _CACHE_TTL):
        return _printify_cache["products"]
    headers = {"Authorization": f"Bearer {PRINTIFY_API_TOKEN}"}
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(f"{PRINTIFY_BASE}/shops/{PRINTIFY_SHOP_ID}/products.json", headers=headers)
        r.raise_for_status()
        data = r.json().get("data", [])
        products = [_transform_product(p) for p in data if p.get("visible", True)]
    _printify_cache["products"] = products
    _printify_cache["ts"] = now
    return products


async def fetch_printify_product(product_id: str) -> Optional[Dict[str, Any]]:
    headers = {"Authorization": f"Bearer {PRINTIFY_API_TOKEN}"}
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(f"{PRINTIFY_BASE}/shops/{PRINTIFY_SHOP_ID}/products/{product_id}.json", headers=headers)
        if r.status_code in (400, 404, 422):
            return None
        r.raise_for_status()
        return _transform_product(r.json())


async def create_printify_order(transaction: Dict[str, Any]) -> Optional[str]:
    """Submit a paid transaction as a Printify order (auto fulfillment)."""
    addr = transaction.get("shipping_address") or {}
    if not addr:
        logger.warning("create_printify_order: no shipping address")
        return None
    line_items = [{
        "product_id": it["product_id"],
        "variant_id": int(it["variant_id"]),
        "quantity": int(it["quantity"]),
    } for it in transaction.get("items", [])]
    if not line_items:
        return None
    payload = {
        "external_id": transaction["session_id"],
        "label": f"Foundation Order {transaction['session_id'][-10:].upper()}",
        "line_items": line_items,
        "shipping_method": 1,
        "send_shipping_notification": True,
        "address_to": {
            "first_name": addr.get("first_name", ""),
            "last_name": addr.get("last_name", ""),
            "email": transaction.get("email", ""),
            "phone": addr.get("phone", ""),
            "country": addr.get("country", "US"),
            "region": addr.get("region", ""),
            "address1": addr.get("address1", ""),
            "address2": addr.get("address2", ""),
            "city": addr.get("city", ""),
            "zip": addr.get("zip", ""),
        },
    }
    headers = {"Authorization": f"Bearer {PRINTIFY_API_TOKEN}", "Content-Type": "application/json"}
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                f"{PRINTIFY_BASE}/shops/{PRINTIFY_SHOP_ID}/orders.json",
                headers=headers, json=payload,
            )
            if r.status_code >= 400:
                logger.error(f"Printify order create failed {r.status_code}: {r.text}")
                return None
            order = r.json()
            order_id = order.get("id")
            # Auto-send to production
            if PRINTIFY_AUTO_FULFILL and order_id:
                rp = await client.post(
                    f"{PRINTIFY_BASE}/shops/{PRINTIFY_SHOP_ID}/orders/{order_id}/send_to_production.json",
                    headers=headers,
                )
                if rp.status_code >= 400:
                    logger.warning(f"Printify send_to_production failed {rp.status_code}: {rp.text}")
            return order_id
    except Exception as e:
        logger.exception(f"create_printify_order error: {e}")
        return None


# ---------- Models ----------
class CartItem(BaseModel):
    product_id: str
    variant_id: int
    title: str
    variant_title: Optional[str] = None
    image: Optional[str] = None
    quantity: int = Field(ge=1, le=10)


class ShippingAddress(BaseModel):
    first_name: str = Field(min_length=1, max_length=60)
    last_name: str = Field(min_length=1, max_length=60)
    address1: str = Field(min_length=1, max_length=120)
    address2: Optional[str] = Field(default="", max_length=120)
    city: str = Field(min_length=1, max_length=80)
    region: str = Field(min_length=1, max_length=60)  # state/province
    zip: str = Field(min_length=2, max_length=20)
    country: str = Field(min_length=2, max_length=3)   # ISO alpha-2
    phone: Optional[str] = Field(default="", max_length=30)


class CheckoutCreateRequest(BaseModel):
    items: List[CartItem]
    origin_url: str
    email: EmailStr
    shipping_address: ShippingAddress


class NewsletterRequest(BaseModel):
    email: EmailStr
    source: str = "skin_labs"


class ReviewIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    title: str = Field(min_length=1, max_length=120)
    body: str = Field(min_length=1, max_length=2000)


class TrackCartIn(BaseModel):
    email: EmailStr
    items: List[CartItem]


# ---------- Routes ----------
@api.get("/")
async def root():
    return {"name": "Foundation Labs API", "status": "ok"}


@api.get("/products")
async def list_products():
    try:
        products = await fetch_printify_products()
    except httpx.HTTPStatusError as e:
        raise HTTPException(502, f"Printify error: {e.response.status_code}")
    return {
        "products": [{
            "id": p["id"], "slug": p["slug"], "title": p["title"],
            "price_min": p["price_min"], "price_max": p["price_max"],
            "tags": p["tags"],
            "image": p["images"][0]["src"] if p["images"] else None,
            "image_alt": p["images"][1]["src"] if len(p["images"]) > 1 else None,
        } for p in products],
        "total": len(products),
    }


@api.get("/products/{product_id}")
async def get_product(product_id: str):
    products = await fetch_printify_products()
    found = next((p for p in products if p["id"] == product_id), None)
    if not found:
        found = await fetch_printify_product(product_id)
    if not found:
        raise HTTPException(404, "Product not found")
    return found


# ---- Reviews (verified buyer only) ----
@api.get("/products/{product_id}/reviews")
async def get_reviews(product_id: str):
    cursor = db.reviews.find({"product_id": product_id}).sort("created_at", -1).limit(50)
    out = []
    rating_sum = 0; count = 0
    async for r in cursor:
        rating_sum += r["rating"]; count += 1
        out.append({
            "id": str(r["_id"]),
            "user_name": r.get("user_name", "Customer"),
            "rating": r["rating"],
            "title": r["title"], "body": r["body"],
            "verified_buyer": r.get("verified_buyer", True),
            "created_at": r["created_at"].isoformat() if isinstance(r.get("created_at"), datetime) else r.get("created_at"),
        })
    avg = round(rating_sum / count, 2) if count else 0
    return {"reviews": out, "count": count, "average": avg}


@api.post("/products/{product_id}/reviews")
async def post_review(product_id: str, payload: ReviewIn, user: dict = Depends(get_current_user)):
    # verified buyer = has a paid transaction containing this product
    paid_with_product = await db.payment_transactions.find_one({
        "email": user["email"],
        "payment_status": "paid",
        "items.product_id": product_id,
    })
    if not paid_with_product:
        raise HTTPException(403, "Only verified buyers can leave a review. Purchase this product first.")
    # one review per user per product
    existing = await db.reviews.find_one({"product_id": product_id, "user_id": user["id"]})
    doc = {
        "product_id": product_id,
        "user_id": user["id"],
        "user_name": user.get("name") or user["email"].split("@")[0],
        "user_email": user["email"],
        "rating": payload.rating,
        "title": payload.title.strip(),
        "body": payload.body.strip(),
        "verified_buyer": True,
        "created_at": datetime.now(timezone.utc),
    }
    if existing:
        await db.reviews.update_one({"_id": existing["_id"]}, {"$set": {**doc, "updated_at": datetime.now(timezone.utc)}})
        return {"ok": True, "updated": True}
    res = await db.reviews.insert_one(doc)
    return {"ok": True, "id": str(res.inserted_id)}


# ---- Checkout ----
@api.post("/checkout/session")
async def create_checkout_session(
    payload: CheckoutCreateRequest,
    request: Request,
    background: BackgroundTasks,
    user: Optional[dict] = Depends(get_optional_user),
):
    if not payload.items:
        raise HTTPException(400, "Cart is empty")

    products = await fetch_printify_products()
    by_id = {p["id"]: p for p in products}

    line_items_meta = []
    subtotal_cents = 0
    for it in payload.items:
        prod = by_id.get(it.product_id) or await fetch_printify_product(it.product_id)
        if not prod:
            raise HTTPException(400, f"Unknown product {it.product_id}")
        variant = next((v for v in prod["variants"] if v["id"] == it.variant_id), None)
        if not variant:
            raise HTTPException(400, f"Unknown variant {it.variant_id}")
        unit_cents = int(round(variant["price"] * 100))
        subtotal_cents += unit_cents * it.quantity
        line_items_meta.append({
            "product_id": it.product_id,
            "variant_id": it.variant_id,
            "title": prod["title"],
            "variant_title": variant.get("title"),
            "image": prod["images"][0]["src"] if prod["images"] else None,
            "unit_price": variant["price"],
            "quantity": it.quantity,
        })

    shipping_cents = int(SHIPPING_FLAT * 100)
    total_cents = subtotal_cents + shipping_cents
    amount_dollars = round(total_cents / 100, 2)

    origin = payload.origin_url.rstrip("/")
    success_url = f"{origin}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/cart"

    host_url = str(request.base_url)
    webhook_url = f"{host_url.rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    metadata = {"source": "foundation_web", "email": payload.email, "user_id": user["id"] if user else ""}

    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(
        CheckoutSessionRequest(amount=amount_dollars, currency="usd",
                               success_url=success_url, cancel_url=cancel_url, metadata=metadata)
    )

    tx_doc = {
        "session_id": session.session_id,
        "user_id": user["id"] if user else None,
        "email": payload.email,
        "amount": amount_dollars,
        "shipping": SHIPPING_FLAT,
        "currency": "usd",
        "status": "initiated",
        "payment_status": "unpaid",
        "metadata": metadata,
        "items": line_items_meta,
        "shipping_address": payload.shipping_address.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "printify_order_id": None,
        "fulfillment_status": "pending",
        "email_sent": False,
    }
    await db.payment_transactions.insert_one(tx_doc)
    # Mark any active abandoned-cart row for this email as "checked-out" so we don't email it
    await db.abandoned_carts.update_many(
        {"email": payload.email, "status": "active"},
        {"$set": {"status": "checked_out", "updated_at": datetime.now(timezone.utc)}},
    )
    return {"url": session.url, "session_id": session.session_id, "amount": amount_dollars}


async def _maybe_fulfill(session_id: str):
    """Idempotent: if paid and not yet fulfilled, create Printify order + email."""
    tx = await db.payment_transactions.find_one({"session_id": session_id})
    if not tx:
        return
    if tx.get("payment_status") != "paid":
        return
    # Fulfillment
    if not tx.get("printify_order_id"):
        order_id = await create_printify_order(tx)
        if order_id:
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"printify_order_id": order_id, "fulfillment_status": "submitted",
                          "updated_at": datetime.now(timezone.utc).isoformat()}},
            )
            tx["printify_order_id"] = order_id
    # Email
    if not tx.get("email_sent"):
        ok = send_order_confirmation({
            **tx, "order_id": (tx.get("printify_order_id") or tx["session_id"][-10:].upper()),
        })
        if ok:
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"email_sent": True, "updated_at": datetime.now(timezone.utc).isoformat()}},
            )


@api.get("/checkout/status/{session_id}")
async def checkout_status(session_id: str, request: Request, background: BackgroundTasks):
    host_url = str(request.base_url)
    webhook_url = f"{host_url.rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    try:
        s: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
    except Exception as e:
        logger.info(f"checkout_status: invalid session_id={session_id!r}: {e}")
        return {"status": "not_found", "payment_status": "unknown",
                "amount_total": None, "currency": None, "metadata": {}}

    existing = await db.payment_transactions.find_one({"session_id": session_id})
    if existing:
        prev_paid = existing.get("payment_status") == "paid"
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"status": s.status, "payment_status": s.payment_status,
                      "amount_total": s.amount_total,
                      "updated_at": datetime.now(timezone.utc).isoformat()}},
        )
        if s.payment_status == "paid" and not prev_paid:
            background.add_task(_maybe_fulfill, session_id)

    return {"status": s.status, "payment_status": s.payment_status,
            "amount_total": s.amount_total, "currency": s.currency, "metadata": s.metadata}


@api.post("/webhook/stripe")
async def stripe_webhook(request: Request, background: BackgroundTasks):
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
        background.add_task(_maybe_fulfill, event.session_id)
    return {"received": True}


# ---- Newsletter ----
@api.post("/newsletter")
async def newsletter_signup(payload: NewsletterRequest):
    existing = await db.newsletter.find_one({"email": payload.email})
    if existing:
        return {"ok": True, "already_subscribed": True}
    await db.newsletter.insert_one({
        "email": payload.email, "source": payload.source,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"ok": True}


# ---- Abandoned cart ----
@api.post("/cart/track")
async def track_cart(payload: TrackCartIn):
    """Called when user enters email on checkout page but hasn't paid yet."""
    await db.abandoned_carts.update_one(
        {"email": payload.email, "status": "active"},
        {"$set": {
            "email": payload.email,
            "items": [i.model_dump() for i in payload.items],
            "status": "active",
            "updated_at": datetime.now(timezone.utc),
        }, "$setOnInsert": {"created_at": datetime.now(timezone.utc), "emailed": False}},
        upsert=True,
    )
    return {"ok": True}


async def abandoned_cart_worker():
    """Background loop: send abandoned-cart email after delay."""
    await asyncio.sleep(15)  # warmup
    while True:
        try:
            cutoff = datetime.now(timezone.utc) - timedelta(minutes=ABANDONED_CART_DELAY_MIN)
            cursor = db.abandoned_carts.find({
                "status": "active",
                "emailed": False,
                "updated_at": {"$lte": cutoff},
            })
            async for cart in cursor:
                ok = send_abandoned_cart(
                    cart["email"], cart.get("items", []),
                    resume_url=f"{FRONTEND_URL}/cart",
                )
                await db.abandoned_carts.update_one(
                    {"_id": cart["_id"]},
                    {"$set": {"emailed": True, "emailed_at": datetime.now(timezone.utc),
                              "status": "emailed"}},
                )
                logger.info(f"Abandoned cart email -> {cart['email']} ok={ok}")
        except Exception as e:
            logger.exception(f"abandoned_cart_worker error: {e}")
        await asyncio.sleep(300)  # every 5 min


# ---- Account ----
@api.get("/account/orders")
async def my_orders(user: dict = Depends(get_current_user)):
    cursor = db.payment_transactions.find({
        "$or": [{"email": user["email"]}, {"user_id": user["id"]}],
        "payment_status": "paid",
    }).sort("created_at", -1).limit(50)
    out = []
    async for tx in cursor:
        out.append({
            "session_id": tx["session_id"],
            "order_id": tx.get("printify_order_id") or tx["session_id"][-10:].upper(),
            "amount": tx.get("amount"),
            "shipping": tx.get("shipping", SHIPPING_FLAT),
            "items": tx.get("items", []),
            "shipping_address": tx.get("shipping_address"),
            "created_at": tx.get("created_at"),
            "fulfillment_status": tx.get("fulfillment_status", "pending"),
        })
    return {"orders": out}


# ---------- Mount ----------
app.include_router(auth_router)
app.include_router(api)


# ---------- Startup ----------
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.payment_transactions.create_index("session_id", unique=True)
    await db.payment_transactions.create_index([("email", 1), ("payment_status", 1)])
    await db.reviews.create_index([("product_id", 1), ("user_id", 1)], unique=True)
    await db.abandoned_carts.create_index([("email", 1), ("status", 1)])
    await db.login_attempts.create_index("identifier")
    asyncio.create_task(abandoned_cart_worker())
    logger.info("Foundation Labs API ready.")


@app.get("/")
async def health():
    return {"app": "Foundation Labs", "ok": True}
