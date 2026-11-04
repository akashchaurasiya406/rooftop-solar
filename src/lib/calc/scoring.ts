// Lead scoring and system sizing.
// The AI only READS the bill (Day 2). The score itself comes from these
// transparent rules, so staff can always see why a lead got its score.

export type Score = "HIGH" | "MEDIUM" | "LOW";
export type NextAction = "SURVEY" | "CALL";

export interface ScoreInput {
  ownership: "OWNER" | "TENANT";
  roofType: "RCC" | "METAL_SHEET" | "ASBESTOS" | "OTHER";
  roofAreaSqft: number;
  monthlyBill: number; // ₹
  monthlyUnits?: number | null; // from bill, if confirmed
  sanctionedLoadKw?: number | null;
}

export interface ScoreSettings {
  generationPerKwYear: number; // 1,400
  sqftPerKw: number; // shade-free roof area per kW
}

export interface ScoreResult {
  score: Score;
  reasons: string[]; // top three, most important first
  recommendedKw: number | null;
  nextAction: NextAction;
}

// ASSUMPTION A-05: thresholds below are our starting values for Vidarbha
// homes; they live in one place so the client can tune them after a pilot.
export const THRESHOLDS = {
  smallBill: 1000, // ₹/month — below this, solar savings are too small
  goodBill: 2500, // ₹/month — clearly worth a visit
  smallUnits: 120, // units/month
  minKw: 1,
  maxResidentialKw: 10,
} as const;

/**
 * Recommended size: enough to cover yearly consumption, rounded to the
 * nearest whole kW, at least 1 kW, then limited by roof area and sanctioned load.
 * Sample data: 340 units → 3 kW, 85 units → 1 kW.
 */
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
  // ASSUMPTION A-06: system size should not exceed sanctioned load without a
  // load-extension application, so we cap at it and flag it.
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

  // Units from the confirmed bill beat the homeowner's own estimate.
  // ASSUMPTION A-07: without a bill, estimate units as bill ÷ ₹9.4 per unit.
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

  if (input.roofType === "ASBESTOS") {
    negatives.push("Asbestos roof — needs a structural check");
  } else if (input.roofType === "RCC") {
    positives.push("Concrete roof — standard mounting");
  }

  // Score: tenant, small bill or no usable roof → LOW. Any other concern → MEDIUM.
  const hardStop =
    input.ownership === "TENANT" ||
    input.monthlyBill < THRESHOLDS.smallBill ||
    units < THRESHOLDS.smallUnits ||
    size.kw < THRESHOLDS.minKw;

  let score: Score;
  if (hardStop) score = "LOW";
  else if (negatives.length === 0 && input.monthlyBill >= THRESHOLDS.goodBill) score = "HIGH";
  else score = "MEDIUM";

  // A low score never rejects a lead: it swaps the survey visit for a call.
  const nextAction: NextAction = score === "LOW" ? "CALL" : "SURVEY";

  // Tenants can't install, so no size is recommended for them.
  const recommendedKw = input.ownership === "TENANT" || size.kw < 1 ? null : size.kw;

  // Concerns first for LOW/MEDIUM (that's what staff need to act on).
  const ordered = score === "HIGH" ? positives : [...negatives, ...positives];
  return { score, reasons: ordered.slice(0, 3), recommendedKw, nextAction };
}
