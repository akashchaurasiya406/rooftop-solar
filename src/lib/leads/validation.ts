import { z } from "zod";
import { LIMITS } from "@/lib/ai/extraction";

const int = (label: string, min: number, max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" ? (v.trim() === "" ? undefined : v.replace(/[,\s₹]/g, "")) : v),
    z.coerce
      .number({ error: `Enter ${label}.` })
      .int(`Enter ${label} as a whole number.`)
      .min(min, `${label[0].toUpperCase()}${label.slice(1)} looks too small.`)
      .max(max, `${label[0].toUpperCase()}${label.slice(1)} looks too large.`),
  );

export const leadFormSchema = z.object({
  ownership: z.enum(["OWNER", "TENANT"], { error: "Tell us if you own or rent the house." }),
  roofType: z.enum(["RCC", "METAL_SHEET", "ASBESTOS", "OTHER"], { error: "Choose your roof type." }),
  roofAreaSqft: int("your roof area", 50, 20000),
  monthlyBill: int("your monthly bill", 100, 100000),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a 6-digit pincode."),
});

export type LeadForm = z.infer<typeof leadFormSchema>;

const optionalNumber = (min: number, max: number, msg: string) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.coerce.number().min(min, msg).max(max, msg).nullable(),
  );

export const confirmBillSchema = z.object({
  consumerNumber: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(LIMITS.consumerNumber, "Consumer number should be 9–15 digits.")),
  tariffCategory: z.string().trim().min(2, "Enter the tariff.").max(60),
  sanctionedLoadKw: optionalNumber(LIMITS.loadKw.min, LIMITS.loadKw.max, `Load should be ${LIMITS.loadKw.min}–${LIMITS.loadKw.max} kW.`),
  monthlyUnits: z.coerce
    .number({ error: "Enter the units." })
    .int("Units should be a whole number.")
    .min(LIMITS.units.min, `Units should be ${LIMITS.units.min}–${LIMITS.units.max}.`)
    .max(LIMITS.units.max, `Units should be ${LIMITS.units.min}–${LIMITS.units.max}.`),
  billAmount: optionalNumber(LIMITS.amount.min, LIMITS.amount.max, "Amount looks wrong."),
});

export type ConfirmBill = z.infer<typeof confirmBillSchema>;

export const reuploadRequestSchema = z.object({
  reason: z.string().trim().min(5, "Tell the homeowner what to fix.").max(200),
});
