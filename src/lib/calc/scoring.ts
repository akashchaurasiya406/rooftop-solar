import type { Reason } from "./reasons";

export type Score = "HIGH" | "MEDIUM" | "LOW";
export type NextAction = "SURVEY" | "CALL";

export interface ScoreInput {
  ownership: "OWNER" | "TENANT";
  roofType: "RCC" | "METAL_SHEET" | "ASBESTOS" | "OTHER";
  roofAreaSqft: number;
  monthlyBill: number;
  monthlyUnits?: number | null;
  sanctionedLoadKw?: number | null;
  inServiceArea?: boolean;
}

export interface ScoreSettings {
  generationPerKwYear: number;
  sqftPerKw: number;
}

export interface ScoreResult {
  score: Score;
  reasons: Reason[];
  recommendedKw: number | null;
  nextAction: NextAction;
}

export const THRESHOLDS = {
  smallBill: 1000,
  goodBill: 2500,
  smallUnits: 120,
  minKw: 1,
  maxResidentialKw: 10,
} as const;

export function recommendSize(
  monthlyUnits: number,
  settings: ScoreSettings,
  limits: { roofAreaSqft?: number; sanctionedLoadKw?: number | null } = {},
): { kw: number; limitedBy: "roof" | "load" | null } {
  const ideal = (monthlyUnits * 12) / settings.generationPerKwYear;
  let kw = Math.max(THRESHOLDS.minKw, Math.round(ideal));
  kw = Math.min(kw, THRESHOLDS.maxResidentialKw);
  let limitedBy: "roof" | "load" | null = null;

  if (limits.roofAreaSqft && limits.roofAreaSqft > 0) {
    const roofMax = Math.floor(limits.roofAreaSqft / settings.sqftPerKw);
    if (roofMax < kw) {
      kw = roofMax;
      limitedBy = "roof";
    }
  }
  if (limits.sanctionedLoadKw && limits.sanctionedLoadKw > 0 && limits.sanctionedLoadKw < kw) {
    kw = Math.floor(limits.sanctionedLoadKw);
    limitedBy = "load";
  }
  return { kw: Math.max(kw, 0), limitedBy };
}


export function scoreLead(input: ScoreInput, settings: ScoreSettings): ScoreResult {
  const negatives: Reason[] = [];
  const positives: Reason[] = [];

  const units = input.monthlyUnits ?? Math.round(input.monthlyBill / 9.4);

  if (input.ownership === "TENANT") {
    negatives.push({ code: "TENANT" });
  }

  if (input.monthlyBill < THRESHOLDS.smallBill || units < THRESHOLDS.smallUnits) {
    negatives.push({ code: "SMALL_BILL", p: { bill: input.monthlyBill } });
  } else if (input.monthlyBill >= THRESHOLDS.goodBill) {
    positives.push({ code: "HIGH_BILL", p: { bill: input.monthlyBill, units } });
  } else {
    positives.push({ code: "MODERATE_BILL", p: { bill: input.monthlyBill } });
  }

  const size = recommendSize(units, settings, {
    roofAreaSqft: input.roofAreaSqft,
    sanctionedLoadKw: input.sanctionedLoadKw,
  });

  if (size.kw < THRESHOLDS.minKw) {
    negatives.push({ code: "ROOF_TOO_SMALL", p: { area: input.roofAreaSqft } });
  } else if (size.limitedBy === "roof") {
    negatives.push({ code: "ROOF_LIMIT", p: { kw: size.kw } });
  } else if (size.limitedBy === "load") {
    negatives.push({ code: "LOAD_LIMIT", p: { kw: size.kw } });
  } else {
    positives.push({ code: "ROOF_FITS", p: { kw: size.kw } });
  }

  if (input.inServiceArea === false) {
    negatives.unshift({ code: "OUTSIDE_AREA" });
  }

  if (input.roofType === "ASBESTOS") {
    negatives.push({ code: "ASBESTOS" });
  } else if (input.roofType === "RCC") {
    positives.push({ code: "CONCRETE" });
  }

  if (input.ownership === "OWNER") positives.push({ code: "OWNER" });

  const hardStop =
    input.ownership === "TENANT" ||
    input.inServiceArea === false ||
    input.monthlyBill < THRESHOLDS.smallBill ||
    units < THRESHOLDS.smallUnits ||
    size.kw < THRESHOLDS.minKw;

  let score: Score;
  if (hardStop) score = "LOW";
  else if (negatives.length === 0 && input.monthlyBill >= THRESHOLDS.goodBill) score = "HIGH";
  else score = "MEDIUM";

  const nextAction: NextAction = score === "LOW" ? "CALL" : "SURVEY";

  const recommendedKw = input.ownership === "TENANT" || size.kw < 1 ? null : size.kw;

  const ordered = score === "HIGH" ? positives : [...negatives, ...positives];
  return { score, reasons: ordered.slice(0, 3), recommendedKw, nextAction };
}
