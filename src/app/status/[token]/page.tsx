import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, cx, Logo } from "@/components/ui";
import { db } from "@/lib/db";
import { firstName, STAGE_INFO, STAGES, stageIndex } from "@/lib/projects/stages";

export const metadata: Metadata = { title: "Your solar project", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const day = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export default async function StatusPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
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

  const cur = stageIndex(p.stage);
  const done = p.stage === "SUBSIDY_CREDITED";
  const dateFor = (st: string) => p.events.find((e) => e.stage === st)?.at;

  return (
    <div className="dawn min-h-dvh">
      <header className="mx-auto flex max-w-lg items-center px-5 py-5">
        <Logo />
      </header>
      <main className="mx-auto max-w-lg px-5 pb-16">
        <div className="animate-rise">
          <p className="text-sm text-muted">Solar project status</p>
          <h1 className="mt-1 text-[1.75rem] font-semibold leading-tight tracking-tight">
            Namaste {firstName(p.lead.name)}, {done ? "your project is complete" : "here's where things stand"}
          </h1>
          <p className="num mt-2 text-[15px] text-muted">
            {p.quote.systemKw} kW rooftop system{p.lead.district ? ` · ${p.lead.district}` : ""}
          </p>
        </div>

        <Card className="mt-6 animate-[rise_0.6s_var(--ease-out-soft)_0.1s_both] overflow-hidden">
          <div className={cx("px-5 py-4", done ? "bg-high-soft" : "bg-brand-soft/60")}>
            <p className="text-[13px] font-medium text-brand">Now</p>
            <p className="mt-0.5 text-lg font-semibold">{STAGE_INFO[p.stage].label}</p>
            <p className="mt-1 text-[15px] text-ink/80">{STAGE_INFO[p.stage].customer}</p>
          </div>
          <ol className="px-5 py-5">
            {STAGES.map((st, i) => {
              const at = dateFor(st);
              return (
                <li key={st} className="flex gap-3">
                  <span className="flex flex-col items-center">
                    <span
                      className={cx(
                        "mt-1 flex size-5 items-center justify-center rounded-full border-2 text-white",
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
                    <span className={cx("text-[15px]", i <= cur ? "font-medium" : "text-muted")}>{STAGE_INFO[st].label}</span>
                    {at && i <= cur && <span className="num text-[13px] text-muted">{day(at)}</span>}
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>

        <p className="mt-6 text-center text-[13px] text-muted">
          Updated {day(p.stageUpdated)}. We&apos;ll message you on WhatsApp at every step.
        </p>
      </main>
    </div>
  );
}
