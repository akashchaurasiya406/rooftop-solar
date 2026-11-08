import type { Metadata } from "next";
import Link from "next/link";
import { CountUp } from "@/components/motion";
import { ButtonLink, Card, EmptyState, stagger } from "@/components/ui";
import { requireRole } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { dateLocale, getDict } from "@/lib/i18n";
import { homeownerStatus, NeedsYouPill, Progress } from "./progress";

export const metadata: Metadata = { title: "My solar" };

export default async function MyPage() {
  const [session, { lang, t }] = await Promise.all([requireRole("HOMEOWNER"), getDict()]);
  const leads = await db.lead.findMany({
    where: { homeownerId: session.userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, code: true, status: true, monthlyBill: true, recommendedKw: true, createdAt: true },
  });
  const M = t.my;

  return (
    <>
      <div className="flex animate-rise flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[2rem] font-semibold tracking-tight">
            {M.namaste}, {session.name.split(" ")[0]}{" "}
            <span className="inline-block origin-[70%_70%] animate-[wave_1.8s_ease-in-out_0.5s_2]">👋</span>
          </h1>
          <p className="mt-1 text-[15px] text-muted">{M.sub}</p>
        </div>
        {leads.length > 0 && (
          <ButtonLink href="/my/new" variant="secondary">
            {M.checkAnother}
          </ButtonLink>
        )}
      </div>

      <div className="stagger mt-8 space-y-4">
        {leads.length === 0 ? (
          <EmptyState title={M.emptyTitle} body={M.emptyBody} action={<ButtonLink href="/my/new">{t.common.checkMyHome}</ButtonLink>} />
        ) : (
          leads.map((l, i) => {
            const s = homeownerStatus(t, l.status);
            return (
              <Link key={l.id} href={`/my/requests/${l.id}`} style={stagger(i + 1)} className="block rounded-[var(--radius-card)]">
                <Card interactive className="overflow-hidden">
                  <div className="p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-3 text-[13px] text-muted">
                      <span>
                        {M.request} {l.code}
                      </span>
                      <span>{l.createdAt.toLocaleDateString(dateLocale(lang), { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                    <p className="mt-3 text-xl font-semibold tracking-tight">{s.title}</p>
                    <p className="mt-1 text-[15px] text-muted">{s.body}</p>
                    {s.needsYou && (
                      <div className="mt-3">
                        <NeedsYouPill label={M.needsYou} />
                      </div>
                    )}
                    <div className="mt-7">
                      <Progress step={s.step} steps={M.steps} />
                    </div>
                  </div>
                  <dl className="num grid grid-cols-2 border-t border-line bg-paper/60 text-sm">
                    <div className="px-5 py-4 sm:px-6">
                      <dt className="text-muted">{M.monthlyBill}</dt>
                      <dd className="mt-0.5 text-base font-semibold">
                        <CountUp prefix="₹" value={l.monthlyBill} />
                      </dd>
                    </div>
                    <div className="border-l border-line px-5 py-4 sm:px-6">
                      <dt className="text-muted">{M.suggested}</dt>
                      <dd className="mt-0.5 text-base font-semibold">{l.recommendedKw ? `${l.recommendedKw} kW` : M.afterReview}</dd>
                    </div>
                  </dl>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </>
  );
}
