import type { Metadata } from "next";
import Link from "next/link";
import type { LeadScore, LeadStatus, Prisma } from "@prisma/client";
import { Card, cx, EmptyState, inr, ScoreBadge, stagger } from "@/components/ui";
import { requireRole } from "@/lib/auth/server";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Leads" };

const STATUS_LABEL: Record<LeadStatus, string> = {
  NEW: "New",
  BILL_REVIEW: "Check bill",
  REUPLOAD_REQUESTED: "Re-upload asked",
  SURVEY: "Book survey",
  CALL_ONLY: "Call first",
  QUOTED: "Quoted",
  WON: "Won",
  LOST: "Lost",
};

const STATUS_TONE: Partial<Record<LeadStatus, string>> = {
  BILL_REVIEW: "text-medium",
  SURVEY: "text-high",
};

const FILTERS: { key: string; label: string; hint: string; tone: string; where: Prisma.LeadWhereInput }[] = [
  { key: "all", label: "All leads", hint: "Everything open", tone: "bg-ink", where: {} },
  { key: "review", label: "Check bill", hint: "Confirm AI-read values", tone: "bg-sun", where: { status: "BILL_REVIEW" } },
  { key: "HIGH", label: "High", hint: "Book a survey", tone: "bg-high", where: { score: "HIGH" } },
  { key: "MEDIUM", label: "Medium", hint: "Survey, check concern", tone: "bg-medium", where: { score: "MEDIUM" } },
  { key: "LOW", label: "Low", hint: "Short call, no visit", tone: "bg-low", where: { score: "LOW" } },
];

const SCORE_ORDER: Record<LeadScore, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

const ago = (d: Date) => {
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  return days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`;
};

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const session = await requireRole("SALES", "ADMIN");
  const { f = "all" } = await searchParams;
  const filter = FILTERS.find((x) => x.key === f) ?? FILTERS[0];

  const [leads, counts] = await Promise.all([
    db.lead.findMany({
      where: filter.where,
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true, code: true, name: true, district: true, ownership: true, monthlyBill: true,
        score: true, scoreReasons: true, recommendedKw: true, status: true, createdAt: true,
      },
    }),
    Promise.all(FILTERS.map((x) => db.lead.count({ where: x.where }))),
  ]);
  leads.sort((a, b) => (a.score ? SCORE_ORDER[a.score] : 3) - (b.score ? SCORE_ORDER[b.score] : 3));

  return (
    <>
      <div className="animate-rise">
        <p className="text-sm text-muted">Good to see you, {session.name.split(" ")[0]}</p>
        <h1 className="mt-1 text-[1.75rem] font-semibold tracking-tight">Leads</h1>
        <p className="mt-1 text-[15px] text-muted">High scores first. Low scores get a call, not a visit.</p>
      </div>

      <nav aria-label="Filter leads" className="stagger -mx-4 mt-7 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0">
        {FILTERS.map((x, i) => {
          const active = x.key === filter.key;
          return (
            <Link
              key={x.key}
              href={x.key === "all" ? "/sales" : `/sales?f=${x.key}`}
              aria-current={active ? "page" : undefined}
              style={stagger(i)}
              className={cx(
                "group min-w-[9.5rem] snap-start rounded-2xl border p-4 transition-[transform,box-shadow,border-color,background-color] duration-300 ease-[var(--ease-out-soft)] active:scale-[0.98] sm:min-w-0",
                active
                  ? "border-ink bg-ink text-white shadow-lift"
                  : "border-line bg-surface shadow-soft hover:-translate-y-0.5 hover:shadow-lift",
              )}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <span aria-hidden className={cx("size-2 rounded-full", active && x.key === "all" ? "bg-white" : x.tone)} />
                {x.label}
              </span>
              <span className="num mt-2 block text-3xl font-semibold tracking-tight">{counts[i]}</span>
              <span className={cx("mt-0.5 block text-[13px]", active ? "text-white/70" : "text-muted")}>{x.hint}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6">
        {leads.length === 0 ? (
          <EmptyState title="No leads here" body="Nothing matches this filter yet. New leads appear as soon as a homeowner submits the form." />
        ) : (
          <Card className="overflow-hidden animate-[rise_0.6s_var(--ease-out-soft)_0.15s_both]">
            <table className="hidden w-full text-left text-sm md:table">
              <thead className="border-b border-line bg-paper/60 text-[13px] text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Lead</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Why</th>
                  <th className="px-4 py-3 text-right font-medium">Bill / month</th>
                  <th className="px-4 py-3 text-right font-medium">Size</th>
                  <th className="px-5 py-3 font-medium">Next step</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {leads.map((l) => {
                  const reasons = (l.scoreReasons as string[] | null) ?? [];
                  return (
                    <tr key={l.id} className="group align-top transition-colors hover:bg-paper">
                      <td className="px-5 py-4">
                        <Link href={`/sales/leads/${l.id}`} className="font-medium underline-offset-4 group-hover:underline">{l.name}</Link>
                        <p className="text-[13px] text-muted">
                          {l.code} · {l.district} · {ago(l.createdAt)}
                        </p>
                      </td>
                      <td className="px-4 py-4"><ScoreBadge score={l.score} /></td>
                      <td className="max-w-xs px-4 py-4 text-muted">{reasons[0] ?? "—"}</td>
                      <td className="num px-4 py-4 text-right">{inr(l.monthlyBill)}</td>
                      <td className="num px-4 py-4 text-right">{l.recommendedKw ? `${l.recommendedKw} kW` : "—"}</td>
                      <td className="px-5 py-4">
                        <Link href={`/sales/leads/${l.id}`} className={cx("inline-flex items-center gap-1 font-medium transition-transform hover:translate-x-0.5", STATUS_TONE[l.status])}>
                          {STATUS_LABEL[l.status]} <span aria-hidden>→</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <ul className="stagger divide-y divide-line md:hidden">
              {leads.map((l, i) => {
                const reasons = (l.scoreReasons as string[] | null) ?? [];
                return (
                  <li key={l.id} style={stagger(Math.min(i, 8) + 2)}>
                    <Link href={`/sales/leads/${l.id}`} className="block px-4 py-4 transition-colors active:bg-paper">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{l.name}</p>
                        <p className="text-[13px] text-muted">{l.code} · {l.district}</p>
                      </div>
                      <ScoreBadge score={l.score} />
                    </div>
                    <p className="mt-2 text-sm text-muted">{reasons[0]}</p>
                    <div className="num mt-3 flex items-center justify-between text-[13px]">
                      <span>
                        {inr(l.monthlyBill)}/mo · {l.recommendedKw ? `${l.recommendedKw} kW` : "no size"}
                      </span>
                      <span className={cx("font-medium", STATUS_TONE[l.status])}>{STATUS_LABEL[l.status]}</span>
                    </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>
    </>
  );
}
