import { CodedError } from "@/lib/errors";
import "server-only";
import { db } from "@/lib/db";
import { subsidySlabsSchema, type CalcSettingInput, type PriceBand, type SubsidyRuleInput } from "@/lib/calc/quote";
import { isEffectiveOn, pickEffective } from "@/lib/calc/rules";

export interface EffectiveRules {
  on: Date;
  subsidy: SubsidyRuleInput & { id: string; name: string };
  bands: (PriceBand & { id: string })[];
  setting: CalcSettingInput & { id: string; sqftPerKw: number };
}

export class MissingRulesError extends CodedError {}

export async function getEffectiveRules(on: Date = new Date()): Promise<EffectiveRules> {
  const [subsidyRules, priceRules, settings] = await Promise.all([
    db.subsidyRule.findMany(),
    db.priceRule.findMany({ orderBy: { minKw: "asc" } }),
    db.calcSetting.findMany(),
  ]);

  const subsidy = pickEffective(subsidyRules, on);
  const setting = pickEffective(settings, on);
  const bands = priceRules.filter((r) => isEffectiveOn(r, on));

  if (!subsidy) throw new MissingRulesError("NO_SUBSIDY", "No subsidy rule is in effect for this date.");
  if (!setting) throw new MissingRulesError("NO_SETTING", "No calculation settings are in effect for this date.");
  if (bands.length === 0) throw new MissingRulesError("NO_PRICE", "No prices are in effect for this date.");

  return {
    on,
    subsidy: {
      id: subsidy.id,
      name: subsidy.name,
      capAmount: subsidy.capAmount,
      slabs: subsidySlabsSchema.parse(subsidy.slabs),
    },
    bands: bands.map((b) => ({ id: b.id, minKw: b.minKw, maxKw: b.maxKw, pricePerKw: b.pricePerKw })),
    setting: {
      id: setting.id,
      generationPerKwYear: setting.generationPerKwYear,
      tariffPerUnit: setting.tariffPerUnit,
      exportRatePerUnit: setting.exportRatePerUnit,
      sqftPerKw: setting.sqftPerKw,
    },
  };
}
