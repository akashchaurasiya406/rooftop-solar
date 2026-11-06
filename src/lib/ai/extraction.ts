import { z } from "zod";

const field = <T extends z.ZodTypeAny>(value: T) =>
  z.object({ value: value.nullable(), confidence: z.number().min(0).max(1) });

export const billExtractionSchema = z.object({
  isElectricityBill: z.boolean(),
  readable: z.boolean(),
  qualityIssue: z.string().nullable().optional(),
  consumerNumber: field(z.string()),
  tariffCategory: field(z.string()),
  sanctionedLoadKw: field(z.number()),
  monthlyUnits: field(z.number()),
  billAmount: field(z.number()),
  billingMonth: field(z.string()),
});

export type BillExtraction = z.infer<typeof billExtractionSchema>;

export const EXTRACTED_FIELDS = ["consumerNumber", "tariffCategory", "sanctionedLoadKw", "monthlyUnits", "billAmount"] as const;
export type ExtractedField = (typeof EXTRACTED_FIELDS)[number];

export const FIELD_LABEL: Record<ExtractedField, string> = {
  consumerNumber: "Consumer number",
  tariffCategory: "Tariff",
  sanctionedLoadKw: "Sanctioned load",
  monthlyUnits: "Units this month",
  billAmount: "Bill amount",
};

export const CONFIDENCE = { reject: 0.5, review: 0.8 } as const;

export const LIMITS = {
  units: { min: 1, max: 5000 },
  loadKw: { min: 0.5, max: 50 },
  amount: { min: 50, max: 200000 },
  consumerNumber: /^\d{9,15}$/,
  amountMismatch: 0.4,
} as const;

export interface Assessment {
  decision: "ACCEPT" | "REUPLOAD";
  reuploadReason: string | null;
  needsCheck: ExtractedField[];
  issues: string[];
  values: {
    consumerNumber: string | null;
    tariffCategory: string | null;
    sanctionedLoadKw: number | null;
    monthlyUnits: number | null;
    billAmount: number | null;
  };
}

const clean = (s: string | null) => {
  const t = s?.trim();
  return t ? t : null;
};

export function assessExtraction(x: BillExtraction, declaredMonthlyBill: number): Assessment {
  const issues: string[] = [];
  const needsCheck = new Set<ExtractedField>();

  const reject = (reason: string): Assessment => ({
    decision: "REUPLOAD",
    reuploadReason: reason,
    needsCheck: [],
    issues: [reason],
    values: { consumerNumber: null, tariffCategory: null, sanctionedLoadKw: null, monthlyUnits: null, billAmount: null },
  });

  if (!x.isElectricityBill) return reject("This doesn't look like an electricity bill. Please upload a photo of your latest bill.");
  if (!x.readable) {
    return reject(
      x.qualityIssue
        ? `We couldn't read your bill clearly (${x.qualityIssue.toLowerCase().replace(/\.$/, "")}). Please take a clearer photo in good light.`
        : "We couldn't read your bill clearly. Please take a clearer photo in good light.",
    );
  }

  const units = x.monthlyUnits.value === null ? null : Math.round(x.monthlyUnits.value);
  if (units === null || x.monthlyUnits.confidence < CONFIDENCE.reject) {
    return reject("We couldn't read the units used on your bill. Please make sure the whole bill is in the photo and in focus.");
  }

  for (const f of EXTRACTED_FIELDS) {
    const c = x[f].confidence;
    if (x[f].value === null) {
      needsCheck.add(f);
      issues.push(`${FIELD_LABEL[f]} not found on the bill`);
    } else if (c < CONFIDENCE.review) {
      needsCheck.add(f);
      issues.push(`${FIELD_LABEL[f]} read with low confidence (${Math.round(c * 100)}%)`);
    }
  }

  if (units < LIMITS.units.min || units > LIMITS.units.max) {
    needsCheck.add("monthlyUnits");
    issues.push(`Units (${units}) look unusual for a home`);
  }

  const load = x.sanctionedLoadKw.value;
  if (load !== null && (load < LIMITS.loadKw.min || load > LIMITS.loadKw.max)) {
    needsCheck.add("sanctionedLoadKw");
    issues.push(`Sanctioned load (${load} kW) looks unusual for a home`);
  }

  const consumerNumber = clean(x.consumerNumber.value)?.replace(/[\s-]/g, "") ?? null;
  if (consumerNumber && !LIMITS.consumerNumber.test(consumerNumber)) {
    needsCheck.add("consumerNumber");
    issues.push("Consumer number should be 9–15 digits");
  }

  const amount = x.billAmount.value === null ? null : Math.round(x.billAmount.value);
  if (amount !== null && declaredMonthlyBill > 0) {
    const diff = Math.abs(amount - declaredMonthlyBill) / declaredMonthlyBill;
    if (diff > LIMITS.amountMismatch) {
      needsCheck.add("billAmount");
      issues.push(`Bill shows ₹${amount.toLocaleString("en-IN")} but the homeowner said ₹${declaredMonthlyBill.toLocaleString("en-IN")}`);
    }
  }

  return {
    decision: "ACCEPT",
    reuploadReason: null,
    needsCheck: EXTRACTED_FIELDS.filter((f) => needsCheck.has(f)),
    issues,
    values: {
      consumerNumber,
      tariffCategory: clean(x.tariffCategory.value),
      sanctionedLoadKw: load,
      monthlyUnits: units,
      billAmount: amount,
    },
  };
}

export function maskConsumerNumber(n: string | null): string {
  if (!n) return "—";
  return n.length <= 4 ? n : `${"•".repeat(Math.max(0, n.length - 4))}${n.slice(-4)}`;
}
