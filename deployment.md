# Deployment

**Live app:** https://rooftop-solar-omega.vercel.app
**Repository:** https://github.com/akashchaurasiya406/rooftop-solar

## Demo logins

Every demo account uses the password **`Demo@1234`**. The sign-in page also lists them, and tapping one fills in the form.

| Role | Email | What to try |
|---|---|---|
| Homeowner | `homeowner@demo.solar` | Open request LD-30881, read the quote, download the PDF, accept it, then open the status link |
| Sales staff | `sales@demo.solar` | Leads → "Check bill" → Sunita Deshmukh (one value flagged by the AI) → confirm; build a quote for Vijay Raut; Projects → move a stage |
| Sales manager | `manager@demo.solar` | Everything sales can do, plus **Rules** (add a dated subsidy or price rule) |

To try the full homeowner journey, create a new account on **Sign up**. On the form, use **"Blurry sample"** to see the re-upload request, then **"Clear sample"** to see the bill being read.

Use the **EN / हिं / मरा** switch for Hindi or Marathi and the moon icon for dark mode.

## Run it locally

Requirements: Node.js 20 or newer, and a PostgreSQL database. A free [Neon](https://neon.tech) project works.

```bash
git clone https://github.com/akashchaurasiya406/rooftop-solar.git
cd rooftop-solar
npm install                      # also generates the Prisma client
cp .env.example .env             # then fill in the values (see below)
npx prisma migrate deploy        # creates the tables
npm run db:seed                  # demo users, leads, bills, quotes, projects, feedback
npm run dev                      # http://localhost:3000
```

Useful scripts:

| Command | Purpose |
|---|---|
| `npm test` | Unit tests (124): quote maths, dated rules, scoring, AI decision rules, validation, access control, translations |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run build && npm start` | Production build, run locally |
| `npm run db:seed` | Reset demo data. Real feedback is kept; only sample feedback is replaced. |

Bill reading needs a Google Gemini API key. Without one, uploads still work: the bill is saved and staff enter the values by hand.

## Environment variables

Names only. Values live in `.env` locally (git-ignored) and in the Vercel project settings.

| Name | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string. On Vercel, use Neon's **pooled** URL with `&pgbouncer=true`. |
| `SESSION_SECRET` | Yes | At least 32 random characters; signs the login cookie. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `AI_API_KEY` | For bill reading | Google Gemini API key |
| `AI_MODEL` | No | Default `gemini-3.5-flash` |
| `AI_FALLBACK_MODEL` | No | Default `gemini-flash-lite-latest`, used when the main model is busy |
| `APP_URL` | No | Public address used in seeded WhatsApp messages. The app otherwise works out its address from each request. |
| `DEMO_MODE` | No | Set to `false` to hide the demo-account panel on the sign-in page |

## How it is deployed

- **Hosting:** Vercel, connected to the GitHub repository. Every push to `main` builds and deploys automatically.
- **Region:** server functions run in Singapore (`sin1`, set in `vercel.json`), next to the Neon database in `ap-southeast-1`.
- **Database:** Neon PostgreSQL, free tier. Schema changes are versioned in `prisma/migrations` and applied with `npx prisma migrate deploy`.
- **Files:** bill photos and PDFs are compressed on the phone, then stored in Postgres and served only through an access-checked route. No separate file storage is needed.
- **Build:** `npm run build` (Next.js 15 with Turbopack). Fonts are bundled with the app, so builds don't depend on Google Fonts.
- **Mocked:** WhatsApp messages (logged on each project), the advance payment (test mode, no money moves), and filing with the DISCOM and subsidy portal, as the brief allows.
