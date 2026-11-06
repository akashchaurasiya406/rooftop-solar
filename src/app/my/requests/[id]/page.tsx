import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Alert, Card, inr } from "@/components/ui";
import { maskConsumerNumber } from "@/lib/ai/extraction";
import { requireRole } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { HOMEOWNER_STATUS, NeedsYouPill, Progress } from "../../progress";
import { ReuploadForm } from "./reupload-form";

export const metadata: Metadata = { title: "My request" };

export default async function RequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sent?: string }>;
}) {
  const session = await requireRole("HOMEOWNER");
  const [{ id }, { sent }] = await Promise.all([params, searchParams]);

  const lead = await db.lead.findFirst({
    where: { id, homeownerId: session.userId },
    select: {
      id: true,
      code: true,
      status: true,
      monthlyBill: true,
      recommendedKw: true,
      createdAt: true,
      bills: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          status: true,
          aiError: true,
          reuploadReason: true,
          consumerNumber: true,
          monthlyUnits: true,
          sanctionedLoadKw: true,
          billAmount: true,
        },
      },
    },
  });
  if (!lead) notFound();

  const s = HOMEOWNER_STATUS[lead.status];
  const bill = lead.bills[0];
  const readOk = bill && (bill.status === "EXTRACTED" || bill.status === "CONFIRMED") && bill.monthlyUnits !== null;
  const needsReupload = lead.status === "REUPLOAD_REQUESTED";

  return (
    <>
      <Link href="/my" className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-ink">
        <span aria-hidden>←</span> My requests
      </Link>

      {sent && !needsReupload && (
        <div className="mt-4">
          <Alert tone="info">Thanks! We&apos;ve received your request.</Alert>
        </div>
      )}

      <Card className="mt-4 animate-rise overflow-hidden">
        <div className="p-5 sm:p-6">
          <p className="text-[13px] text-muted">
            Request {lead.code} · {lead.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">{s.title}</h1>
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
      </Card>

      {needsReupload && (
        <Card className="mt-4 animate-[rise_0.6s_var(--ease-out-soft)_0.1s_both] p-5 sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight">Upload a clearer photo</h2>
          <p className="mt-1 text-[15px] text-muted">
            {bill?.reuploadReason ?? "We couldn't read your bill clearly. Please take a new photo."}
          </p>
          <ul className="mt-3 space-y-1 text-[13px] text-muted">
            <li>• Lay the bill flat in good light</li>
            <li>• Fit the whole bill in the photo</li>
            <li>• Hold the phone steady until it focuses</li>
          </ul>
          <div className="mt-5">
            <ReuploadForm leadId={lead.id} />
          </div>
        </Card>
      )}

      {readOk && (
        <Card className="mt-4 animate-[rise_0.6s_var(--ease-out-soft)_0.1s_both] overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
            <h2 className="font-semibold">What we read from your bill</h2>
            <span className="text-[13px] text-muted">{bill.status === "CONFIRMED" ? "✓ Confirmed by our team" : "Our team will confirm"}</span>
          </div>
          <dl className="num grid grid-cols-2 text-sm">
            {[
              ["Units used", `${bill.monthlyUnits} a month`],
              ["Sanctioned load", bill.sanctionedLoadKw ? `${bill.sanctionedLoadKw} kW` : "—"],
              ["Bill amount", bill.billAmount ? inr(bill.billAmount) : inr(lead.monthlyBill)],
              ["Consumer no.", maskConsumerNumber(bill.consumerNumber)],
            ].map(([k, v], i) => (
              <div key={k} className={`px-5 py-4 sm:px-6 ${i % 2 ? "border-l border-line" : ""} ${i > 1 ? "border-t border-line" : ""}`}>
                <dt className="text-muted">{k}</dt>
                <dd className="mt-0.5 text-base font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          {lead.recommendedKw && (
            <div className="border-t border-line bg-brand-soft/60 px-5 py-4 sm:px-6">
              <p className="text-sm text-brand">
                Suggested system: <span className="font-semibold">{lead.recommendedKw} kW</span>. Your exact quote comes after we check your roof.
              </p>
            </div>
          )}
        </Card>
      )}

      {bill && bill.status === "UPLOADED" && bill.aiError && !needsReupload && (
        <Card className="mt-4 p-5 sm:p-6">
          <p className="text-[15px]">We&apos;ve got your bill. Our team will read it by hand and get back to you shortly.</p>
        </Card>
      )}
    </>
  );
}
