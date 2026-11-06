import { z } from "zod";

const money = (label: string, max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" ? (v.trim() === "" ? undefined : v.replace(/[,\s₹]/g, "")) : v),
    z.coerce.number({ error: `Enter ${label}.` }).int(`${label} must be whole rupees.`).min(0).max(max, `${label} looks too large.`),
  );

const kw = (label: string) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.coerce.number({ error: `Enter ${label}.` }).positive(`${label} must be above 0.`).max(100),
  );

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a start date.")
  .transform((s) => new Date(`${s}T00:00:00+05:30`));

export const subsidyRuleSchema = z
  .object({
    name: z.string().trim().min(3, "Give the rule a name.").max(80),
    slab1Upto: kw("the first slab size"),
    slab1PerKw: money("the first slab amount", 200000),
    slab2Upto: kw("the second slab size").optional(),
    slab2PerKw: money("the second slab amount", 200000).optional(),
    capAmount: money("the cap", 1000000),
    effectiveFrom: date,
  })
  .superRefine((v, ctx) => {
    const hasSecond = v.slab2Upto !== undefined || v.slab2PerKw !== undefined;
    if (hasSecond && (v.slab2Upto === undefined || v.slab2PerKw === undefined)) {
      ctx.addIssue({ code: "custom", path: ["slab2Upto"], message: "Fill in both parts of the second slab, or neither." });
    }
    if (v.slab2Upto !== undefined && v.slab2Upto <= v.slab1Upto) {
      ctx.addIssue({ code: "custom", path: ["slab2Upto"], message: "The second slab must end above the first." });
    }
  })
  .transform((v) => ({
    name: v.name,
    capAmount: v.capAmount,
    effectiveFrom: v.effectiveFrom,
    slabs: [
      { uptoKw: v.slab1Upto, perKw: v.slab1PerKw },
      ...(v.slab2Upto !== undefined && v.slab2PerKw !== undefined ? [{ uptoKw: v.slab2Upto, perKw: v.slab2PerKw }] : []),
    ],
  }));

export const priceRuleSchema = z
  .object({
    minKw: kw("the smallest size"),
    maxKw: kw("the largest size"),
    pricePerKw: money("the price per kW", 500000),
    effectiveFrom: date,
  })
  .refine((v) => v.maxKw >= v.minKw, { path: ["maxKw"], message: "Largest size must be at least the smallest." })
  .refine((v) => v.pricePerKw >= 10000, { path: ["pricePerKw"], message: "Price per kW looks too low." });

