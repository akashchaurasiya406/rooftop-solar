import { computeQuote, findPriceBand, type CalcSettingInput, type PriceBand, type QuoteResult, type SubsidyRuleInput } from "@/lib/calc/quote";

export const KW_STEP = 0.5;
export const MIN_KW = 1;
export const MAX_KW = 10;
export const QUOTE_VALID_DAYS = 15;

export function snapKw(kw: number): number {
  if (!Number.isFinite(kw)) return MIN_KW;
  return Math.min(MAX_KW, Math.max(MIN_KW, Math.round(kw / KW_STEP) * KW_STEP));
}

export function optionSizes(chosenKw: number, bands: PriceBand[]): number[] {
  const kw = snapKw(chosenKw);
  return [kw - 1, kw, kw + 1].filter((k) => k >= MIN_KW && k <= MAX_KW && findPriceBand(k, bands) !== null);
}

export interface QuoteRules {
  bands: PriceBand[];
  subsidy: SubsidyRuleInput;
  setting: CalcSettingInput;
}

export function buildOptions(chosenKw: number, monthlyUnits: number, rules: QuoteRules): { chosen: QuoteResult; options: QuoteResult[] } {
  const kw = snapKw(chosenKw);
  const options = optionSizes(kw, rules.bands).map((k) => computeQuote({ systemKw: k, monthlyUnits, ...rules }));
  const chosen = options.find((o) => o.systemKw === kw) ?? computeQuote({ systemKw: kw, monthlyUnits, ...rules });
  return { chosen, options };
}

export function bestValue(options: QuoteResult[]): number | null {
  const withPayback = options.filter((o) => o.paybackYears !== null);
  if (withPayback.length === 0) return null;
  return withPayback.reduce((a, b) => (b.paybackYears! < a.paybackYears! ? b : a)).systemKw;
}

export function validUntil(from: Date): Date {
  return new Date(from.getTime() + QUOTE_VALID_DAYS * 86_400_000);
}

export const ADVANCE_PERCENT = 0.2;
export const advanceFor = (netCost: number) => Math.round((netCost * ADVANCE_PERCENT) / 100) * 100;
