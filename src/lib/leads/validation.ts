import { z } from "zod";
import { LIMITS } from "@/lib/ai/extraction";
import { en } from "@/lib/i18n/en";

type FormErrors = typeof en.form.errors;

const int = (required: string, range: string, min: number, max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" ? (v.trim() === "" ? undefined : v.replace(/[,\s₹]/g, "")) : v),
    z.coerce.number({ error: required }).int(range).min(min, range).max(max, range),
  );

export const makeLeadFormSchema = (m: FormErrors = en.form.errors) =>
  z.object({
    ownership: z.enum(["OWNER", "TENANT"], { error: m.ownership }),
    roofType: z.enum(["RCC", "METAL_SHEET", "ASBESTOS", "OTHER"], { error: m.roofType }),
    roofAreaSqft: int(m.roofArea, m.roofAreaRange, 50, 20000),
    monthlyBill: int(m.monthlyBill, m.monthlyBillRange, 100, 100000),
    pincode: z.string().trim().regex(/^[1-9]\d{5}$/, m.pincode),
  });

export const leadFormSchema = makeLeadFormSchema();

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
