import type { Metadata } from "next";
import Link from "next/link";
import type { LeadScore, LeadStatus, Prisma } from "@prisma/client";
import { CountUp, Pipeline } from "@/components/motion";
import { Card, cx, EmptyState, inr, ScoreBadge, stagger } from "@/components/ui";
import { requireRole } from "@/lib/auth/server";
import { formatReason, parseReasons } from "@/lib/calc/reasons";
import { db } from "@/lib/db";
import { getDict } from "@/lib/i18n";
import { agoText, fill } from "@/lib/i18n/format";

export const metadata: Metadata = { title: "Leads" };

const STATUS_TONE: Partial<Record<LeadStatus, string>> = {
  BILL_REVIEW: "text-medium",
  SURVEY: "text-high",
};

const FILTERS: { key: "all" | "review" | LeadScore; tone: string; where: Prisma.LeadWhereInput }[] = [
  { key: "all", tone: "bg-ink", where: {} },
  { key: "review", tone: "bg-sun", where: { status: "BILL_REVIEW" } },
  { key: "HIGH", tone: "bg-high", where: { score: "HIGH" } },
  { key: "MEDIUM", tone: "bg-medium", where: { score: "MEDIUM" } },
  { key: "LOW", tone: "bg-low", where: { score: "LOW" } },
];

const SCORE_ORDER: Record<LeadScore, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const [session, { t }, { f = "all" }] = await Promise.all([requireRole("SALES", "ADMIN"), getDict(), searchParams]);
  const S = t.staff;
  const L = S.leads;
  const filter = FILTERS.find((x) => x.key === f) ?? FILTERS[0];

  const [leads, counts] = await Promise.all([
    db.lead.findMany({
      where: filter.where,
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true, code: true, name: true, district: true, monthlyBill: true,
        score: true, scoreReasons: true, recommendedKw: true, status: true, createdAt: true,
      },
    }),
    Promise.all(FILTERS.map((x) => db.lead.count({ where: x.where }))),
  ]);
  leads.sort((a, b) => (a.score ? SCORE_ORDER[a.score] : 3) - (b.score ? SCORE_ORDER[b.score] : 3));
  const reasonOf = (json: unknown) => {
    const r = parseReasons(json)[0];
    return r ? formatReason(t.reasons, r) : "—";
  };
  const reviewWaiting = counts[1] > 0;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="animate-rise">
          <p className="text-sm text-muted">
            {fill(L.greeting, { name: session.name.split(" ")[0] })} <span className="inline-block origin-[70%_70%] animate-[wave_1.8s_ease-in-out_0.4s_2]">👋</span>
          </p>
          <h1 className="mt-1 text-[2rem] font-semibold tracking-tight">{L.title}</h1>
          <p className="mt-1 text-[15px] text-muted">{L.sub}</p>
        </div>
      </div>

      <nav aria-label={L.title} className="stagger -mx-4 mt-7 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0">
        {FILTERS.map((x, i) => {
          const active = x.key === filter.key;
          const [label, hint] = L.filters[x.key];
          const pulse = x.key === "review" && reviewWaiting && !active;
          return (
            <Link
              key={x.key}
              href={x.key === "all" ? "/sales" : `/sales?f=${x.key}`}
              aria-current={active ? "page" : undefined}
              style={stagger(i)}
              className={cx(
                "group relative min-w-[9.5rem] snap-start overflow-hidden rounded-2xl border p-4 transition-[transform,box-shadow,border-color,background-color] duration-300 ease-[var(--ease-out-soft)] active:scale-[0.98] sm:min-w-0",
                active ? "border-ink bg-ink text-on-ink shadow-lift" : "border-line bg-surface shadow-soft hover:-translate-y-1 hover:shadow-lift",
              )}
            >
              {!active && (
                <span aria-hidden className={cx("absolute -right-6 -top-6 size-16 rounded-full opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-40", x.tone)} />
              )}
              <span className="relative flex items-center gap-2 text-sm font-medium">
                <span className="relative flex size-2">
                  {pulse && <span className={cx("absolute inset-0 animate-ping rounded-full opacity-70", x.tone)} />}
                  <span aria-hidden className={cx("relative size-2 rounded-full", active && x.key === "all" ? "bg-on-ink" : x.tone)} />
                </span>
                {label}
              </span>
              <CountUp value={counts[i]} className="relative mt-2 block text-3xl font-semibold tracking-tight" />
              <span className={cx("relative mt-0.5 block text-[13px]", active ? "text-on-ink/70" : "text-muted")}>{hint}</span>
            </Link>
          );
        })}
      </nav>

      <Card className="mt-4 animate-[rise_0.6s_var(--ease-out-soft)_0.1s_both] p-4 sm:p-5">
        <Pipeline
          label={L.pipeline}
          parts={(["HIGH", "MEDIUM", "LOW"] as const).map((k, i) => ({ key: k, value: counts[2 + i], tone: { HIGH: "bg-high", MEDIUM: "bg-medium", LOW: "bg-low" }[k], label: S.score[k] }))}
        />
      </Card>

      <div className="mt-4">
        {leads.length === 0 ? (
          <EmptyState title={L.emptyTitle} body={L.emptyBody} />
        ) : (
          <Card className="animate-[rise_0.6s_var(--ease-out-soft)_0.2s_both] overflow-hidden">
            <table className="hidden w-full text-left text-sm md:table">
              <thead className="border-b border-line bg-paper/60 text-[13px] text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">{L.cols.lead}</th>
                  <th className="px-4 py-3 font-medium">{L.cols.score}</th>
                  <th className="px-4 py-3 font-medium">{L.cols.why}</th>
                  <th className="px-4 py-3 text-right font-medium">{L.cols.bill}</th>
                  <th className="px-4 py-3 text-right font-medium">{L.cols.size}</th>
                  <th className="px-5 py-3 font-medium">{L.cols.next}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {leads.map((l) => (
                  <tr key={l.id} className="group relative align-top transition-colors duration-200 hover:bg-brand-soft/40">
                    <td className="relative px-5 py-4">
                      <span aria-hidden className="absolute inset-y-2 left-0 w-0.5 origin-center scale-y-0 rounded-full bg-brand transition-transform duration-300 group-hover:scale-y-100" />
                      <Link href={`/sales/leads/${l.id}`} className="font-medium underline-offset-4 group-hover:underline">
                        {l.name}
                      </Link>
                      <p className="text-[13px] text-muted">
                        {l.code} · {l.district ?? S.lead.outside} · {agoText(l.createdAt, S)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <ScoreBadge score={l.score} labels={S.score} />
                    </td>
                    <td className="max-w-xs px-4 py-4 text-muted">{reasonOf(l.scoreReasons)}</td>
                    <td className="num px-4 py-4 text-right">{inr(l.monthlyBill)}</td>
                    <td className="num px-4 py-4 text-right">{l.recommendedKw ? `${l.recommendedKw} kW` : "—"}</td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/sales/leads/${l.id}`}
                        className={cx("inline-flex items-center gap-1 font-medium", STATUS_TONE[l.status])}
                      >
                        {L.status[l.status]}
                        <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
                          →
                        </span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="stagger divide-y divide-line md:hidden">
              {leads.map((l, i) => (
                <li key={l.id} style={stagger(Math.min(i, 8) + 2)}>
                  <Link href={`/sales/leads/${l.id}`} className="block px-4 py-4 transition-colors active:bg-paper">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{l.name}</p>
                        <p className="text-[13px] text-muted">
                          {l.code} · {l.district ?? S.lead.outside}
                        </p>
                      </div>
                      <ScoreBadge score={l.score} labels={S.score} />
                    </div>
                    <p className="mt-2 text-sm text-muted">{reasonOf(l.scoreReasons)}</p>
                    <div className="num mt-3 flex items-center justify-between text-[13px]">
                      <span>
                        {inr(l.monthlyBill)}
                        {L.perMonth} · {l.recommendedKw ? `${l.recommendedKw} kW` : L.noSize}
                      </span>
                      <span className={cx("font-medium", STATUS_TONE[l.status])}>{L.status[l.status]}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </>
  );
}
