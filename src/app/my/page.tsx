import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";
import { Card, EmptyState, inr } from "@/components/ui";
import { requireRole } from "@/lib/auth/server";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "My solar" };

// Homeowner-facing wording: plain, no internal jargon, no scores.
const HOMEOWNER_STATUS: Record<string, string> = {
  NEW: "We received your request",
  BILL_REVIEW: "We are checking your bill",
  REUPLOAD_REQUESTED: "Please upload a clearer bill photo",
  SURVEY: "A surveyor will contact you to visit",
  CALL_ONLY: "Our team will call you",
  QUOTED: "Your quote is ready",
  WON: "Installation in progress",
  LOST: "Request closed",
};

export default async function MyPage() {
  const session = await requireRole("HOMEOWNER");
  // Access control: a homeowner only ever sees their own leads.
  const leads = await db.lead.findMany({
    where: { homeownerId: session.userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, code: true, status: true, monthlyBill: true, recommendedKw: true, createdAt: true },
  });

  return (
    <>
      <AppHeader session={session} />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Namaste, {session.name.split(" ")[0]}</h1>
        <p className="mt-1 text-[15px] text-muted">Your solar requests and their progress.</p>

        <div className="mt-6 space-y-3">
          {leads.length === 0 ? (
            <EmptyState
              title="No requests yet"
              body="Once you tell us about your home and upload an electricity bill, you'll see the progress here."
            />
          ) : (
            leads.map((l) => (
              <Card key={l.id} className="p-5">
                <p className="text-[13px] text-muted">
                  Request {l.code} · {l.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
                <p className="mt-1 text-lg font-medium">{HOMEOWNER_STATUS[l.status]}</p>
                <dl className="num mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-muted">Your monthly bill</dt>
                    <dd className="mt-0.5 font-medium">{inr(l.monthlyBill)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Suggested system</dt>
                    <dd className="mt-0.5 font-medium">{l.recommendedKw ? `${l.recommendedKw} kW` : "After review"}</dd>
                  </div>
                </dl>
              </Card>
            ))
          )}
        </div>
      </main>
    </>
  );
}
