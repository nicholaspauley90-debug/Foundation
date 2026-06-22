# Test Credentials — Foundation Labs

> Created during development for testing auth + reviews flows.

| Email | Password | Notes |
|---|---|---|
| `test1@example.com` | `testpass123` | Smoke-test user from iter 2 |

Create more via `POST /api/auth/register` (e.g., `qa-{rand}@example.com / Qatest1234`).

## Verified-buyer review path
To allow a user to leave a review, insert a paid transaction containing the product:
```js
db.payment_transactions.insertOne({
  session_id: "manual_test",
  email: "test1@example.com",
  payment_status: "paid",
  items: [{ product_id: "<PRINTIFY_PRODUCT_ID>", variant_id: 12345, quantity: 1 }],
  amount: 36.11
});
```

## Brute-force lockout
5 failed login attempts (same IP+email) within 15 min → HTTP 429.
Behind k8s ingress, the real client IP is read from `X-Forwarded-For`.
