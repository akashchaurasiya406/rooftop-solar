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
  reasons: string[];
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

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function scoreLead(input: ScoreInput, settings: ScoreSettings): ScoreResult {
  const negatives: string[] = [];
  const positives: string[] = [];

  const units = input.monthlyUnits ?? Math.round(input.monthlyBill / 9.4);

  if (input.ownership === "TENANT") {
    negatives.push("Tenant — the owner must agree before installation");
  } else {
    positives.push("Owns the house");
  }

  if (input.monthlyBill < THRESHOLDS.smallBill || units < THRESHOLDS.smallUnits) {
    negatives.push(`Small bill (${inr(input.monthlyBill)}/month) — savings would be low`);
  } else if (input.monthlyBill >= THRESHOLDS.goodBill) {
    positives.push(`High bill (${inr(input.monthlyBill)}/month, ~${units} units)`);
  } else {
    positives.push(`Moderate bill (${inr(input.monthlyBill)}/month)`);
  }

  const size = recommendSize(units, settings, {
    roofAreaSqft: input.roofAreaSqft,
    sanctionedLoadKw: input.sanctionedLoadKw,
  });

  if (size.kw < THRESHOLDS.minKw) {
    negatives.push(`Roof too small (${input.roofAreaSqft} sq ft) for even 1 kW`);
  } else if (size.limitedBy === "roof") {
    negatives.push(`Roof area limits the system to ${size.kw} kW`);
  } else if (size.limitedBy === "load") {
    negatives.push(`Sanctioned load limits the system to ${size.kw} kW`);
  } else {
    positives.push(`Roof fits the recommended ${size.kw} kW`);
  }

  if (input.inServiceArea === false) {
    negatives.unshift("Outside our Vidarbha service area");
  }

  if (input.roofType === "ASBESTOS") {
    negatives.push("Asbestos roof — needs a structural check");
  } else if (input.roofType === "RCC") {
    positives.push("Concrete roof — standard mounting");
  }

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
