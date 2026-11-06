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
| A-14 | Bill photos and PDFs are stored in Postgres (compressed on the phone to ~300 KB first) and served only through an access-checked route. | Vercel has no permanent disk; this avoids another service and keeps access control in one place. For scale, move to object storage. | `src/app/api/bills/[id]/file/route.ts` |
| A-15 | Uploads are limited to 4 MB, and the real file type is checked from the file's bytes (JPEG, PNG, WebP, HEIC, PDF). | Vercel's request limit is 4.5 MB; extension checks are easy to fake. | `src/lib/files.ts` |
| A-16 | AI confidence below 50% on units, an unreadable photo, or a non-bill triggers an immediate re-upload request. Confidence below 80% highlights the field for staff. | The brief: "a poor photo triggers a re-upload", and values appear beside the image for confirmation. | `src/lib/ai/extraction.ts` |
| A-17 | A bill amount more than 40% away from what the homeowner typed is flagged for staff, not rejected. | Catches misreads (and wrong bills) without blocking honest estimates. | `src/lib/ai/extraction.ts` |
| A-18 | Plausible ranges: 1–5,000 units/month, 0.5–50 kW load, 9–15 digit consumer number. | Residential bills outside these are almost certainly misreads. | `src/lib/ai/extraction.ts` |
| A-19 | Service area = pincodes starting 440–445 (Vidarbha). Outside it, the lead scores LOW with a reason and gets a call, never a rejection. | The client works "across Vidarbha"; the brief says a low score never rejects a lead. | `src/lib/service-area.ts` |
| A-20 | New leads go to the sales person with the fewest open leads. | The brief doesn't cover assignment; workload balancing is the simplest fair rule. | `src/lib/leads/service.ts` |
| A-21 | A homeowner can create 5 requests a day and upload 10 bills an hour. | Protects the free AI quota and the team from spam. | `src/lib/leads/service.ts` |
| A-22 | The score is recomputed from AI-read values right away (provisional), and again from staff-confirmed values, which are final. | Staff see a useful ranking immediately; final routing always uses confirmed values. | `src/lib/leads/service.ts` |
| A-23 | If the AI is unavailable, the bill is kept and marked for manual entry; the homeowner is told the team will read it by hand. | AI downtime must never lose a lead. | `src/lib/leads/service.ts` |
| A-24 | Quotes offer the chosen size plus one size below and one above, in 0.5 kW steps between 1 and 10 kW. | The brief asks for "system options"; three choices stay readable on a phone. | `src/lib/quotes/options.ts` |
| A-25 | A quote is valid for 15 days and asks for a 20% advance, rounded to ₹100. | Not in the brief. Common practice; short validity limits exposure to subsidy and price changes. | `src/lib/quotes/options.ts` |
| A-26 | Only the latest quote for a lead can be accepted; accepting it marks older open quotes as replaced. | Prevents a customer from accepting an outdated price. | `src/lib/quotes/service.ts` |
| A-27 | Tenants are not quoted until the owner consents; staff must confirm the bill before quoting. | Quotes must rest on confirmed numbers, and tenants can't authorise roof work. | `src/lib/quotes/service.ts` |
| A-28 | Project stages: advance paid → materials dispatched → installed → net meter applied → net meter installed → subsidy applied → subsidy credited. Stages move one step at a time. | The brief says "from advance to subsidy credited"; net metering with the DISCOM is its own step. | `src/lib/projects/stages.ts` |
| A-29 | "Stuck" means longer than usual in a stage: 7 days (advance, materials, net meter installed), 5 (installed), 21 (net meter applied), 45 (subsidy applied). | Not in the brief; starting values for the dashboard, kept in one table. | `src/lib/projects/stages.ts` |
| A-30 | The customer status link uses a random 32-character token, needs no login, shows only first name, size, district and stages, and is hidden from search engines. | Cuts "where is my project?" calls without exposing personal data (DPDP Act). | `src/app/status/[token]/page.tsx` |
| A-31 | WhatsApp messages and the advance payment are mocked: messages are logged on the project, and no money is taken. | The brief says to mock payments, messages and outside systems. | `src/lib/quotes/service.ts` |
| A-32 | Rules are never edited. A new rule must start after the latest one, and the old rule ends the moment the new one starts. Only sales managers can add rules. | Every issued quote stays traceable to the exact rule it used. | `src/lib/rules-admin.ts` |
| A-33 | The quote PDF writes amounts as "Rs." because the built-in PDF fonts have no ₹ symbol. | Avoids shipping a font file; "Rs." is standard on Indian invoices. | `src/lib/quotes/pdf.tsx` |
