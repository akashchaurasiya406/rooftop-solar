import { QuoteStory } from "@/components/quote-story";
import { SolarIllustration } from "@/components/solar-illustration";
import { ButtonLink, Card, Logo, stagger } from "@/components/ui";
import { getSession } from "@/lib/auth/server";
import { homeFor } from "@/lib/auth/session";
import { computeQuote, type QuoteResult } from "@/lib/calc/quote";
import { getEffectiveRules } from "@/lib/rules-repo";

const STEPS = [
  {
    title: "Tell us about your home",
    body: "Owner or tenant, roof size and your monthly bill. Takes two minutes.",
    icon: "M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10",
  },
  {
    title: "Upload your electricity bill",
    body: "We read it for you and suggest the right system size for your roof.",
    icon: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",
  },
  {
    title: "Get your quote the same day",
    body: "System size, cost after subsidy and payback — in plain numbers.",
    icon: "M5 12.5 10 17 19 7",
  },
];

async function sampleQuote(): Promise<QuoteResult | null> {
  try {
    const rules = await getEffectiveRules();
    return computeQuote({ systemKw: 3, monthlyUnits: 340, bands: rules.bands, subsidy: rules.subsidy, setting: rules.setting });
  } catch {
    return null;
  }
}

export default async function Home() {
  const [session, quote] = await Promise.all([getSession(), sampleQuote()]);

  return (
    <div className="dawn flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl animate-fade items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        {session ? (
          <ButtonLink href={homeFor(session.role)} variant="secondary">Open dashboard</ButtonLink>
        ) : (
          <ButtonLink href="/login" variant="ghost">Sign in</ButtonLink>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 sm:px-8">
        <section className="grid items-center gap-10 pb-16 pt-8 sm:pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-6">
          <div className="stagger">
            <p style={stagger(0)} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1 text-[13px] font-medium text-brand backdrop-blur">
              <span className="size-1.5 rounded-full bg-sun" />
              Rooftop solar across Vidarbha
            </p>
            <h1 style={stagger(1)} className="mt-5 text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-6xl">
              Is solar worth it
              <br />
              for <span className="text-brand">your home?</span>
            </h1>
            <p style={stagger(2)} className="mt-5 max-w-lg text-lg leading-relaxed text-muted">
              Answer a few questions and upload your bill. We&apos;ll tell you the right system size, what the
              government subsidy covers, and how fast it pays for itself.
            </p>
            <div style={stagger(3)} className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/signup" className="group">
                Check my home
                <svg aria-hidden viewBox="0 0 20 20" className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 10h12M11 5l5 5-5 5" />
                </svg>
              </ButtonLink>
              <ButtonLink href="/login" variant="secondary">Track my project</ButtonLink>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg animate-[pop_0.8s_var(--ease-out-soft)_0.15s_both]">
            <SolarIllustration className="w-full" />
          </div>
        </section>

        <section aria-labelledby="how" className="border-t border-line py-14">
          <div className="grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-16">
            <div>
              <h2 id="how" className="text-sm font-medium text-muted">How it works</h2>
              <ol className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                {STEPS.map((s, i) => (
                  <li key={s.title}>
                    <Card interactive className="flex h-full gap-4 p-5 sm:flex-col lg:flex-row lg:items-center">
                      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                        <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d={s.icon} />
                        </svg>
                      </span>
                      <div>
                        <h3 className="font-medium">
                          <span className="num mr-1.5 text-muted">{i + 1}.</span>
                          {s.title}
                        </h3>
                        <p className="mt-1 text-[15px] text-muted">{s.body}</p>
                      </div>
                    </Card>
                  </li>
                ))}
              </ol>
            </div>

            {quote && (
              <div>
                <h2 className="text-sm font-medium text-muted">What a quote looks like</h2>
                <QuoteStory q={quote} label="Home using ~340 units a month" className="mt-6" />
                <p className="mt-3 text-[13px] leading-relaxed text-muted">
                  Worked out from today&apos;s subsidy and price tables. Your quote depends on your roof and bill.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl border-t border-line px-5 py-8 text-sm text-muted sm:px-8">
        Demo project. All names and numbers are fictional.
      </footer>
    </div>
  );
}
