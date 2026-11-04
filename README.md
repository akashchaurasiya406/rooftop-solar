# Rooftop Solar — lead qualification, quotes and project tracking

A web app for a rooftop-solar installer in Vidarbha:

1. Homeowners fill a short form and upload an electricity bill.
2. AI reads the bill. Staff confirm the values, and the lead gets a transparent score with a recommended system size.
3. Sales builds a same-day quote with subsidy and payback, worked out from **dated rule tables**, never by AI.
4. Customers track their installation through a status link.

## Quick start

Needs a Postgres database. A free [Neon](https://neon.tech) project works; put its connection string in `.env`.

```bash
npm install
cp .env.example .env          # set DATABASE_URL and SESSION_SECRET
npx prisma migrate deploy     # create tables
npm run db:seed               # demo data (re-run any time to reset)
npm run dev                   # http://localhost:3000
```

Demo accounts (password `Demo@1234`): `sales@demo.solar`, `manager@demo.solar`, `homeowner@demo.solar`.

## Scripts

| Command | What it does |
|---|---|
| `npm test` | Unit tests (quote maths, scoring, dated rules, auth) |
| `npm run typecheck` | TypeScript check |
| `npm run db:seed` | Reset demo data |

## Layout

```
prisma/            schema + seed data
src/lib/calc/      quote maths, subsidy, scoring, dated rules (pure, tested)
src/lib/auth/      sessions, role checks, validation
src/app/           pages (sales, my, auth)
src/components/    shared UI
ASSUMPTIONS.md     every assumption not in the client brief
```
