import type { Metadata } from "next";
import Link from "next/link";
import { Card, cx, EmptyState, inr, stagger } from "@/components/ui";
import { requireRole } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { daysInStage, isStuck, STAGE_INFO, STAGES, stageIndex } from "@/lib/projects/stages";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  await requireRole("SALES", "ADMIN");
  const { f } = await searchParams;
  const projects = await db.project.findMany({
    orderBy: { stageUpdated: "asc" },
    select: {
      id: true,
      stage: true,
      stageUpdated: true,
      lead: { select: { name: true, code: true, district: true } },
      quote: { select: { systemKw: true, netCost: true } },
    },
  });

  const now = new Date();
  const rows = projects.map((p) => ({ ...p, stuck: isStuck(p.stage, p.stageUpdated, now), days: daysInStage(p.stageUpdated, now) }));
  const stuckCount = rows.filter((r) => r.stuck).length;
  const open = rows.filter((r) => r.stage !== "SUBSIDY_CREDITED");
  const shown = (f === "stuck" ? rows.filter((r) => r.stuck) : rows).sort((a, b) => Number(b.stuck) - Number(a.stuck));

  const tiles = [
    { key: undefined, label: "All projects", value: rows.length, hint: `${open.length} in progress` },
    { key: "stuck", label: "Stuck", value: stuckCount, hint: "Past the usual time for their stage" },
  ];

  return (
    <>
      <div className="animate-rise">
        <h1 className="text-[1.75rem] font-semibold tracking-tight">Projects</h1>
        <p className="mt-1 text-[15px] text-muted">From advance to subsidy credited. Stuck projects first.</p>
      </div>

      <nav aria-label="Filter projects" className="stagger mt-7 grid grid-cols-2 gap-3 sm:max-w-md">
        {tiles.map((t, i) => {
          const active = (f ?? undefined) === t.key;
          return (
            <Link
              key={t.label}
              href={t.key ? `/sales/projects?f=${t.key}` : "/sales/projects"}
              style={stagger(i)}
              aria-current={active ? "page" : undefined}
              className={cx(
                "rounded-2xl border p-4 transition-[transform,box-shadow] duration-300 active:scale-[0.98]",
                active ? "border-ink bg-ink text-on-ink shadow-lift" : "border-line bg-surface shadow-soft hover:-translate-y-0.5 hover:shadow-lift",
              )}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <span className={cx("size-2 rounded-full", t.key === "stuck" ? "bg-danger" : active ? "bg-on-ink" : "bg-ink")} />
                {t.label}
              </span>
              <span className="num mt-2 block text-3xl font-semibold">{t.value}</span>
              <span className={cx("text-[13px]", active ? "text-on-ink/70" : "text-muted")}>{t.hint}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6">
        {shown.length === 0 ? (
          <EmptyState
            title={f === "stuck" ? "Nothing is stuck" : "No projects yet"}
            body={f === "stuck" ? "Every project is moving on time." : "A project starts when a customer accepts a quote."}
          />
        ) : (
          <Card className="divide-y divide-line overflow-hidden">
            {shown.map((p) => {
              const pct = (stageIndex(p.stage) / (STAGES.length - 1)) * 100;
              return (
                <Link key={p.id} href={`/sales/projects/${p.id}`} className="group block px-5 py-4 transition-colors hover:bg-paper">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium group-hover:underline">{p.lead.name}</p>
                      <p className="num text-[13px] text-muted">
                        {p.lead.code} · {p.lead.district} · {p.quote.systemKw} kW · {inr(p.quote.netCost)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{STAGE_INFO[p.stage].label}</p>
                      <p className={cx("num text-[13px]", p.stuck ? "font-medium text-danger" : "text-muted")}>
                        {p.stuck ? `Stuck · ${p.days} days` : `${p.days} day${p.days === 1 ? "" : "s"} in stage`}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 h-1 rounded-full bg-line">
                    <div className={cx("h-1 rounded-full", p.stuck ? "bg-danger" : "bg-brand")} style={{ width: `${Math.max(pct, 4)}%` }} />
                  </div>
                </Link>
              );
            })}
          </Card>
        )}
      </div>
    </>
  );
}
