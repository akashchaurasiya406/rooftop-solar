import type { Metadata } from "next";
import Link from "next/link";
import { CountUp } from "@/components/motion";
import { Card, cx, EmptyState, inr, stagger } from "@/components/ui";
import { requireRole } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { getDict } from "@/lib/i18n";
import { fill } from "@/lib/i18n/format";
import { daysInStage, isStuck, STAGES, stageIndex } from "@/lib/projects/stages";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const [, { t }, { f }] = await Promise.all([requireRole("SALES", "ADMIN"), getDict(), searchParams]);
  const P = t.staff.projects;
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
  const byStage = STAGES.map((s) => rows.filter((r) => r.stage === s).length);
  const maxStage = Math.max(1, ...byStage);

  const tiles = [
    { key: undefined, label: P.all, value: rows.length, hint: fill(P.inProgress, { n: open.length }) },
    { key: "stuck", label: P.stuck, value: stuckCount, hint: P.stuckHint },
  ];

  return (
    <>
      <div className="animate-rise">
        <h1 className="text-[2rem] font-semibold tracking-tight">{P.title}</h1>
        <p className="mt-1 text-[15px] text-muted">{P.sub}</p>
      </div>

      <div className="mt-7 grid gap-3 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <nav aria-label={P.title} className="stagger grid grid-cols-2 gap-3">
          {tiles.map((tile, i) => {
            const active = (f ?? undefined) === tile.key;
            return (
              <Link
                key={tile.label}
                href={tile.key ? `/sales/projects?f=${tile.key}` : "/sales/projects"}
                style={stagger(i)}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "group relative overflow-hidden rounded-2xl border p-4 transition-[transform,box-shadow] duration-300 active:scale-[0.98]",
                  active ? "border-ink bg-ink text-on-ink shadow-lift" : "border-line bg-surface shadow-soft hover:-translate-y-1 hover:shadow-lift",
                )}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <span className="relative flex size-2">
                    {tile.key === "stuck" && stuckCount > 0 && !active && <span className="absolute inset-0 animate-ping rounded-full bg-danger opacity-70" />}
                    <span className={cx("relative size-2 rounded-full", tile.key === "stuck" ? "bg-danger" : active ? "bg-on-ink" : "bg-ink")} />
                  </span>
                  {tile.label}
                </span>
                <CountUp value={tile.value} className="mt-2 block text-3xl font-semibold" />
                <span className={cx("text-[13px]", active ? "text-on-ink/70" : "text-muted")}>{tile.hint}</span>
              </Link>
            );
          })}
        </nav>

        <Card className="animate-[rise_0.6s_var(--ease-out-soft)_0.1s_both] p-4">
          <div className="flex h-full items-end gap-2">
            {STAGES.map((s, i) => (
              <div key={s} className="group flex min-w-0 flex-1 flex-col items-center gap-1.5" title={`${t.stages[s][0]}: ${byStage[i]}`}>
                <span className="num text-[12px] font-medium opacity-0 transition-opacity group-hover:opacity-100">{byStage[i]}</span>
                <div className="flex h-16 w-full items-end">
                  <div
                    className="w-full origin-bottom animate-[draw_0.9s_var(--ease-out-soft)_both] rounded-t-md bg-brand/80 transition-colors group-hover:bg-brand"
                    style={{ height: `${Math.max(6, (byStage[i] / maxStage) * 100)}%`, animationDelay: `${250 + i * 80}ms` }}
                  />
                </div>
                <span className="w-full truncate text-center text-[10.5px] leading-tight text-muted">{t.stages[s][0]}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6">
        {shown.length === 0 ? (
          <EmptyState title={f === "stuck" ? P.noneStuck : P.none} body={f === "stuck" ? P.noneStuckBody : P.noneBody} />
        ) : (
          <Card className="divide-y divide-line overflow-hidden">
            {shown.map((p, i) => {
              const pct = (stageIndex(p.stage) / (STAGES.length - 1)) * 100;
              return (
                <Link
                  key={p.id}
                  href={`/sales/projects/${p.id}`}
                  className="group relative block animate-[rise_0.5s_var(--ease-out-soft)_both] px-5 py-4 transition-colors hover:bg-brand-soft/30"
                  style={{ animationDelay: `${Math.min(i, 8) * 60 + 150}ms` }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 font-medium group-hover:underline">
                        {p.stuck && (
                          <span className="relative flex size-2">
                            <span className="absolute inset-0 animate-ping rounded-full bg-danger opacity-70" />
                            <span className="relative size-2 rounded-full bg-danger" />
                          </span>
                        )}
                        {p.lead.name}
                      </p>
                      <p className="num text-[13px] text-muted">
                        {p.lead.code} · {p.lead.district} · {p.quote.systemKw} kW · {inr(p.quote.netCost)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{t.stages[p.stage][0]}</p>
                      <p className={cx("num text-[13px]", p.stuck ? "font-medium text-danger" : "text-muted")}>
                        {p.stuck ? fill(P.stuckDays, { n: p.days }) : fill(P.daysIn, { n: p.days })}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
                    <div
                      className={cx("h-full origin-left animate-[grow_1s_var(--ease-out-soft)_both] rounded-full", p.stuck ? "bg-danger" : "bg-gradient-to-r from-brand to-high")}
                      style={{ width: `${Math.max(pct, 4)}%`, animationDelay: `${Math.min(i, 8) * 60 + 300}ms` }}
                    />
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
