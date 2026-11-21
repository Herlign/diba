# Diba Meals

Diba Meals is a meal pre-order and venue delivery app for multi-day Nigerian church programmes. Churches publish a programme, attendees choose a plate for each meal, and the kitchen packs those plates for a named section at the venue.

This repository is **Phase 1 (foundation)** only: design tokens, the full database schema, seed data, the marketing landing page, and the public programme list. Ordering, payment, the kitchen board, and admin tools are modelled in the database and not built in the interface yet.

## Run it

```bash
cp .env.example .env
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

The app listens on [http://127.0.0.1:4317](http://127.0.0.1:4317).

Other commands:

```bash
npm run lint
npm run typecheck
npm test
npx prisma migrate dev    # after you change prisma/schema.prisma
npx prisma db seed        # resets and reloads sample data
```

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | SQLite URL. Local default is `file:./dev.db`, stored as `prisma/dev.db`. |

No API keys. Paystack is a field on `Payment` for a later phase.

## Sample data

Meal packs are priced for Lagos in late 2026, from ₦6,500. The seed builds dates from the day you run it, so the list always has something open, something only announced, something closed, and something already held. A draft programme in Enugu is stored and hidden from the public list. One delivered order (`DIBA-WOF-1042`) exercises payments, delivery, and kitchen batches. Re-running the seed wipes those rows and writes them again.

Seeded accounts are email records only. There are no passwords.

## Later phases the schema already allows

1. Foundation (this app)
2. Programme detail and the menu for each meal
3. A multi-day cart that respects the 6pm cutoff
4. Paystack checkout
5. Kitchen batches and rider handover
6. Coordinator and admin tools
