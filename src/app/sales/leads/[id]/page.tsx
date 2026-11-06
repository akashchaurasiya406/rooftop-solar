import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, inr, ScoreBadge } from "@/components/ui";
import { billExtractionSchema, EXTRACTED_FIELDS, type ExtractedField } from "@/lib/ai/extraction";
import { requireRole } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { BillReview } from "./bill-review";

export const metadata: Metadata = { title: "Lead" };

const ROOF = { RCC: "Concrete (RCC)", METAL_SHEET: "Metal sheet", ASBESTOS: "Asbestos", OTHER: "Other" } as const;
const NEXT_STEP = {
  NEW: "Waiting for the bill to be read",
  BILL_REVIEW: "Check the bill values",
  REUPLOAD_REQUESTED: "Waiting for a clearer photo",
  SURVEY: "Book a survey visit",
  CALL_ONLY: "Call first — no visit yet",
  QUOTED: "Quote sent",
  WON: "Won",
  LOST: "Lost",
} as const;

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("SALES", "ADMIN");
  const { id } = await params;
  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { name: true } },
      bills: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          imagePath: true,
          fileMime: true,
          aiExtraction: true,
          aiIssues: true,
          aiError: true,
          aiModel: true,
          reuploadReason: true,
          consumerNumber: true,
          tariffCategory: true,
          sanctionedLoadKw: true,
          monthlyUnits: true,
          billAmount: true,
          verifiedAt: true,
          verifiedBy: { select: { name: true } },
          createdAt: true,
        },
      },
    },
  });
  if (!lead) notFound();

  const bill = lead.bills[0];
  const fileUrl = bill ? (bill.fileMime ? `/api/bills/${bill.id}/file` : bill.imagePath) : null;
  const isPdf = bill?.fileMime === "application/pdf";

  const raw = billExtractionSchema.safeParse(bill?.aiExtraction);
  const seeded = bill?.aiExtraction && typeof bill.aiExtraction === "object" && "source" in bill.aiExtraction;
  const confidence: Partial<Record<ExtractedField, number>> = {};
  if (raw.success) for (const f of EXTRACTED_FIELDS) confidence[f] = raw.data[f].confidence;
  else if (seeded) {
    const s = bill!.aiExtraction as Record<string, { confidence?: number }>;
    for (const f of EXTRACTED_FIELDS) if (typeof s[f]?.confidence === "number") confidence[f] = s[f].confidence;
  }

  const issues = (bill?.aiIssues as { issues?: string[]; needsCheck?: ExtractedField[] } | null) ?? null;
  const needsCheck = Array.isArray(issues?.needsCheck) ? issues.needsCheck : [];
  const issueList = Array.isArray(issues?.issues) ? issues.issues : Array.isArray(bill?.aiIssues) ? (bill!.aiIssues as string[]) : [];
  const reasons = (lead.scoreReasons as string[] | null) ?? [];
  const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

  return (
    <>
      <Link href="/sales" className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-ink">
        <span aria-hidden>←</span> All leads
      </Link>

      <div className="mt-4 flex animate-rise flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[13px] text-muted">
            {lead.code} · {lead.district ?? "Outside service area"} · {lead.pincode}
          </p>
          <h1 className="mt-1 text-[1.75rem] font-semibold tracking-tight">{lead.name}</h1>
          <p className="mt-1 text-[15px] text-muted">
            {lead.phone && (
              <a href={`tel:${lead.phone}`} className="font-medium text-brand underline-offset-4 hover:underline">
                {lead.phone}
              </a>
            )}
            {lead.assignedTo && <> · Assigned to {lead.assignedTo.name}</>}
          </p>
        </div>
        <div className="text-right">
          <ScoreBadge score={lead.score} />
          <p className="mt-2 text-sm font-medium">{NEXT_STEP[lead.status]}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_400px]">
        <div className="space-y-4">
          <Card className="animate-[rise_0.6s_var(--ease-out-soft)_0.05s_both] overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-3 text-sm">
              <span className="font-medium">Electricity bill</span>
              {fileUrl && (
                <a href={fileUrl} target="_blank" rel="noopener" className="font-medium text-brand underline-offset-4 hover:underline">
                  Open full size
                </a>
              )}
            </div>
            <div className="dots flex min-h-72 items-center justify-center bg-paper p-4">
              {!fileUrl ? (
                <p className="text-sm text-muted">No bill uploaded yet.</p>
              ) : isPdf ? (
                <object data={fileUrl} type="application/pdf" className="h-[70vh] w-full rounded-lg">
                  <a href={fileUrl}>Open the PDF</a>
                </object>
              ) : (
                <img src={fileUrl} alt={`Electricity bill for ${lead.code}`} className="max-h-[70vh] w-auto rounded-lg shadow-lift" />
              )}
            </div>
            {lead.bills.length > 1 && (
              <p className="border-t border-line px-5 py-3 text-[13px] text-muted">
                {lead.bills.length} photos uploaded — showing the latest.
              </p>
            )}
          </Card>

          <Card className="animate-[rise_0.6s_var(--ease-out-soft)_0.1s_both] p-5">
            <h2 className="text-sm font-medium text-muted">Why this score</h2>
            <ul className="mt-3 space-y-2 text-[15px]">
              {reasons.map((r) => (
                <li key={r} className="flex gap-2">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-ink/40" />
                  {r}
                </li>
              ))}
            </ul>
            <dl className="num mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-muted">Owner?</dt>
                <dd className="font-medium">{lead.ownership === "OWNER" ? "Owns house" : "Tenant"}</dd>
              </div>
              <div>
                <dt className="text-muted">Roof</dt>
                <dd className="font-medium">{ROOF[lead.roofType]}</dd>
              </div>
              <div>
                <dt className="text-muted">Roof area</dt>
                <dd className="font-medium">{lead.roofAreaSqft} sq ft</dd>
              </div>
              <div>
                <dt className="text-muted">Said bill</dt>
                <dd className="font-medium">{inr(lead.monthlyBill)}/mo</dd>
              </div>
              <div>
                <dt className="text-muted">Suggested size</dt>
                <dd className="font-medium">{lead.recommendedKw ? `${lead.recommendedKw} kW` : "—"}</dd>
              </div>
            </dl>
          </Card>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card className="animate-[rise_0.6s_var(--ease-out-soft)_0.15s_both] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">Check the bill values</h2>
                <p className="mt-0.5 text-[13px] text-muted">
                  {bill?.status === "CONFIRMED"
                    ? `Confirmed${bill.verifiedBy ? ` by ${bill.verifiedBy.name}` : ""}${bill.verifiedAt ? ` · ${bill.verifiedAt.toLocaleDateString("en-IN")}` : ""}`
                    : "Read by AI. Compare with the bill, fix anything wrong, then confirm."}
                </p>
              </div>
            </div>

            {bill?.status === "NEEDS_REUPLOAD" ? (
              <div className="mt-4 rounded-xl bg-sun-soft p-4 text-sm text-[#7a4510]">
                <p className="font-medium">Waiting for a new photo</p>
                <p className="mt-1">{bill.reuploadReason}</p>
              </div>
            ) : bill ? (
              <>
                {issueList.length > 0 && bill.status !== "CONFIRMED" && (
                  <ul className="mt-4 space-y-1.5 rounded-xl bg-medium-soft/60 p-3 text-[13px] text-[#7a4510]">
                    {issueList.map((i) => (
                      <li key={i}>• {i}</li>
                    ))}
                  </ul>
                )}
                <div className="mt-4">
                  <BillReview
                    leadId={lead.id}
                    billId={bill.id}
                    initial={{
                      consumerNumber: str(bill.consumerNumber),
                      tariffCategory: str(bill.tariffCategory),
                      sanctionedLoadKw: str(bill.sanctionedLoadKw),
                      monthlyUnits: str(bill.monthlyUnits),
                      billAmount: str(bill.billAmount),
                    }}
                    confidence={confidence}
                    needsCheck={needsCheck}
                    confirmed={bill.status === "CONFIRMED"}
                    aiFailed={bill.status === "UPLOADED" && !!bill.aiError}
                    canReadAgain={!!bill.fileMime}
                  />
                </div>
                {bill.aiModel && <p className="mt-4 text-[12px] text-muted">Read by {bill.aiModel}. Values are suggestions until a person confirms them.</p>}
              </>
            ) : (
              <p className="mt-4 text-sm text-muted">No bill yet.</p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
