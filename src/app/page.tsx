import Link from "next/link";
import { LanguageToggle } from "@/components/language-toggle";
import { Magnetic, Marquee, Reveal, Spotlight, WordReveal } from "@/components/motion";
import { ProductShowcase, type ShowcaseText } from "@/components/product-showcase";
import { QuoteStory } from "@/components/quote-story";
import { ThemeToggle } from "@/components/theme-toggle";
import { ButtonLink, cx, Logo } from "@/components/ui";
import { getSession } from "@/lib/auth/server";
import { homeFor } from "@/lib/auth/session";
import { computeQuote, type QuoteResult } from "@/lib/calc/quote";
import { getDict } from "@/lib/i18n";
import { STAGES } from "@/lib/projects/stages";
import { getEffectiveRules } from "@/lib/rules-repo";

async function sampleQuote(): Promise<QuoteResult | null> {
  try {
    const rules = await getEffectiveRules();
    return computeQuote({ systemKw: 3, monthlyUnits: 340, bands: rules.bands, subsidy: rules.subsidy, setting: rules.setting });
  } catch {
    return null;
  }
}

const FEATURE_ICONS = [
  "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h4",
  "M4 7h16M4 12h10M4 17h7M17 15l2 2 3-4",
  "M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10M9.5 19.5V14h5v5.5",
  "M5 12.5 10 17 19 7M4 4h16v16H4z",
];

function Arrow({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={cx("size-4", className)} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  );
}

export default async function Home() {
  const [session, quote, { lang, t }] = await Promise.all([getSession(), sampleQuote(), getDict()]);
  const L = t.landing;
  const showcase: ShowcaseText = {
    ...t.showcase,
    steps: L.showcase,
    stages: STAGES.map((s) => t.stages[s][0]),
    toast:
      lang === "hi"
        ? "नमस्ते प्रशांत, आपके पैनल और इन्वर्टर रास्ते में हैं।"
        : "Namaste Prashant, your panels and inverter are on the way.",
  };
  const hiType = lang === "hi";

  return (
    <div className="min-h-dvh overflow-x-clip">
      <header className="fixed inset-x-0 top-0 z-30">
        <div className="mx-auto mt-3 flex max-w-6xl items-center justify-between gap-3 rounded-full border border-line/70 bg-paper/70 px-3 py-2 pl-5 shadow-soft backdrop-blur-xl sm:mx-6 lg:mx-auto">
          <Logo />
          <div className="flex items-center gap-2">
            <LanguageToggle lang={lang} />
            <ThemeToggle />
            {session ? (
              <ButtonLink href={homeFor(session.role)} className="min-h-9 px-4 text-sm max-sm:!hidden">
                {t.common.openDashboard}
              </ButtonLink>
            ) : (
              <ButtonLink href="/login" variant="secondary" className="min-h-9 px-4 text-sm max-sm:!hidden">
                {t.common.signIn}
              </ButtonLink>
            )}
          </div>
        </div>
      </header>

      <section className="relative isolate pt-36 sm:pt-44">
        <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
          <div className="hero-grid absolute inset-0" />
          <div className="absolute -top-40 left-1/2 h-[38rem] w-[60rem] -translate-x-1/2 animate-[aurora_18s_ease-in-out_infinite] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-brand)_28%,transparent),transparent)] blur-3xl" />
          <div className="absolute -top-20 right-[-10%] h-[28rem] w-[34rem] animate-[aurora_22s_ease-in-out_infinite_reverse] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-sun)_30%,transparent),transparent)] blur-3xl" />
          {[18, 42, 71, 88].map((x, i) => (
            <span
              key={x}
              className="absolute top-0 h-48 w-px animate-[beam_6s_ease-in_infinite] bg-gradient-to-b from-transparent via-brand to-transparent opacity-0"
              style={{ left: `${x}%`, animationDelay: `${i * 1.5}s` }}
            />
          ))}
        </div>

        <div className="mx-auto max-w-6xl px-5 text-center sm:px-8">
          <p className="mx-auto inline-flex animate-[rise_0.7s_var(--ease-out-soft)_both] items-center gap-2 rounded-full border border-line bg-surface/70 px-3.5 py-1.5 text-[13px] font-medium backdrop-blur">
            <span className="relative flex size-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-sun opacity-60" />
              <span className="relative size-2 rounded-full bg-sun" />
            </span>
            {L.eyebrow}
          </p>
          <h1
            className={cx(
              "mx-auto mt-7 max-w-5xl font-semibold tracking-[-0.045em]",
              hiType ? "text-[2.6rem] leading-[1.2] sm:text-6xl lg:text-7xl" : "text-[3rem] leading-[0.98] sm:text-7xl lg:text-[6.2rem]",
            )}
          >
            <WordReveal lines={L.headline} accentLine={2} />
          </h1>
          <p className="text-balance mx-auto mt-7 max-w-2xl animate-[rise_0.8s_var(--ease-out-soft)_0.5s_both] text-lg leading-relaxed text-muted sm:text-xl">{L.sub}</p>
          <div className="mt-10 flex animate-[rise_0.8s_var(--ease-out-soft)_0.65s_both] flex-wrap items-center justify-center gap-3">
            <Magnetic>
              <ButtonLink href={session?.role === "HOMEOWNER" ? "/my/new" : "/signup"} className="group min-h-13 px-7 text-base">
                {t.common.checkMyHome}
                <Arrow className="transition-transform duration-300 group-hover:translate-x-1" />
              </ButtonLink>
            </Magnetic>
            <ButtonLink href="/login" variant="secondary" className="min-h-13 px-7 text-base">
              {t.common.trackProject}
            </ButtonLink>
          </div>
          <ul className="mt-8 flex animate-[fade_1s_ease-out_0.9s_both] flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted">
            {L.trust.map((x) => (
              <li key={x} className="flex items-center gap-2">
                <svg aria-hidden viewBox="0 0 20 20" className="size-4 text-brand" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 10.5 8.5 14 15 6.5" />
                </svg>
                {x}
              </li>
            ))}
          </ul>
        </div>

        <div className="mx-auto mt-20 max-w-6xl px-5 sm:mt-24 sm:px-8">
          <Reveal>
            <div className="relative rounded-[32px] border border-line bg-surface/60 p-6 shadow-lift backdrop-blur sm:p-10 lg:p-14">
              <div aria-hidden className="pointer-events-none absolute inset-x-10 -top-px h-px bg-gradient-to-r from-transparent via-brand to-transparent" />
              <ProductShowcase t={showcase} heading={<h2 className="max-w-sm text-2xl font-semibold tracking-tight sm:text-3xl">{L.showcaseTitle}</h2>} />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-6xl px-5 sm:px-8">
        <Marquee items={[...L.trust, ...L.stats.map((s) => `${s.value} · ${s.label}`)]} />
      </section>

      <section className="mx-auto mt-24 max-w-6xl px-5 sm:px-8">
        <Reveal>
          <h2 className={cx("text-sm font-medium text-muted", !hiType && "uppercase tracking-[0.18em]")}>{L.statsTitle}</h2>
        </Reveal>
        <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[24px] border border-line bg-line lg:grid-cols-4">
          {L.stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 90} className="bg-paper">
              <div className="h-full bg-surface p-6 sm:p-8">
                <p className="num whitespace-nowrap text-[1.7rem] font-semibold tracking-tight sm:text-4xl xl:text-5xl">{s.value}</p>
                <p className="mt-3 text-sm text-muted">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-32 max-w-6xl px-5 sm:px-8">
        <Reveal>
          <h2 className="max-w-3xl text-4xl font-semibold tracking-[-0.035em] sm:text-6xl">{L.featuresTitle}</h2>
          <p className="mt-4 max-w-xl text-lg text-muted">{L.featuresSub}</p>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-6">
          {L.features.map((f, i) => (
            <Reveal key={f.title} delay={i * 80} className={i === 0 || i === 3 ? "md:col-span-4" : "md:col-span-2"}>
              <Spotlight className="h-full">
                <div className="flex h-full flex-col p-7 sm:p-8">
                  <span className="inline-flex size-12 items-center justify-center rounded-2xl border border-line bg-paper text-brand transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
                    <svg aria-hidden viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d={FEATURE_ICONS[i]} />
                    </svg>
                  </span>
                  <h3 className="mt-8 text-xl font-semibold tracking-tight">{f.title}</h3>
                  <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted">{f.body}</p>
                </div>
              </Spotlight>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-32 max-w-6xl px-5 sm:px-8">
        <div className="grid gap-14 lg:grid-cols-[1fr_400px] lg:gap-20">
          <div>
            <Reveal>
              <h2 className="text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">{L.howTitle}</h2>
            </Reveal>
            <ol className="mt-10">
              {L.how.map((s, i) => (
                <Reveal key={s.title} delay={i * 100}>
                  <li className="group flex gap-6 border-t border-line py-7">
                    <span className="num text-4xl font-semibold tracking-tight text-line-strong transition-colors duration-500 group-hover:text-brand sm:text-5xl">0{i + 1}</span>
                    <div className="pt-1">
                      <h3 className="text-xl font-semibold tracking-tight">{s.title}</h3>
                      <p className="mt-1.5 text-[15px] text-muted">{s.body}</p>
                    </div>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
          {quote && (
            <Reveal delay={150}>
              <h2 className={cx("text-sm font-medium text-muted", !hiType && "uppercase tracking-[0.18em]")}>{L.quoteTitle}</h2>
              <QuoteStory q={quote} label={L.quoteLabel} exampleLabel={t.quote.example} text={t.quote} className="mt-6" />
              <p className="mt-3 text-[13px] leading-relaxed text-muted">{L.quoteNote}</p>
            </Reveal>
          )}
        </div>
      </section>

      <section className="mx-auto mt-32 max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="relative isolate overflow-hidden rounded-[32px] bg-ink px-6 py-16 text-center text-on-ink sm:px-12 sm:py-24">
            <div aria-hidden className="absolute -bottom-40 left-1/2 -z-10 h-80 w-[50rem] -translate-x-1/2 animate-[aurora_16s_ease-in-out_infinite] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-brand)_55%,transparent),transparent)] blur-3xl" />
            <div aria-hidden className="absolute -top-32 right-0 -z-10 h-72 w-96 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-sun)_40%,transparent),transparent)] blur-3xl" />
            <h2 className="text-balance mx-auto max-w-3xl text-4xl font-semibold tracking-[-0.035em] sm:text-6xl">{L.ctaTitle}</h2>
            <p className="mx-auto mt-5 max-w-lg text-lg opacity-70">{L.ctaSub}</p>
            <div className="mt-10 flex justify-center">
              <Magnetic strength={0.35}>
                <Link
                  href={session?.role === "HOMEOWNER" ? "/my/new" : "/signup"}
                  className="group inline-flex min-h-14 items-center gap-2 rounded-full bg-on-ink px-8 text-base font-semibold text-ink transition-transform duration-300 hover:scale-[1.03] active:scale-[0.97]"
                >
                  {t.common.checkMyHome}
                  <Arrow className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Magnetic>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="mx-auto mt-24 max-w-6xl px-5 pb-12 sm:px-8">
        <div className="flex flex-col gap-8 border-t border-line pt-10 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-muted">{L.footerTag}</p>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <Link href="/signup" className="text-muted transition-colors hover:text-ink">
              {t.common.checkMyHome}
            </Link>
            <Link href="/login" className="text-muted transition-colors hover:text-ink">
              {t.common.trackProject}
            </Link>
            <Link href="/login" className="text-muted transition-colors hover:text-ink">
              {t.common.signIn}
            </Link>
          </nav>
        </div>
        <p className="mt-10 text-[13px] text-muted">© {new Date().getFullYear()} Rooftop Solar · Nagpur, Maharashtra</p>
      </footer>
    </div>
  );
}
