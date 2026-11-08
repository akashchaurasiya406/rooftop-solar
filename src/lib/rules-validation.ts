import { z } from "zod";
import { en } from "@/lib/i18n/en";
import { fill } from "@/lib/i18n/format";

type RuleText = typeof en.staff.rules.v;

const money = (m: RuleText, key: keyof RuleText["labels"], max: number) => {
  const label = m.labels[key];
  return z.preprocess(
    (v) => (typeof v === "string" ? (v.trim() === "" ? undefined : v.replace(/[,\s₹]/g, "")) : v),
    z.coerce
      .number({ error: fill(m.required, { label }) })
      .int(fill(m.whole, { label }))
      .min(0)
      .max(max, fill(m.tooLarge, { label })),
  );
};

const kw = (m: RuleText, key: keyof RuleText["labels"]) => {
  const label = m.labels[key];
  return z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.coerce
      .number({ error: fill(m.required, { label }) })
      .positive(fill(m.positive, { label }))
      .max(100),
  );
};

const date = (m: RuleText) =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, m.date)
    .transform((s) => new Date(`${s}T00:00:00+05:30`));

export const makeSubsidyRuleSchema = (m: RuleText = en.staff.rules.v) =>
  z
    .object({
      name: z.string().trim().min(3, m.name).max(80),
      slab1Upto: kw(m, "slab1Upto"),
      slab1PerKw: money(m, "slab1PerKw", 200000),
      slab2Upto: kw(m, "slab2Upto").optional(),
      slab2PerKw: money(m, "slab2PerKw", 200000).optional(),
      capAmount: money(m, "capAmount", 1000000),
      effectiveFrom: date(m),
    })
    .superRefine((v, ctx) => {
      const hasSecond = v.slab2Upto !== undefined || v.slab2PerKw !== undefined;
      if (hasSecond && (v.slab2Upto === undefined || v.slab2PerKw === undefined)) {
        ctx.addIssue({ code: "custom", path: ["slab2Upto"], message: m.slab2Both });
      }
      if (v.slab2Upto !== undefined && v.slab2Upto <= v.slab1Upto) {
        ctx.addIssue({ code: "custom", path: ["slab2Upto"], message: m.slab2Above });
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

export const makePriceRuleSchema = (m: RuleText = en.staff.rules.v) =>
  z
    .object({
      minKw: kw(m, "minKw"),
      maxKw: kw(m, "maxKw"),
      pricePerKw: money(m, "pricePerKw", 500000),
      effectiveFrom: date(m),
    })
    .refine((v) => v.maxKw >= v.minKw, { path: ["maxKw"], message: m.maxMin })
    .refine((v) => v.pricePerKw >= 10000, { path: ["pricePerKw"], message: m.lowPrice });

export const subsidyRuleSchema = makeSubsidyRuleSchema();
export const priceRuleSchema = makePriceRuleSchema();

const num = (m: RuleText, key: keyof RuleText["labels"], min: number, max: number, int = false) => {
  const label = m.labels[key];
  let n = z.coerce.number({ error: fill(m.required, { label }) }).min(min, fill(m.positive, { label })).max(max, fill(m.tooLarge, { label }));
  if (int) n = n.int(fill(m.required, { label }));
  return z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), n);
};

export const makeCalcSettingSchema = (m: RuleText = en.staff.rules.v) =>
  z.object({
    generationPerKwYear: num(m, "gen", 500, 2500, true),
    tariffPerUnit: num(m, "tariff", 1, 50),
    exportRatePerUnit: num(m, "exportRate", 0, 50),
    sqftPerKw: num(m, "sqft", 40, 300, true),
    effectiveFrom: date(m),
  });

export const calcSettingSchema = makeCalcSettingSchema();
