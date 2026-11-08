import type { FeedbackStatus } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { CountUp } from "@/components/motion";
import { Card, cx, EmptyState } from "@/components/ui";
import { requireRole } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { dateLocale, getDict } from "@/lib/i18n";
import { updateFeedback } from "../actions";

export const metadata: Metadata = { title: "Feedback" };

const TABS: FeedbackStatus[] = ["PENDING", "APPROVED", "HIDDEN"];

function Stars({ value }: { value: number }) {
  return (
    <span className="text-sun" aria-label={`${value} / 5`}>
      {"★".repeat(value)}
      <span className="text-line-strong">{"★".repeat(5 - value)}</span>
    </span>
  );
}

export default async function FeedbackAdminPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const [, { lang, t }, { s }] = await Promise.all([requireRole("SALES", "ADMIN"), getDict(), searchParams]);
  const F = t.staff.feedbackAdmin;
  const status: FeedbackStatus = TABS.includes(s as FeedbackStatus) ? (s as FeedbackStatus) : "PENDING";
  const [items, counts] = await Promise.all([
    db.feedback.findMany({ where: { status }, orderBy: { createdAt: "desc" }, take: 100 }),
    Promise.all(TABS.map((x) => db.feedback.count({ where: { status: x } }))),
  ]);

  return (
    <>
      <div className="animate-rise">
        <h1 className="text-[2rem] font-semibold tracking-tight">{F.title}</h1>
        <p className="mt-1 max-w-2xl text-[15px] text-muted">{F.sub}</p>
      </div>

      <nav aria-label={F.title} className="stagger mt-7 grid grid-cols-3 gap-3 sm:max-w-xl">
        {TABS.map((tab, i) => {
          const active = tab === status;
          return (
            <Link
              key={tab}
              href={`/sales/feedback?s=${tab}`}
              aria-current={active ? "page" : undefined}
              style={{ "--i": i } as React.CSSProperties}
              className={cx(
                "rounded-2xl border p-4 transition-[transform,box-shadow] duration-300 active:scale-[0.98]",
                active ? "border-ink bg-ink text-on-ink shadow-lift" : "border-line bg-surface shadow-soft hover:-translate-y-1 hover:shadow-lift",
              )}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <span className="relative flex size-2">
                  {tab === "PENDING" && counts[0] > 0 && !active && <span className="absolute inset-0 animate-ping rounded-full bg-sun opacity-70" />}
                  <span className={cx("relative size-2 rounded-full", tab === "PENDING" ? "bg-sun" : tab === "APPROVED" ? "bg-high" : "bg-low")} />
                </span>
                {F.tabs[tab]}
              </span>
              <CountUp value={counts[i]} className="mt-2 block text-3xl font-semibold" />
            </Link>
          );
        })}
      </nav>

      <div className="mt-6">
        {items.length === 0 ? (
          <EmptyState title={F.empty} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((f, i) => (
              <Card
                key={f.id}
                interactive
                className="animate-[rise_0.5s_var(--ease-out-soft)_both] p-5"
                style={{ animationDelay: `${150 + Math.min(i, 8) * 70}ms` }}
              >
                <div className="flex items-center justify-between gap-3">
                  <Stars value={f.rating} />
                  <span className="flex items-center gap-2 text-[12px] text-muted">
                    {f.sample && <span className="rounded-full bg-low-soft px-2 py-0.5 font-medium text-low">{t.feedback.sample}</span>}
                    <span className="rounded-full bg-paper px-2 py-0.5 uppercase">{f.lang}</span>
                    {f.createdAt.toLocaleDateString(dateLocale(lang), { day: "numeric", month: "short" })}
                  </span>
                </div>
                <p className="mt-3 text-[15px] leading-relaxed">“{f.message}”</p>
                <p className="mt-3 text-sm text-muted">
                  {f.name ?? F.anonymous}
                  {f.city ? ` · ${f.city}` : ""}
                </p>
                <div className="mt-4 flex gap-2 border-t border-line pt-4">
                  {f.status !== "APPROVED" && (
                    <form action={updateFeedback.bind(null, f.id, "APPROVED")}>
                      <button className="rounded-lg bg-brand px-3.5 py-2 text-sm font-medium text-on-brand transition-transform hover:scale-[1.03] active:scale-95">
                        {F.approve}
                      </button>
                    </form>
                  )}
                  {f.status !== "HIDDEN" && (
                    <form action={updateFeedback.bind(null, f.id, "HIDDEN")}>
                      <button className="rounded-lg border border-line-strong px-3.5 py-2 text-sm font-medium transition-transform hover:scale-[1.03] active:scale-95">
                        {F.hide}
                      </button>
                    </form>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
