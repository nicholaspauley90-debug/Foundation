# Foundation Apparel & Skin Labs — PRD

## Original Problem Statement
> "I want you to finish the website I started on Github... Skin Labs portion as a drop for later additions. I have added my API for my apparel side of the site."

Replacing user's Shopify store with a premium, fully custom e-commerce experience.

## User Choices
- Build fresh (Shopify store as reference)
- Printify drop-shipping API (token + shop_id 27896224)
- Stripe Checkout (test mode keys supplied)
- Earthy minimal aesthetic — cream / sage / black / grey
- **Customer accounts**: JWT email+password (no third-party login)
- **Auto-fulfillment**: A — fully hands-off (Printify auto-sent to production on Stripe paid)
- **Reviews**: Verified-buyer only
- **Email**: Gmail SMTP (shopfoundationlabs@gmail.com + App Password)
- **Shipping address**: collected on our /checkout page before Stripe redirect
- Skin Labs = "Coming Soon" + email capture (no products yet)

## Architecture
- **Frontend**: React 18 + Tailwind + React Router v6 + lucide-react.
- **Backend**: FastAPI + Motor (MongoDB) + httpx (Printify) + emergentintegrations (Stripe) + smtplib (Gmail) + bcrypt + PyJWT.
- **DB Collections**: `users`, `payment_transactions`, `reviews`, `abandoned_carts`, `login_attempts`, `newsletter`.

## Core Requirements (Static)
1. Premium "wow" UX
2. Live apparel sync from Printify
3. Stripe Checkout + flat $6.99 shipping (server-side priced)
4. Skin Labs "Coming Soon" page + newsletter
5. SEO meta tags
6. Mobile responsive
7. JWT auth + customer accounts + order history
8. Verified-buyer-only reviews
9. Order confirmation emails + abandoned-cart recovery
10. Auto-create Printify order on Stripe paid webhook

## What's Implemented (Iteration 2 — Jan 2026)
### Iteration 1 (✅ done)
- Multi-page site: Home, Shop, Product Detail, Cart, Skin Labs, About, Checkout Success, 404
- Editorial design system (Fraunces + Outfit + JetBrains Mono, cream/sage/stone, grain, marquee, fade-up)
- Sticky header + slide-out cart drawer + cart-count badge
- Printify product sync (4 products, server-cached 120s)
- Stripe Checkout — server-side re-pricing
- Newsletter capture
- SEO meta + OG tags
- All elements have `data-testid`

### Iteration 2 (✅ done — this session)
- **JWT auth**: `/api/auth/{register,login,logout,me}` with bcrypt + cookie + Bearer token. Brute-force lockout (5 attempts / 15 min) using `X-Forwarded-For` (works behind k8s ingress).
- **Frontend auth**: AuthContext, Login + Register pages, /account with order history, User icon in header.
- **Checkout page** (`/checkout`): Address form (email, name, address1/2, city, region, ZIP, country, phone). Order summary panel. Replaces direct-to-Stripe flow.
- **Auto-fulfillment**: On Stripe `paid` (via webhook OR status polling), backend creates Printify order with shipping address, then auto-submits to production. Idempotent.
- **Gmail SMTP**: HTML order confirmation email with brand template. Verified working (real test email sent).
- **Abandoned-cart recovery**: `/api/cart/track` upserts cart on checkout page; background worker (every 5 min) emails carts ≥ 60 min old once.
- **Verified-buyer reviews**: `GET /api/products/{id}/reviews` (public), `POST` requires auth AND a paid transaction with the product. One review per user per product (upsert). Reviews section on ProductDetail with star ratings, write form, signin CTA.
- **Account page**: `GET /api/account/orders` lists paid orders with fulfillment status.
- **CORS** restricted to FRONTEND_URL + localhost.

### Testing Status
- iter 2 backend: 26/26 pytest pass
- iter 2 frontend critical flows: 100% verified
- All HIGH/CRITICAL issues fixed (brute-force lockout fix verified — 6th attempt → 429)

## Backlog / Next Steps
### P1
- Real per-variant shipping rates from Printify (currently $6.99 flat)
- Order status emails on Printify webhook events (shipped/delivered)
- Customer-facing tracking number once Printify ships
- Forgot-password flow (email reset link)

### P2
- Search product autocomplete
- Wishlist / saved items
- Discount codes
- Sitemap.xml + robots.txt
- Google Analytics / Meta Pixel
- Skin Labs product launch when formulations ready

### Deployment Plan
- **Frontend** → Vercel/Netlify (free)
- **Backend** → Emergent or Railway/Render
- **DB** → MongoDB Atlas free tier
- **Repo** → "Save to GitHub" button in this chat

## Key Files
- `/app/backend/server.py` — main + checkout + reviews + account + abandoned cart worker
- `/app/backend/auth.py` — JWT register/login/me/logout + brute-force lockout
- `/app/backend/emailer.py` — Gmail SMTP + HTML templates (order confirmation, abandoned cart)
- `/app/frontend/src/context/AuthContext.js`
- `/app/frontend/src/pages/{Login,Register,Account,CheckoutPage,...}.js`
- `/app/frontend/src/components/Reviews.js`
- `/app/memory/test_credentials.md`

## Notable Env Variables
- `JWT_SECRET` — HS256 signing key
- `GMAIL_USER` / `GMAIL_APP_PASSWORD` — Gmail SMTP
- `PRINTIFY_AUTO_FULFILL=true` — auto-send to Printify production
- `ABANDONED_CART_DELAY_MIN=60` — minutes before abandoned-cart email
- `FRONTEND_URL` — for CORS + email CTAs
