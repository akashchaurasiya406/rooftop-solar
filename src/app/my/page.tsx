import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Card, EmptyState, inr, stagger } from "@/components/ui";
import { requireRole } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { HOMEOWNER_STATUS, NeedsYouPill, Progress } from "./progress";

export const metadata: Metadata = { title: "My solar" };

export default async function MyPage() {
  const session = await requireRole("HOMEOWNER");
  const leads = await db.lead.findMany({
    where: { homeownerId: session.userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, code: true, status: true, monthlyBill: true, recommendedKw: true, createdAt: true },
  });

  return (
    <>
      <div className="flex animate-rise flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-semibold tracking-tight">Namaste, {session.name.split(" ")[0]} 👋</h1>
          <p className="mt-1 text-[15px] text-muted">Your solar requests and where they stand.</p>
        </div>
        {leads.length > 0 && (
          <ButtonLink href="/my/new" variant="secondary">
            Check another home
          </ButtonLink>
        )}
      </div>

      <div className="stagger mt-8 space-y-4">
        {leads.length === 0 ? (
          <EmptyState
            title="Let's check your home"
            body="Tell us about your roof and upload an electricity bill. You'll know in a minute if solar suits you."
            action={<ButtonLink href="/my/new">Check my home</ButtonLink>}
          />
        ) : (
          leads.map((l, i) => {
            const s = HOMEOWNER_STATUS[l.status];
            return (
              <Link key={l.id} href={`/my/requests/${l.id}`} style={stagger(i + 1)} className="block rounded-[var(--radius-card)]">
                <Card interactive className="overflow-hidden">
                  <div className="p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-3 text-[13px] text-muted">
                      <span>Request {l.code}</span>
                      <span>{l.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                    <p className="mt-3 text-xl font-semibold tracking-tight">{s.title}</p>
                    <p className="mt-1 text-[15px] text-muted">{s.body}</p>
                    {s.needsYou && (
                      <div className="mt-3">
                        <NeedsYouPill />
                      </div>
                    )}
                    <div className="mt-7">
                      <Progress step={s.step} />
                    </div>
                  </div>
                  <dl className="num grid grid-cols-2 border-t border-line bg-paper/60 text-sm">
                    <div className="px-5 py-4 sm:px-6">
                      <dt className="text-muted">Your monthly bill</dt>
                      <dd className="mt-0.5 text-base font-semibold">{inr(l.monthlyBill)}</dd>
                    </div>
                    <div className="border-l border-line px-5 py-4 sm:px-6">
                      <dt className="text-muted">Suggested system</dt>
                      <dd className="mt-0.5 text-base font-semibold">{l.recommendedKw ? `${l.recommendedKw} kW` : "After review"}</dd>
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
