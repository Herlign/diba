# Diba Meals

Diba Meals is a meal pre-order app for multi-day Nigerian church programmes. An attendee finds a programme, picks days and meal periods, pays, and collects a meal pass for each slot at the venue.

This repository is through **Phase 5 (polish)**: the ordering and ops product, with security headers, optional analytics, dynamic Open Graph images, rate limits, and a Playwright pass of the mock checkout.

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
npm run test:e2e          # needs the app already running on port 4317
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

Staff sign in at `/admin/login`. The kitchen opens `/admin/kitchen`, dispatch opens `/admin/dispatch`, and an admin sees the full dashboard. Pass scans only succeed on the meal's day, inside the delivery window (45 minutes either side), and a pass works once. The passwords in the table above are seed data. Replace them before a public launch.

## Deploy

Production target is Vercel, with Postgres on Neon or Supabase. Paystack, Resend, and the hold-release cron are configured after the first deploy.

1. Create a Postgres database. Copy its connection string into `DATABASE_URL`. It must include `?sslmode=require` on Neon and Supabase.
2. Push this repo to GitHub and import it in Vercel. Framework preset: Next.js. Set the env vars below in the Vercel project before the first build.
3. `NEXT_PUBLIC_SITE_URL` must be the real `https://` origin. Vercel bakes `NEXT_PUBLIC_*` at build time, so change it and redeploy if the domain moves.
4. After the first successful deploy, run `npx prisma migrate deploy` against that database (Vercel does not run migrations for you) and then `npx prisma db seed` once. Do not seed production passwords into a public database. Create real staff from the admin invite form and then disable the seed accounts.
5. Paystack: create live keys. Set `PAYMENTS_MODE=live`, `PAYSTACK_SECRET_KEY`, and `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`. In the Paystack dashboard set the webhook to `https://<domain>/api/paystack/webhook`. Paystack signs the raw body with HMAC SHA512. The handler rejects a bad signature and applies a successful charge only once, and only when the amount in kobo and the currency are NGN matching the order.
6. Resend: verify the sending domain, then set `RESEND_API_KEY` and `EMAIL_FROM` to an address on that domain, such as `Diba Meals <orders@yourdomain>`. With no key, mail is printed to the server log and the magic link is shown on the page.
7. Cron: call `GET https://<domain>/api/cron/release-holds` every 10 minutes with header `Authorization: Bearer <CRON_SECRET>`. Vercel Cron can hit that path. It cancels `PENDING_PAYMENT` orders older than 30 minutes so the seat is free. The seat count already ignores those holds. The cron just closes the rows.
8. Google Maps: restrict `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` by HTTP referrer to the production domain. Keep `GOOGLE_MAPS_API_KEY` server-side. Places is for admin venue setup.
9. Analytics is off until `NEXT_PUBLIC_GTM_ID` and/or `NEXT_PUBLIC_META_PIXEL_ID` are set. The app then sends `view_programme`, `add_to_cart`, `begin_checkout`, and `purchase`.
10. Rate limits, in memory per server instance: checkout 8 per phone per 10 minutes, magic links 5 per email per 10 minutes, staff login 8 per email per 10 minutes, pass scans 40 per staff member per 10 minutes. A multi-instance host does not share that counter. Put a shared store in front of it before a large launch.

### Launch checklist

- [ ] `DATABASE_URL` points at production Postgres and `npx prisma migrate deploy` has been run
- [ ] Seed accounts are removed or their passwords changed
- [ ] `AUTH_SECRET` and `PASS_TOKEN_SECRET` are long random strings, not the dev placeholders
- [ ] `NEXT_PUBLIC_SITE_URL` is the production origin
- [ ] `PAYMENTS_MODE=live` and both Paystack keys are the live pair
- [ ] Paystack webhook URL is saved and a test charge updates one order once
- [ ] Resend domain is verified and a confirmation email arrives
- [ ] Cron hits `/api/cron/release-holds` with `CRON_SECRET`
- [ ] Maps key is referrer-restricted
- [ ] `npm test` and `npm run test:e2e` pass against the release build
- [ ] A phone can open a programme, pay in test or live, and show a meal pass

### Env vars

| Variable | Required in production |
| --- | --- |
| `DATABASE_URL` | Yes |
| `NEXT_PUBLIC_SITE_URL` | Yes |
| `AUTH_SECRET` | Yes |
| `PASS_TOKEN_SECRET` | Yes |
| `PAYMENTS_MODE` | Yes (`live` or `mock`) |
| `PAYSTACK_SECRET_KEY` | Yes when live |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Yes when live |
| `RESEND_API_KEY` | Yes, to send mail |
| `EMAIL_FROM` | Yes, on the verified domain |
| `CRON_SECRET` | Yes |
| `NEXT_PUBLIC_WHATSAPP_E164` | Yes, support number |
| `NEXT_PUBLIC_GTM_ID` | No |
| `NEXT_PUBLIC_META_PIXEL_ID` | No |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | No, admin places |
| `GOOGLE_MAPS_API_KEY` | No |

## Later phases

1. Foundation
2. Programme page, day × period grid, menu, plans, cart, priced review, business-rule tests
3. Checkout, Paystack and mock mode, webhook, meal passes, email, my orders
4. Admin, kitchen sheet, dispatch scanner, promo codes
5. SEO and OG images, analytics, rate limits, security headers, Playwright, deploy guide (this app)
