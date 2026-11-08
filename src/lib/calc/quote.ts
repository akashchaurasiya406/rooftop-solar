import { z } from "zod";

export const subsidySlabSchema = z.object({
  uptoKw: z.number().positive(),
  perKw: z.number().int().nonnegative(),
});

export const subsidySlabsSchema = z.array(subsidySlabSchema).min(1);
export type SubsidySlab = z.infer<typeof subsidySlabSchema>;

export interface SubsidyRuleInput {
  slabs: SubsidySlab[];
  capAmount: number;
}

export interface PriceBand {
  minKw: number;
  maxKw: number;
  pricePerKw: number;
}

export interface CalcSettingInput {
  generationPerKwYear: number;
  tariffPerUnit: number;
  exportRatePerUnit: number;
}

export function computeSubsidy(kw: number, rule: SubsidyRuleInput): number {
  if (!(kw > 0)) return 0;
  const slabs = [...rule.slabs].sort((a, b) => a.uptoKw - b.uptoKw);
  let total = 0;
  let prevUpto = 0;
  for (const slab of slabs) {
    if (kw <= prevUpto) break;
    const kwInSlab = Math.min(kw, slab.uptoKw) - prevUpto;
    total += kwInSlab * slab.perKw;
    prevUpto = slab.uptoKw;
  }
  return Math.round(Math.min(total, rule.capAmount));
}

export function findPriceBand(kw: number, bands: PriceBand[]): PriceBand | null {
  return bands.find((b) => kw >= b.minKw && kw <= b.maxKw) ?? null;
}

export interface QuoteInput {
  systemKw: number;
  monthlyUnits: number;
  bands: PriceBand[];
  subsidy: SubsidyRuleInput;
  setting: CalcSettingInput;
}

export interface QuoteResult {
  systemKw: number;
  pricePerKw: number;
  grossCost: number;
  subsidy: number;
  netCost: number;
  annualGeneration: number;
  annualConsumption: number;
  selfUsedUnits: number;
  exportedUnits: number;
  annualSavings: number;
  paybackYears: number | null;
}

export class QuoteError extends Error {
  code?: "NO_PRICE_FOR_SIZE";
}

export function computeQuote(input: QuoteInput): QuoteResult {
  const { systemKw, monthlyUnits, bands, subsidy, setting } = input;
  if (!(systemKw > 0)) throw new QuoteError("System size must be greater than 0 kW.");
  if (monthlyUnits < 0) throw new QuoteError("Monthly units cannot be negative.");

  const band = findPriceBand(systemKw, bands);
  if (!band) {
    const e = new QuoteError(`No price is set for a ${systemKw} kW system.`);
    e.code = "NO_PRICE_FOR_SIZE";
    throw e;
  }

  const grossCost = Math.round(systemKw * band.pricePerKw);
  const subsidyAmount = Math.min(computeSubsidy(systemKw, subsidy), grossCost);
  const netCost = grossCost - subsidyAmount;

  const annualGeneration = Math.round(systemKw * setting.generationPerKwYear);
  const annualConsumption = monthlyUnits * 12;
  const selfUsedUnits = Math.min(annualGeneration, annualConsumption);
  const exportedUnits = annualGeneration - selfUsedUnits;
  const annualSavings = Math.round(
    selfUsedUnits * setting.tariffPerUnit + exportedUnits * setting.exportRatePerUnit,
  );

  const paybackYears =
    annualSavings > 0 ? Math.round((netCost / annualSavings) * 10) / 10 : null;

  return {
    systemKw,
    pricePerKw: band.pricePerKw,
    grossCost,
    subsidy: subsidyAmount,
    netCost,
    annualGeneration,
    annualConsumption,
    selfUsedUnits,
    exportedUnits,
    annualSavings,
    paybackYears,
  };
}
