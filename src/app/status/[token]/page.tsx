import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, cx, Logo } from "@/components/ui";
import { db } from "@/lib/db";
import { dateLocale, getDict } from "@/lib/i18n";
import { firstName, STAGES, stageIndex } from "@/lib/projects/stages";

export const metadata: Metadata = { title: "Your solar project", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function StatusPage({ params }: { params: Promise<{ token: string }> }) {
  const [{ token }, { lang, t }] = await Promise.all([params, getDict()]);
  if (!/^[A-Za-z0-9_-]{24,64}$/.test(token)) notFound();

  const p = await db.project.findUnique({
    where: { statusToken: token },
    select: {
      stage: true,
      stageUpdated: true,
      lead: { select: { name: true, district: true } },
      quote: { select: { systemKw: true } },
      events: { select: { stage: true, at: true } },
    },
  });
  if (!p) notFound();

  const S = t.statusPage;
  const cur = stageIndex(p.stage);
  const done = p.stage === "SUBSIDY_CREDITED";
  const dateFor = (st: string) => p.events.find((e) => e.stage === st)?.at;
  const day = (d: Date) => d.toLocaleDateString(dateLocale(lang), { day: "numeric", month: "short" });

  return (
    <div className="dawn min-h-dvh">
      <header className="mx-auto flex max-w-lg items-center justify-between gap-3 px-5 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          <LanguageToggle lang={lang} />
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto max-w-lg px-5 pb-16">
        <div className="animate-rise">
          <p className="text-sm text-muted">{S.kicker}</p>
          <h1 className="mt-1 text-[1.9rem] font-semibold leading-tight tracking-tight">
            {t.my.namaste} {firstName(p.lead.name)}, {done ? S.complete : S.standing}
          </h1>
          <p className="num mt-2 text-[15px] text-muted">
            {p.quote.systemKw} {S.system}
            {p.lead.district ? ` · ${p.lead.district}` : ""}
          </p>
        </div>

        <Card className="mt-6 animate-[rise_0.6s_var(--ease-out-soft)_0.1s_both] overflow-hidden">
          <div className={cx("px-5 py-4", done ? "bg-high-soft" : "bg-brand-soft/60")}>
            <p className="text-[13px] font-medium text-brand">{S.now}</p>
            <p className="mt-0.5 text-lg font-semibold">{t.stages[p.stage][0]}</p>
            <p className="mt-1 text-[15px] text-ink/80">{t.stages[p.stage][1]}</p>
          </div>
          <ol className="px-5 py-5">
            {STAGES.map((st, i) => {
              const at = dateFor(st);
              return (
                <li key={st} className="flex gap-3">
                  <span className="flex flex-col items-center">
                    <span
                      className={cx(
                        "mt-1 flex size-5 items-center justify-center rounded-full border-2 text-on-brand",
                        i < cur && "border-brand bg-brand",
                        i === cur && (done ? "border-brand bg-brand" : "border-brand bg-surface ring-4 ring-brand-soft"),
                        i > cur && "border-line-strong bg-surface",
                      )}
                    >
                      {(i < cur || (done && i === cur)) && (
                        <svg viewBox="0 0 20 20" className="size-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M5 10.5 8.5 14 15 6.5" />
                        </svg>
                      )}
                    </span>
                    {i < STAGES.length - 1 && <span className={cx("my-1 w-0.5 flex-1", i < cur ? "bg-brand" : "bg-line")} />}
                  </span>
                  <div className="flex flex-1 justify-between gap-3 pb-5">
                    <span className={cx("text-[15px]", i <= cur ? "font-medium" : "text-muted")}>{t.stages[st][0]}</span>
                    {at && i <= cur && <span className="num shrink-0 text-[13px] text-muted">{day(at)}</span>}
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>

        <p className="mt-6 text-center text-[13px] text-muted">
          {S.updated} {day(p.stageUpdated)}. {S.note}
        </p>
      </main>
    </div>
  );
}
