# Assumptions

The brief says: use only the information in the problem statement and label every assumption.
Every number or rule below that is **not** in the brief is listed here, with where it lives in the code.

| ID | Assumption | Why | Where |
|---|---|---|---|
| A-01 | Two staff roles: `SALES` and `ADMIN` (sales manager). Only `ADMIN` edits price and subsidy tables. | The brief asks for admin tables but names only "sales staff". Rule changes affect money, so they should be restricted. | `prisma/schema.prisma` (Role) |
| A-02 | Homeowners create their own account. Staff accounts are created by an admin, never through public sign-up. | Prevents anyone from signing up as staff. | `src/app/(auth)/actions.ts` |
| A-03 | Subsidy for fractional kW is paid pro-rata (2.5 kW → 2 × ₹30,000 + 0.5 × ₹18,000). | The brief gives per-kW slabs but doesn't cover fractions. | `src/lib/calc/quote.ts` |
| A-04 | Units used at home save the full tariff. Surplus units are exported under net metering at a lower export rate. | Needed for payback; the brief gives only generation (1,400 units/kW/yr). | `src/lib/calc/quote.ts` |
| A-05 | Score thresholds: bill under ₹1,000 or under 120 units/month means a small bill; ₹2,500+ means a good bill. | Brief sample: ₹650 is "Low (small bill)", ₹3,200 is "High". Kept in one constant so they're easy to tune. | `src/lib/calc/scoring.ts` (THRESHOLDS) |
| A-06 | System size is capped at the sanctioned load on the bill (no load-extension application in scope). | Avoids quoting systems that need extra DISCOM paperwork. | `src/lib/calc/scoring.ts` |
| A-07 | Without a confirmed bill, units are estimated as bill ÷ ₹9.4. | Lets a lead get a provisional score before the AI reads the bill. | `src/lib/calc/scoring.ts` |
| A-08 | Installed price per kW: ₹65,000 (1–2.99 kW), ₹58,000 (3–5.99 kW), ₹54,000 (6–10 kW). | Not in the brief. Editable dated table. | `prisma/seed.ts`, `PriceRule` |
| A-09 | Tariff ₹9.4/unit, export ₹3.5/unit, 100 sq ft of shade-free roof per kW. | Not in the brief. Editable dated table. | `prisma/seed.ts`, `CalcSetting` |
| A-10 | Residential systems capped at 10 kW. | Keeps quotes in the residential scheme's range. | `src/lib/calc/scoring.ts` |
| A-11 | The current subsidy rule starts on 2026-04-01. An older seed-only rule exists purely to demonstrate dated lookups; it is not a real scheme value. | The brief gives the rule but not its start date, and says to verify before launch. | `prisma/seed.ts` |
| A-12 | Rule dates: `effectiveFrom` is inclusive, `effectiveTo` is exclusive. If two rules overlap, the most recently started one wins, and admins are warned. | Makes rule changes safe without first closing the old rule. | `src/lib/calc/rules.ts` |
| A-13 | All seeded people, phone numbers (starting 99990) and consumer numbers are fictional. | The brief forbids real personal data in the repository. | `prisma/seed.ts` |
