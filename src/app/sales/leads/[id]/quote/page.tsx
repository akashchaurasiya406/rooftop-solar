import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Alert } from "@/components/ui";
import { requireRole } from "@/lib/auth/server";
import { getDict } from "@/lib/i18n";
import { fill } from "@/lib/i18n/format";
import { db } from "@/lib/db";
import { confirmedUnits } from "@/lib/quotes/service";
import { getEffectiveRules, MissingRulesError } from "@/lib/rules-repo";
import { QuoteBuilder } from "./quote-builder";

export const metadata: Metadata = { title: "Build quote" };

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const [, { t }, { id }] = await Promise.all([requireRole("SALES", "ADMIN"), getDict(), params]);
  const B = t.staff.builder;
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
  if (lead.ownership === "TENANT") problem = t.staff.errors.TENANT;
  else if (lead.status === "WON") problem = B.won;
  else if (units === null) problem = t.staff.errors.NOT_CONFIRMED;

  let rules;
  try {
    rules = await getEffectiveRules();
  } catch (e) {
    if (!(e instanceof MissingRulesError)) throw e;
    problem = `${t.staff.errors[e.code]} ${B.rulesMissing}`;
  }

  return (
    <>
      {back}
      <div className="mt-4 animate-rise">
        <p className="text-[13px] text-muted">{lead.code}</p>
        <h1 className="mt-1 text-[2rem] font-semibold tracking-tight">{fill(B.title, { name: lead.name })}</h1>
        <p className="mt-1 text-[15px] text-muted">{B.sub}</p>
      </div>
      <div className="mt-6 animate-[rise_0.6s_var(--ease-out-soft)_0.1s_both]">
        {problem || !rules || units === null ? (
          <Alert>{problem}</Alert>
        ) : (
          <QuoteBuilder
            leadId={lead.id}
            monthlyUnits={units}
            t={B}
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
