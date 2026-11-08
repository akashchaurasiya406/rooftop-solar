import { LanguageToggle } from "@/components/language-toggle";
import { ProductShowcase } from "@/components/product-showcase";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/ui";
import { getDict } from "@/lib/i18n";
import { STAGES } from "@/lib/projects/stages";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { lang, t } = await getDict();
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col">
        <header className="flex animate-fade items-center justify-between gap-3 px-5 py-5 sm:px-8">
          <Logo />
          <div className="flex items-center gap-2">
            <LanguageToggle lang={lang} />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex flex-1 items-start justify-center px-5 pb-16 pt-6 sm:items-center sm:pt-0">
          <div className="w-full max-w-sm animate-rise">{children}</div>
        </main>
      </div>

      <aside aria-hidden className="relative isolate hidden overflow-hidden border-l border-line bg-surface lg:flex lg:flex-col lg:items-center lg:justify-center lg:px-14">
        <div className="hero-grid absolute inset-0 -z-10" />
        <div className="absolute -top-32 left-1/2 -z-10 h-[30rem] w-[40rem] -translate-x-1/2 animate-[aurora_18s_ease-in-out_infinite] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-brand)_24%,transparent),transparent)] blur-3xl" />
        <div className="absolute -bottom-24 right-0 -z-10 h-80 w-96 rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--color-sun)_22%,transparent),transparent)] blur-3xl" />
        <ProductShowcase
          compact
          t={{
            ...t.showcase,
            steps: t.landing.showcase,
            stages: STAGES.map((s) => t.stages[s][0]),
          }}
        />
        <ul className="mt-10 space-y-3">
          {t.auth.points.map((p, i) => (
            <li key={p} className="flex animate-[rise_0.6s_var(--ease-out-soft)_both] items-center gap-3 text-[15px]" style={{ animationDelay: `${300 + i * 90}ms` }}>
              <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-on-brand">
                <svg viewBox="0 0 20 20" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 10.5 8.5 14 15 6.5" />
                </svg>
              </span>
              {p}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
