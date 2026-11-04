import type { Metadata } from "next";
import Link from "next/link";
import type { LeadScore, LeadStatus, Prisma } from "@prisma/client";
import { Card, cx, EmptyState, inr, ScoreBadge } from "@/components/ui";
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

const FILTERS: { key: string; label: string; where: Prisma.LeadWhereInput }[] = [
  { key: "all", label: "All", where: {} },
  { key: "review", label: "Check bill", where: { status: "BILL_REVIEW" } },
  { key: "HIGH", label: "High", where: { score: "HIGH" } },
  { key: "MEDIUM", label: "Medium", where: { score: "MEDIUM" } },
  { key: "LOW", label: "Low", where: { score: "LOW" } },
];

const SCORE_ORDER: Record<LeadScore, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

const ago = (d: Date) => {
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  return days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`;
};

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  await requireRole("SALES", "ADMIN");
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="mt-1 text-[15px] text-muted">High scores first. Low scores get a call, not a visit.</p>
        </div>
      </div>

      <nav aria-label="Filter leads" className="-mx-1 mt-6 flex gap-1 overflow-x-auto pb-1">
        {FILTERS.map((x, i) => (
          <Link
            key={x.key}
            href={x.key === "all" ? "/sales" : `/sales?f=${x.key}`}
            aria-current={x.key === filter.key ? "page" : undefined}
            className={cx(
              "shrink-0 rounded-full px-3.5 py-1.5 text-sm",
              x.key === filter.key ? "bg-ink text-white" : "text-muted hover:bg-line/60 hover:text-ink",
            )}
          >
            {x.label} <span className="num opacity-70">{counts[i]}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-4">
        {leads.length === 0 ? (
          <EmptyState title="No leads here" body="Nothing matches this filter yet. New leads appear as soon as a homeowner submits the form." />
        ) : (
          <Card className="overflow-hidden">
            <table className="hidden w-full text-left text-sm md:table">
              <thead className="border-b border-line text-[13px] text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Lead</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Why</th>
                  <th className="px-4 py-3 text-right font-medium">Bill / month</th>
                  <th className="px-4 py-3 text-right font-medium">Size</th>
                  <th className="px-4 py-3 font-medium">Next step</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {leads.map((l) => {
                  const reasons = (l.scoreReasons as string[] | null) ?? [];
                  return (
                    <tr key={l.id} className="align-top hover:bg-paper">
                      <td className="px-4 py-3.5">
                        <p className="font-medium">{l.name}</p>
                        <p className="text-[13px] text-muted">
                          {l.code} · {l.district} · {ago(l.createdAt)}
                        </p>
                      </td>
                      <td className="px-4 py-3.5"><ScoreBadge score={l.score} /></td>
                      <td className="max-w-xs px-4 py-3.5 text-muted">{reasons[0] ?? "—"}</td>
                      <td className="num px-4 py-3.5 text-right">{inr(l.monthlyBill)}</td>
                      <td className="num px-4 py-3.5 text-right">{l.recommendedKw ? `${l.recommendedKw} kW` : "—"}</td>
                      <td className="px-4 py-3.5">{STATUS_LABEL[l.status]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <ul className="divide-y divide-line md:hidden">
              {leads.map((l) => {
                const reasons = (l.scoreReasons as string[] | null) ?? [];
                return (
                  <li key={l.id} className="px-4 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{l.name}</p>
                        <p className="text-[13px] text-muted">{l.code} · {l.district}</p>
                      </div>
                      <ScoreBadge score={l.score} />
                    </div>
                    <p className="mt-1.5 text-sm text-muted">{reasons[0]}</p>
                    <p className="num mt-1.5 text-[13px]">
                      {inr(l.monthlyBill)}/mo · {l.recommendedKw ? `${l.recommendedKw} kW` : "no size"} · {STATUS_LABEL[l.status]}
                    </p>
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
