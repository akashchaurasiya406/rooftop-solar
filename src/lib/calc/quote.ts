// Quote maths: price, subsidy, generation, savings and payback.
// Deliberately NOT AI — money must be exact, explainable and testable.

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

/**
 * Subsidy for a system of `kw`, paid slab by slab, then capped.
 * Brief: ₹30,000/kW up to 2 kW + ₹18,000 for the 3rd kW, capped at ₹78,000.
 * ASSUMPTION A-03: fractional kW is paid pro-rata (2.5 kW → 2×30k + 0.5×18k).
 */
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

/** Price per kW from the band containing `kw` (inclusive on both ends). */
export function findPriceBand(kw: number, bands: PriceBand[]): PriceBand | null {
  return bands.find((b) => kw >= b.minKw && kw <= b.maxKw) ?? null;
}

export interface QuoteInput {
  systemKw: number;
  monthlyUnits: number; // household consumption from the bill
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
  paybackYears: number | null; // null = never pays back (no savings)
}

export class QuoteError extends Error {}

export function computeQuote(input: QuoteInput): QuoteResult {
  const { systemKw, monthlyUnits, bands, subsidy, setting } = input;
  if (!(systemKw > 0)) throw new QuoteError("System size must be greater than 0 kW.");
  if (monthlyUnits < 0) throw new QuoteError("Monthly units cannot be negative.");

  const band = findPriceBand(systemKw, bands);
  if (!band) throw new QuoteError(`No price is set for a ${systemKw} kW system.`);

  const grossCost = Math.round(systemKw * band.pricePerKw);
  // Subsidy can never exceed the cost of the system.
  const subsidyAmount = Math.min(computeSubsidy(systemKw, subsidy), grossCost);
  const netCost = grossCost - subsidyAmount;

  // Brief: generation = fixed formula, 1,400 units per kW per year (editable).
  const annualGeneration = Math.round(systemKw * setting.generationPerKwYear);
  const annualConsumption = monthlyUnits * 12;
  // ASSUMPTION A-04: units used at home save the full tariff; surplus is
  // exported under net metering at a lower export rate.
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
