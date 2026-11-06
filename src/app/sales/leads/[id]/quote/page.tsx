import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Alert } from "@/components/ui";
import { requireRole } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { confirmedUnits } from "@/lib/quotes/service";
import { getEffectiveRules, MissingRulesError } from "@/lib/rules-repo";
import { QuoteBuilder } from "./quote-builder";

export const metadata: Metadata = { title: "Build quote" };

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("SALES", "ADMIN");
  const { id } = await params;
  const lead = await db.lead.findUnique({
    where: { id },
    select: { id: true, code: true, name: true, ownership: true, roofAreaSqft: true, recommendedKw: true, status: true },
  });
  if (!lead) notFound();

  const back = (
    <Link href={`/sales/leads/${lead.id}`} className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-ink">
      <span aria-hidden>←</span> {lead.name}
    </Link>
  );

  const units = await confirmedUnits(lead.id);
  let problem: string | null = null;
  if (lead.ownership === "TENANT") problem = "Tenants need the owner's written consent before we can quote.";
  else if (lead.status === "WON") problem = "This customer has already accepted a quote.";
  else if (units === null) problem = "Confirm the bill values on the lead page before building a quote.";

  let rules;
  try {
    rules = await getEffectiveRules();
  } catch (e) {
    if (!(e instanceof MissingRulesError)) throw e;
    problem = `${e.message} Ask a sales manager to add one on the Rules page.`;
  }

  return (
    <>
      {back}
      <div className="mt-4 animate-rise">
        <p className="text-[13px] text-muted">{lead.code}</p>
        <h1 className="mt-1 text-[1.75rem] font-semibold tracking-tight">Quote for {lead.name}</h1>
        <p className="mt-1 text-[15px] text-muted">Pick a size. Every number updates as you go.</p>
      </div>
      <div className="mt-6 animate-[rise_0.6s_var(--ease-out-soft)_0.1s_both]">
        {problem || !rules || units === null ? (
          <Alert>{problem}</Alert>
        ) : (
          <QuoteBuilder
            leadId={lead.id}
            monthlyUnits={units}
            suggestedKw={lead.recommendedKw ?? 1}
            roofMaxKw={Math.floor(lead.roofAreaSqft / rules.setting.sqftPerKw) || null}
            rules={{
              bands: rules.bands.map(({ minKw, maxKw, pricePerKw }) => ({ minKw, maxKw, pricePerKw })),
              subsidy: { slabs: rules.subsidy.slabs, capAmount: rules.subsidy.capAmount },
              setting: {
                generationPerKwYear: rules.setting.generationPerKwYear,
                tariffPerUnit: rules.setting.tariffPerUnit,
                exportRatePerUnit: rules.setting.exportRatePerUnit,
              },
            }}
          />
        )}
      </div>
    </>
  );
}
