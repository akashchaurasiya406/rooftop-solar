import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Alert, ButtonLink, Card, cx, inr, ScoreBadge } from "@/components/ui";
import { billExtractionSchema, EXTRACTED_FIELDS, type ExtractedField } from "@/lib/ai/extraction";
import { requireRole } from "@/lib/auth/server";
import { formatReason, parseReasons } from "@/lib/calc/reasons";
import { db } from "@/lib/db";
import { dateLocale, getDict } from "@/lib/i18n";
import { fill } from "@/lib/i18n/format";
import { BillReview } from "./bill-review";

export const metadata: Metadata = { title: "Lead" };

export default async function LeadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ quote?: string }>;
}) {
  const [, { lang, t }, { id }, { quote: quoteFlag }] = await Promise.all([requireRole("SALES", "ADMIN"), getDict(), params, searchParams]);
  const S = t.staff;
  const L = S.lead;
  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { name: true } },
      quotes: { orderBy: { createdAt: "desc" }, select: { id: true, code: true, systemKw: true, netCost: true, paybackYears: true, status: true } },
      project: { select: { id: true, stage: true } },
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
  const englishIssues = Array.isArray(issues?.issues) ? issues.issues : Array.isArray(bill?.aiIssues) ? (bill!.aiIssues as string[]) : [];
  const issueList = lang === "en" ? englishIssues : needsCheck.map((f) => fill(L.checkField, { field: S.review.fields[f] }));
  const reasons = parseReasons(lead.scoreReasons).map((r) => formatReason(t.reasons, r));
  const confirmedBill = lead.bills.some((b) => b.status === "CONFIRMED");
  const quoteBlocker = lead.ownership === "TENANT" ? L.tenantBlock : !confirmedBill ? L.confirmFirst : null;
  const canQuote = quoteBlocker === null && lead.status !== "WON";
  const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));
  const reuploadText = lang === "en" ? bill?.reuploadReason : S.review.fixDefault;

  return (
    <>
      <Link href="/sales" className="group inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-ink">
        <span aria-hidden className="transition-transform duration-300 group-hover:-translate-x-1">
          ←
        </span>{" "}
        {L.all}
      </Link>

      <div className="mt-4 flex animate-rise flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[13px] text-muted">
            {lead.code} · {lead.district ?? L.outside} · {lead.pincode}
          </p>
          <h1 className="mt-1 text-[2rem] font-semibold tracking-tight">{lead.name}</h1>
          <p className="mt-1 text-[15px] text-muted">
            {lead.phone && (
              <a href={`tel:${lead.phone}`} className="font-medium text-brand underline-offset-4 hover:underline">
                {lead.phone}
              </a>
            )}
            {lead.assignedTo && <> · {fill(L.assigned, { name: lead.assignedTo.name })}</>}
          </p>
        </div>
        <div className="text-right">
          <span className="inline-block animate-[pop_0.5s_var(--ease-out-soft)_0.25s_both]">
            <ScoreBadge score={lead.score} labels={S.score} />
          </span>
          <p className="mt-2 text-sm font-medium">{L.next[lead.status]}</p>
        </div>
      </div>

      {quoteFlag === "sent" && (
        <div className="mt-4">
          <Alert tone="info">{L.quoteSent}</Alert>
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_400px]">
        <div className="space-y-4">
          <Card className="animate-[rise_0.6s_var(--ease-out-soft)_0.05s_both] overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-3 text-sm">
              <span className="font-medium">{L.bill}</span>
              {fileUrl && (
                <a href={fileUrl} target="_blank" rel="noopener" className="font-medium text-brand underline-offset-4 hover:underline">
                  {L.fullSize}
                </a>
              )}
            </div>
            <div className="dots group flex min-h-72 items-center justify-center overflow-hidden bg-paper p-4">
              {!fileUrl ? (
                <p className="text-sm text-muted">{L.noBill}</p>
              ) : isPdf ? (
                <object data={fileUrl} type="application/pdf" className="h-[70vh] w-full rounded-lg">
                  <a href={fileUrl}>{L.openPdf}</a>
                </object>
              ) : (
                <img
                  src={fileUrl}
                  alt={`${L.bill} ${lead.code}`}
                  className="max-h-[70vh] w-auto animate-[pop_0.7s_var(--ease-out-soft)_0.2s_both] rounded-lg shadow-lift transition-transform duration-500 group-hover:scale-[1.02]"
                />
              )}
            </div>
            {lead.bills.length > 1 && <p className="border-t border-line px-5 py-3 text-[13px] text-muted">{fill(L.photos, { n: lead.bills.length })}</p>}
          </Card>

          <Card className="animate-[rise_0.6s_var(--ease-out-soft)_0.1s_both] p-5">
            <h2 className="text-sm font-medium text-muted">{L.why}</h2>
            <ul className="mt-3 space-y-2 text-[15px]">
              {reasons.map((r, i) => (
                <li key={r} className="flex animate-[rise_0.5s_var(--ease-out-soft)_both] gap-2" style={{ animationDelay: `${300 + i * 120}ms` }}>
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                  {r}
                </li>
              ))}
            </ul>
            <dl className="num mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4 text-sm sm:grid-cols-4">
              {[
                [L.owner, lead.ownership === "OWNER" ? L.ownsHouse : L.tenant],
                [L.roof, L.roofs[lead.roofType]],
                [L.roofArea, `${lead.roofAreaSqft} ${L.sqft}`],
                [L.saidBill, `${inr(lead.monthlyBill)}${S.leads.perMonth}`],
                [L.suggestedSize, lead.recommendedKw ? `${lead.recommendedKw} kW` : "—"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="animate-[rise_0.6s_var(--ease-out-soft)_0.15s_both] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-medium text-muted">{L.quote}</h2>
              {lead.project ? (
                <ButtonLink href={`/sales/projects/${lead.project.id}`} variant="secondary">
                  {L.project}: {t.stages[lead.project.stage][0]} →
                </ButtonLink>
              ) : (
                canQuote && <ButtonLink href={`/sales/leads/${lead.id}/quote`}>{lead.quotes.length ? L.newQuote : L.buildQuote}</ButtonLink>
              )}
            </div>
            {!canQuote && !lead.project && quoteBlocker && <p className="mt-2 text-sm text-muted">{quoteBlocker}</p>}
            {lead.quotes.length > 0 && (
              <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
                {lead.quotes.map((q, i) => (
                  <li key={q.id} className={cx("flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-paper", i > 0 && "text-muted")}>
                    <span className="num">
                      <span className="font-medium text-ink">{q.code}</span> · {q.systemKw} kW · {inr(q.netCost)} ·{" "}
                      {q.paybackYears ? fill(L.ydPayback, { n: q.paybackYears }) : L.noPayback}
                    </span>
                    <span className="flex items-center gap-3">
                      <span
                        className={cx(
                          "rounded-full px-2 py-0.5 text-[12px] font-medium",
                          q.status === "ACCEPTED" ? "bg-high-soft text-high" : q.status === "SENT" ? "bg-brand-soft text-brand" : "bg-low-soft text-low",
                        )}
                      >
                        {L.quoteStatus[q.status]}
                      </span>
                      <a href={`/api/quotes/${q.id}/pdf`} target="_blank" rel="noopener" className="font-medium text-brand underline-offset-4 hover:underline">
                        PDF
                      </a>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card className="animate-[rise_0.6s_var(--ease-out-soft)_0.15s_both] p-5">
            <h2 className="font-semibold">{L.checkTitle}</h2>
            <p className="mt-0.5 text-[13px] text-muted">
              {bill?.status === "CONFIRMED"
                ? `${bill.verifiedBy ? fill(L.confirmedBy, { name: bill.verifiedBy.name }) : ""}${bill.verifiedAt ? ` · ${bill.verifiedAt.toLocaleDateString(dateLocale(lang))}` : ""}`
                : L.readByAi}
            </p>

            {bill?.status === "NEEDS_REUPLOAD" ? (
              <div className="mt-4 rounded-xl bg-sun-soft p-4 text-sm text-sun-ink">
                <p className="flex items-center gap-2 font-medium">
                  <span className="size-1.5 animate-pulse rounded-full bg-sun" />
                  {L.waitingPhoto}
                </p>
                <p className="mt-1">{reuploadText}</p>
              </div>
            ) : bill ? (
              <>
                {issueList.length > 0 && bill.status !== "CONFIRMED" && (
                  <ul className="mt-4 animate-pop space-y-1.5 rounded-xl bg-medium-soft/60 p-3 text-[13px] text-sun-ink">
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
                    t={S.review}
                  />
                </div>
                {bill.aiModel && <p className="mt-4 text-[12px] text-muted">{fill(L.readBy, { model: bill.aiModel })}</p>}
              </>
            ) : (
              <p className="mt-4 text-sm text-muted">{L.noBillYet}</p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
