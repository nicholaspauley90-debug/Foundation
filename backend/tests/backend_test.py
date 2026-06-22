"""Backend tests for Foundation Apparel & Skin Labs.

Covers:
- /api/products (list)
- /api/products/{id} (detail + 404)
- /api/checkout/session (valid + invalid product/variant)
- /api/checkout/status/{id}
- /api/newsletter (idempotent)
- Mongo payment_transactions persistence
"""
import os
import uuid
import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "foundation_labs")


@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="session")
def mongo():
    client = MongoClient(MONGO_URL)
    return client[DB_NAME]


@pytest.fixture(scope="session")
def products(s):
    r = s.get(f"{API}/products", timeout=45)
    assert r.status_code == 200, r.text
    return r.json()["products"]


# ---------- Products ----------
class TestProducts:
    def test_list_products(self, products):
        assert isinstance(products, list)
        assert len(products) == 4, f"Expected 4 products, got {len(products)}"
        for p in products:
            for k in ("id", "title", "price_min", "price_max", "image"):
                assert k in p, f"Missing key {k} in product {p}"
            assert isinstance(p["price_min"], (int, float))
            assert isinstance(p["price_max"], (int, float))

    def test_product_detail(self, s, products):
        pid = products[0]["id"]
        r = s.get(f"{API}/products/{pid}", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert data["id"] == pid
        assert "variants" in data and len(data["variants"]) > 0
        assert "options" in data
        assert "images" in data and len(data["images"]) > 0
        # variant should have price + id
        v = data["variants"][0]
        assert "id" in v and "price" in v

    def test_product_not_found(self, s):
        r = s.get(f"{API}/products/non_existent_id_xyz", timeout=30)
        assert r.status_code == 404


# ---------- Checkout ----------
class TestCheckout:
    def _enabled_variant(self, detail):
        for v in detail["variants"]:
            if v.get("is_enabled"):
                return v
        return detail["variants"][0]

    @pytest.fixture(scope="class")
    def session_data(self, s, products):
        pid = products[0]["id"]
        detail = s.get(f"{API}/products/{pid}").json()
        v = self._enabled_variant(detail)
        payload = {
            "items": [{
                "product_id": pid,
                "variant_id": v["id"],
                "title": detail["title"],
                "variant_title": v.get("title"),
                "image": detail["images"][0]["src"] if detail["images"] else None,
                "quantity": 1,
            }],
            "origin_url": BASE_URL,
        }
        r = s.post(f"{API}/checkout/session", json=payload, timeout=60)
        assert r.status_code == 200, r.text
        return r.json(), v

    def test_checkout_session_creates(self, session_data):
        data, v = session_data
        assert "url" in data and "session_id" in data and "amount" in data
        assert "checkout.stripe.com" in data["url"]
        expected = round(v["price"] + 6.99, 2)
        assert abs(data["amount"] - expected) < 0.01, f"Amount {data['amount']} != {expected}"

    def test_payment_transaction_persisted(self, session_data, mongo):
        data, _ = session_data
        rec = mongo.payment_transactions.find_one({"session_id": data["session_id"]})
        assert rec is not None
        assert rec["status"] == "initiated"
        assert rec["payment_status"] == "unpaid"
        assert rec["shipping"] == 6.99

    def test_checkout_status(self, s, session_data):
        data, _ = session_data
        r = s.get(f"{API}/checkout/status/{data['session_id']}", timeout=30)
        assert r.status_code == 200
        body = r.json()
        for k in ("status", "payment_status", "amount_total", "currency", "metadata"):
            assert k in body

    def test_invalid_product_id(self, s):
        payload = {
            "items": [{
                "product_id": "bogus_pid_xxx",
                "variant_id": 1,
                "title": "x",
                "quantity": 1,
            }],
            "origin_url": BASE_URL,
        }
        r = s.post(f"{API}/checkout/session", json=payload, timeout=30)
        assert r.status_code == 400

    def test_invalid_variant_id(self, s, products):
        pid = products[0]["id"]
        payload = {
            "items": [{
                "product_id": pid,
                "variant_id": 999999999,
                "title": "x",
                "quantity": 1,
            }],
            "origin_url": BASE_URL,
        }
        r = s.post(f"{API}/checkout/session", json=payload, timeout=30)
        assert r.status_code == 400


# ---------- Newsletter ----------
class TestNewsletter:
    def test_newsletter_signup_and_idempotency(self, s, mongo):
        email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        r1 = s.post(f"{API}/newsletter", json={"email": email}, timeout=15)
        assert r1.status_code == 200
        b1 = r1.json()
        assert b1.get("ok") is True
        assert not b1.get("already_subscribed")

        r2 = s.post(f"{API}/newsletter", json={"email": email}, timeout=15)
        assert r2.status_code == 200
        assert r2.json().get("already_subscribed") is True

        # cleanup
        mongo.newsletter.delete_one({"email": email})
