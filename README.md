# Diba Meals

Diba Meals is a meal pre-order app for multi-day Nigerian church programmes. An attendee finds a programme, picks days and meal periods, pays, and collects a meal pass for each slot at the venue.

This repository is through **Phase 4 (admin and ops)**: checkout and payments, plus staff sign-in, the ops dashboard, kitchen prep sheets, and dispatch with a pass scanner. Polish, analytics, and the Playwright suite come in a later phase.

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

Ordering lives at `/p/<slug>` (for example `/p/crossover-convention-2026`) and a short code redirects from `/c/CROSS26`. Review is `/p/<slug>/review`, checkout is `/p/<slug>/checkout`, and a paid order opens at `/orders/<reference>?token=...`. My orders is `/my-orders`.

`PAYMENTS_MODE=mock` reserves the seats and shows a "Mark as paid" step. No card is charged. Set `PAYMENTS_MODE=live` with `PAYSTACK_SECRET_KEY` and `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` to open Paystack Popup. The webhook is `https://<host>/api/paystack/webhook` (HMAC SHA512 of the raw body). For a local webhook, tunnel with ngrok and paste that HTTPS URL into the Paystack dashboard. Point Paystack at the test secret.

Leave `RESEND_API_KEY` blank to print confirmation and magic-link emails in the server log. With a key, mail goes out through Resend from `EMAIL_FROM`.

`GET /api/cron/release-holds` with `Authorization: Bearer $CRON_SECRET` cancels `PENDING_PAYMENT` orders older than 30 minutes so the seat count matches the hold window.

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

Staff sign in at `/admin/login`. The kitchen opens `/admin/kitchen`, dispatch opens `/admin/dispatch`, and an admin sees the full dashboard. Pass scans only succeed on the meal's day, inside the delivery window (45 minutes either side), and a pass works once.

## Later phases

1. Foundation
2. Programme page, day × period grid, menu, plans, cart, priced review, business-rule tests
3. Checkout, Paystack and mock mode, webhook, meal passes, email, my orders
4. Admin, kitchen sheet, dispatch scanner, promo codes (this app)
5. Dynamic OG images, analytics events, rate limits, Playwright, deploy checklist
