# Foundation Apparel & Skin Labs — PRD

## Original Problem Statement
> "I want you to finish the website I started on Github. And I would like Github to Host my website. Give me a Full working website using what I had started there. I have included my API's in there as well for my drop shipping sites im using to fund my website. I do not have product yet for the Skin Labs portion of my website, so leave that as a Drop for later additions. However I have added my API for my apparel side of the site."

User wanted a more premium "wow" alternative to their existing Shopify store (`shopfoundationlabs.myshopify.com`). The placeholder GitHub repo (`nicholaspauley90-debug/desktop-tutorial`) was a default GitHub-Desktop tutorial repo; built from scratch using Shopify store as design reference.

## User Choices
- Build fresh (option 2) — premium minimalist e-commerce site
- Printify as drop-ship API (token + shop_id 27896224 supplied)
- Stripe Checkout for payments (test keys supplied)
- Brand vibe: **Earthy minimal** — cream / sage green / black / grey / dark grey, fits the "leaf logo" brand
- Skin Labs section = "Coming Soon" (no products yet)
- User provided AI-influencer image assets used for hero/atelier shots

## Architecture
- **Frontend**: React 18 (CRA) + Tailwind + React Router v6 + lucide-react icons. Custom design system (Fraunces serif + Outfit sans + JetBrains mono).
- **Backend**: FastAPI + Motor (MongoDB) + httpx (Printify) + emergentintegrations (Stripe).
- **Database**: MongoDB — `payment_transactions`, `newsletter` collections.
- **External APIs**: Printify (live product sync, 4 products) + Stripe Checkout (test mode).

## Core Requirements (Static)
1. Premium "wow" UX that beats user's current Shopify site
2. Live apparel sync from Printify
3. Stripe Checkout for purchases ($6.99 flat shipping)
4. Skin Labs "Coming Soon" page with email capture
5. SEO meta tags for search-engine discoverability
6. Mobile responsive

## What's Implemented (Jan 2026)
- ✅ Full multi-page site: Home, Shop, Product Detail, Cart, Skin Labs, About, Checkout Success, 404
- ✅ Sticky header with cart drawer + cart-count badge
- ✅ Printify product sync (4 products live, server-cached 120s)
- ✅ Variant selector (size chips + color swatches) auto-selects first ENABLED variant
- ✅ Cart persisted in localStorage; full cart page + slide-out drawer
- ✅ Stripe Checkout integration with server-side re-pricing (anti-tamper) + $6.99 shipping
- ✅ Stripe webhook handler with signature verification + idempotent payment_transactions update
- ✅ Newsletter capture (Skin Labs founding list) — idempotent
- ✅ Checkout success page polls Stripe status (12 attempts × 2s) and clears cart on paid
- ✅ Brutalist-editorial design system: Fraunces serif + Outfit + JetBrains mono, cream/sage/stone palette, grain overlay, marquee, fade-up animations
- ✅ SEO meta tags + OG tags
- ✅ All interactive elements have `data-testid` attributes
- ✅ Backend tests: 9/9 pass (pytest at `/app/backend/tests/backend_test.py`)
- ✅ Frontend critical flows verified by testing agent

## Testing Status
- Backend: 100% (9/9 tests pass)
- Frontend critical flows: 100% verified

## Backlog / Next Steps
### P1
- Skin Labs product launch (when formulations ready) — same architecture, just add products
- Order fulfillment automation: webhook → create Printify order for paid sessions (currently just records payment)
- Email transactional flow (order confirmation + shipping updates) via SendGrid/Resend
- Admin order dashboard

### P2
- Real shipping rates from Printify per-variant (currently flat $6.99)
- Customer accounts + order history
- Product reviews
- Sitemap.xml + robots.txt for SEO
- Google Analytics / Meta Pixel

### Deployment / Hosting Plan
GitHub Pages alone cannot host the FastAPI backend. Recommended split:
- **Frontend** → Vercel (free tier) or Netlify, point custom domain at it
- **Backend** → Emergent deploy (current) or Railway/Render (free tier)
- **Database** → MongoDB Atlas free tier
- **Repo** → GitHub via "Save to GitHub" button in Emergent

## Notable Files
- `/app/backend/server.py` — all API logic
- `/app/frontend/src/pages/*` — page components
- `/app/frontend/src/context/CartContext.js` — cart state
- `/app/frontend/src/lib/api.js` — backend client
