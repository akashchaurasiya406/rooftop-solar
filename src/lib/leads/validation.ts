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

type StaffValidation = typeof en.staff.validation;

export const makeConfirmBillSchema = (m: StaffValidation = en.staff.validation) =>
  z.object({
    consumerNumber: z
      .string()
      .trim()
      .transform((v) => v.replace(/[\s-]/g, ""))
      .pipe(z.string().regex(LIMITS.consumerNumber, m.consumerNumber)),
    tariffCategory: z.string().trim().min(2, m.tariff).max(60),
    sanctionedLoadKw: optionalNumber(LIMITS.loadKw.min, LIMITS.loadKw.max, m.load),
    monthlyUnits: z.coerce.number({ error: m.units }).int(m.units).min(LIMITS.units.min, m.units).max(LIMITS.units.max, m.units),
    billAmount: optionalNumber(LIMITS.amount.min, LIMITS.amount.max, m.amount),
  });

export const confirmBillSchema = makeConfirmBillSchema();

export type ConfirmBill = z.infer<typeof confirmBillSchema>;

export const makeReuploadRequestSchema = (m: StaffValidation = en.staff.validation) =>
  z.object({ reason: z.string().trim().min(5, m.reason).max(200) });

export const reuploadRequestSchema = makeReuploadRequestSchema();
