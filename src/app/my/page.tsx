import type { Metadata } from "next";
import type { LeadStatus } from "@prisma/client";
import { AppHeader } from "@/components/app-header";
import { Card, cx, EmptyState, inr, stagger } from "@/components/ui";
import { requireRole } from "@/lib/auth/server";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "My solar" };

const STEPS = ["Request received", "Bill checked", "Visit or call", "Quote ready", "Installation"];

const STATUS: Record<LeadStatus, { title: string; body: string; step: number; needsYou?: boolean }> = {
  NEW: { title: "We received your request", body: "We'll read your bill shortly.", step: 0 },
  BILL_REVIEW: { title: "We are checking your bill", body: "Our team is confirming the details we read from it.", step: 1 },
  REUPLOAD_REQUESTED: { title: "Please upload a clearer bill photo", body: "We couldn't read some values on your bill.", step: 1, needsYou: true },
  SURVEY: { title: "A surveyor will contact you", body: "They'll call to fix a time to check your roof.", step: 2 },
  CALL_ONLY: { title: "Our team will call you", body: "A short call to understand your needs before any visit.", step: 2 },
  QUOTED: { title: "Your quote is ready", body: "See your system size, subsidy and payback.", step: 3 },
  WON: { title: "Installation in progress", body: "We'll update you at every stage.", step: 4 },
  LOST: { title: "Request closed", body: "Contact us any time to restart.", step: -1 },
};

export default async function MyPage() {
  const session = await requireRole("HOMEOWNER");
  const leads = await db.lead.findMany({
    where: { homeownerId: session.userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, code: true, status: true, monthlyBill: true, recommendedKw: true, createdAt: true },
  });

  return (
    <div className="dawn min-h-dvh">
      <AppHeader session={session} />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="animate-rise">
          <h1 className="text-[1.75rem] font-semibold tracking-tight">Namaste, {session.name.split(" ")[0]} 👋</h1>
          <p className="mt-1 text-[15px] text-muted">Your solar requests and where they stand.</p>
        </div>

        <div className="stagger mt-8 space-y-4">
          {leads.length === 0 ? (
            <EmptyState
              title="No requests yet"
              body="Once you tell us about your home and upload an electricity bill, you'll see the progress here."
            />
          ) : (
            leads.map((l, i) => {
              const s = STATUS[l.status];
              const pct = s.step < 0 ? 0 : (s.step / (STEPS.length - 1)) * 100;
              return (
                <Card key={l.id} style={stagger(i + 1)} className="overflow-hidden">
                  <div className="p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-3 text-[13px] text-muted">
                      <span>Request {l.code}</span>
                      <span>{l.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                    <p className="mt-3 text-xl font-semibold tracking-tight">{s.title}</p>
                    <p className="mt-1 text-[15px] text-muted">{s.body}</p>
                    {s.needsYou && (
                      <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-sun-soft px-3 py-1 text-[13px] font-medium text-[#9a5a12]">
                        <span className="size-1.5 animate-pulse rounded-full bg-sun" /> Action needed from you
                      </p>
                    )}

                    {s.step >= 0 && (
                      <div className="mt-7">
                        <div className="relative h-1.5 rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={STEPS.length} aria-valuenow={s.step + 1} aria-label="Progress">
                          <div
                            className="absolute inset-y-0 left-0 origin-left animate-[grow_1s_var(--ease-out-soft)_0.3s_both] rounded-full bg-brand"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <ol className="mt-3 grid grid-cols-5 gap-1 text-center text-[11px] leading-tight sm:text-xs">
                          {STEPS.map((label, idx) => (
                            <li key={label} className={cx(idx <= s.step ? "font-medium text-ink" : "text-muted")}>
                              <span
                                aria-hidden
                                className={cx(
                                  "mx-auto mb-1.5 block size-2.5 rounded-full border-2 transition-colors",
                                  idx < s.step && "border-brand bg-brand",
                                  idx === s.step && "border-brand bg-surface ring-4 ring-brand-soft",
                                  idx > s.step && "border-line-strong bg-surface",
                                )}
                              />
                              {label}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
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
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
