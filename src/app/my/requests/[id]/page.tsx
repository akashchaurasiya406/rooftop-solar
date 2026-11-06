import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QuoteStory } from "@/components/quote-story";
import { Alert, Card, cx, inr } from "@/components/ui";
import { baseUrl } from "@/lib/base-url";
import type { QuoteResult } from "@/lib/calc/quote";
import { STAGE_INFO, STAGES, stageIndex } from "@/lib/projects/stages";
import { advanceFor } from "@/lib/quotes/options";
import { maskConsumerNumber } from "@/lib/ai/extraction";
import { requireRole } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { HOMEOWNER_STATUS, NeedsYouPill, Progress } from "../../progress";
import { AcceptQuote, CopyLink } from "./accept-quote";
import { ReuploadForm } from "./reupload-form";

export const metadata: Metadata = { title: "My request" };

export default async function RequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sent?: string; accepted?: string }>;
}) {
  const session = await requireRole("HOMEOWNER");
  const [{ id }, { sent, accepted }] = await Promise.all([params, searchParams]);

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
      quotes: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, code: true, systemKw: true, netCost: true, options: true, status: true, validUntil: true },
      },
      project: { select: { stage: true, statusToken: true, advanceAmount: true, stageUpdated: true } },
    },
  });
  if (!lead) notFound();

  const s = HOMEOWNER_STATUS[lead.status];
  const bill = lead.bills[0];
  const readOk = bill && (bill.status === "EXTRACTED" || bill.status === "CONFIRMED") && bill.monthlyUnits !== null;
  const needsReupload = lead.status === "REUPLOAD_REQUESTED";
  const quote = lead.quotes[0];
  const quoteOptions = (quote?.options as unknown as QuoteResult[] | undefined) ?? [];
  const chosen = quoteOptions.find((o) => o.systemKw === quote?.systemKw);
  const quoteOpen = quote && quote.status === "SENT" && !lead.project;
  const expired = quote ? quote.validUntil < new Date() : false;
  const statusUrl = lead.project ? `${await baseUrl()}/status/${lead.project.statusToken}` : null;
  const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

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

      {accepted && (
        <div className="mt-4">
          <Alert tone="info">Thank you! Your advance is confirmed and your installation has started.</Alert>
        </div>
      )}

      {lead.project && statusUrl && (
        <Card className="mt-4 animate-[rise_0.6s_var(--ease-out-soft)_0.1s_both] overflow-hidden">
          <div className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight">Your installation</h2>
            <p className="mt-1 text-[15px] text-muted">{STAGE_INFO[lead.project.stage].customer}</p>
            <ol className="mt-5 space-y-0">
              {STAGES.map((st, i) => {
                const cur = stageIndex(lead.project!.stage);
                return (
                  <li key={st} className="flex gap-3">
                    <span className="flex flex-col items-center">
                      <span
                        className={cx(
                          "mt-1 size-3 rounded-full border-2",
                          i < cur && "border-brand bg-brand",
                          i === cur && "border-brand bg-surface ring-4 ring-brand-soft",
                          i > cur && "border-line-strong bg-surface",
                        )}
                      />
                      {i < STAGES.length - 1 && <span className={cx("my-1 w-0.5 flex-1", i < cur ? "bg-brand" : "bg-line")} />}
                    </span>
                    <span className={cx("pb-4 text-[15px]", i <= cur ? "font-medium" : "text-muted")}>{STAGE_INFO[st].label}</span>
                  </li>
                );
              })}
            </ol>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-paper/60 px-5 py-3 sm:px-6">
            <a href={statusUrl} className="text-sm font-medium text-brand underline-offset-4 hover:underline">
              Open status page
            </a>
            <CopyLink url={statusUrl} />
          </div>
        </Card>
      )}

      {quoteOpen && chosen && (
        <Card className="mt-4 animate-[rise_0.6s_var(--ease-out-soft)_0.1s_both] p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold tracking-tight">Your quote</h2>
            <span className="text-[13px] text-muted">
              {quote.code} · valid until {fmt(quote.validUntil)}
            </span>
          </div>
          <QuoteStory q={chosen} className="mt-4" />
          {quoteOptions.length > 1 && (
            <div className="mt-5">
              <p className="text-sm text-muted">Other sizes we looked at</p>
              <ul className="num mt-2 divide-y divide-line text-sm">
                {quoteOptions
                  .filter((o) => o.systemKw !== chosen.systemKw)
                  .map((o) => (
                    <li key={o.systemKw} className="flex justify-between py-2.5">
                      <span>{o.systemKw} kW</span>
                      <span className="text-muted">
                        {inr(o.netCost)} · {o.paybackYears === null ? "no payback" : `pays back in ${o.paybackYears} yrs`}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
          <a
            href={`/api/quotes/${quote.id}/pdf`}
            target="_blank"
            rel="noopener"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand underline-offset-4 hover:underline"
          >
            Download quote PDF
          </a>
          <div className="mt-5 border-t border-line pt-5">
            {expired ? (
              <Alert>This quote has expired. Our team will send you a fresh one.</Alert>
            ) : (
              <AcceptQuote quoteId={quote.id} leadId={lead.id} advance={advanceFor(quote.netCost)} />
            )}
          </div>
        </Card>
      )}

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
