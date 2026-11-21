# Diba Meals

Diba Meals is a meal pre-order app for multi-day Nigerian church programmes. An attendee finds a programme, picks days and meal periods, pays, and collects a meal pass for each slot at the venue.

This repository is through **Phase 2 (ordering)**: the Next.js app, design tokens, the Prisma schema for all five phases, seed data, the landing page, the programme list, and the ordering flow (day × meal-period grid, menu, meal plans, cart, and priced review). Paystack, passes, and admin screens come in later phases.

## Run it

PostgreSQL has to be running. The local default user is `diba` / `diba` and the database is `diba_meals`.

```bash
cp .env.example .env
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Open [http://127.0.0.1:4317](http://127.0.0.1:4317). A production build uses the same port:

```bash
npm run build
npm start
```

Ordering lives at `/p/<slug>` (for example `/p/crossover-convention-2026`) and a short code redirects from `/c/CROSS26`. The review page is `/p/<slug>/review`. `PAYMENTS_MODE=mock` is enough for this phase; checkout is not wired yet.

```bash
npm run lint
npm run typecheck
npm test
npx prisma migrate dev    # after a schema change
```

## Environment

See `.env.example` for the full list. Phase 1 only needs:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for metadata and the sitemap |
| `NEXT_PUBLIC_WHATSAPP_E164` | WhatsApp support number, digits only |
| `PAYMENTS_MODE` | `mock` until Paystack keys are set |
| `AUTH_SECRET` | Staff auth secret (used from phase 4) |
| `PASS_TOKEN_SECRET` | HMAC secret for meal-pass QR tokens (phase 3) |

Paystack, Resend, Cloudinary or Supabase Storage, and Google Maps are listed in `.env.example` and stay empty in mock mode.

**Google Maps:** restrict `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` by HTTP referrer in Google Cloud (your production domain and `http://localhost:4317/*`). Keep `GOOGLE_MAPS_API_KEY` server-side only. Places autocomplete is for admin venue setup, not the public site.

**Paystack:** use test keys from the Paystack dashboard. Set the webhook to `https://<host>/api/paystack/webhook` (that route arrives in phase 3). For local webhooks, tunnel with ngrok and paste the HTTPS URL into Paystack. `PAYMENTS_MODE=mock` lets the later checkout be demoed without keys.

**Images:** seed files live in `public/images`. Production uploads should use Cloudinary or Supabase Storage with a bucket that is not named `dev`.

## Seeded programmes

- **Grace Assembly Lagos** at Grace Camp Ground, Lekki-Epe Expressway, with three delivery points.
- **Crossover Convention 2026** (`CROSS26`), 27–31 Dec 2026, Morning 07:00–09:00 and Evening 18:00–20:00, 24-hour cutoff, 300 seats a slot.
- **Year-End Retreat** (`RETREAT26`), 18–20 Dec 2026, Morning only.
- A draft, **Ministers' Preview** (`DRAFT26`), is stored and hidden from the public list.
- About 20 menu items with variants, three meal plans on the crossover, and promo code `CROSS10`.

Re-running the seed wipes and reloads these rows.

## Staff logins (seed only, not for production)

| Role | Email | Password |
| --- | --- | --- |
| Super admin | ada.admin@dibameals.test | DibaAdmin!2026 |
| Kitchen | kitchen@dibameals.test | DibaKitchen!2026 |
| Dispatch | dispatch@dibameals.test | DibaDispatch!2026 |

Staff sign-in is phase 4. The hashes are in the database so that phase does not need a new seed shape.

## Later phases

1. Foundation
2. Programme page, day × period grid, menu, plans, cart, priced review, business-rule tests (this app)
3. Checkout, Paystack and mock mode, webhook, meal passes, email, my orders
4. Admin, kitchen sheet, dispatch scanner, promo codes
5. Dynamic OG images, analytics events, rate limits, Playwright, deploy checklist
