# Rooftop Solar — lead qualification, quotes and project tracking

A web app for a rooftop-solar installer in Vidarbha:

1. Homeowners fill a short form and upload an electricity bill.
2. AI reads the bill. Staff confirm the values, and the lead gets a transparent score with a recommended system size.
3. Sales builds a same-day quote with subsidy and payback, worked out from **dated rule tables**, never by AI.
4. Customers track their installation through a status link.

## Quick start

```bash
npm install
cp .env.example .env          # fill in values (see below)
npx prisma dev --name solar   # local Postgres (or use any Postgres URL)
npm run db:migrate
npm run db:seed
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
