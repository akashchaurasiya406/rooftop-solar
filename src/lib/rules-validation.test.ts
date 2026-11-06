import { describe, expect, it } from "vitest";
import { priceRuleSchema, subsidyRuleSchema } from "./rules-validation";

const base = { name: "Scheme 2027", slab1Upto: "2", slab1PerKw: "30000", slab2Upto: "3", slab2PerKw: "18000", capAmount: "78,000", effectiveFrom: "2027-04-01" };
const fieldErrors = (r: { success: boolean; error?: { flatten: () => { fieldErrors: Record<string, string[]> } } }) =>
  r.success ? {} : r.error!.flatten().fieldErrors;

describe("subsidyRuleSchema", () => {
  it("builds ordered slabs and a start date in Indian time", () => {
    const r = subsidyRuleSchema.parse(base);
    expect(r.slabs).toEqual([
      { uptoKw: 2, perKw: 30000 },
      { uptoKw: 3, perKw: 18000 },
    ]);
    expect(r.capAmount).toBe(78000);
    expect(r.effectiveFrom.toISOString()).toBe("2027-03-31T18:30:00.000Z");
  });

  it("allows a single slab", () => {
    const { slab2Upto, slab2PerKw, ...one } = base;
    void slab2Upto;
    void slab2PerKw;
    expect(subsidyRuleSchema.parse(one).slabs).toHaveLength(1);
  });

  it("rejects a half-filled second slab", () => {
    const { slab2PerKw, ...half } = base;
    void slab2PerKw;
    expect(fieldErrors(subsidyRuleSchema.safeParse(half)).slab2Upto?.[0]).toMatch(/both parts/);
  });

  it("rejects slabs that don't increase", () => {
    expect(fieldErrors(subsidyRuleSchema.safeParse({ ...base, slab2Upto: "2" })).slab2Upto?.[0]).toMatch(/above the first/);
  });

  it("requires a date and a name", () => {
    const e = fieldErrors(subsidyRuleSchema.safeParse({ ...base, name: "", effectiveFrom: "" }));
    expect(Object.keys(e).sort()).toEqual(["effectiveFrom", "name"]);
  });
});

describe("priceRuleSchema", () => {
  const p = { minKw: "3", maxKw: "5.99", pricePerKw: "58000", effectiveFrom: "2027-01-01" };

  it("accepts a valid band", () => {
    expect(priceRuleSchema.parse(p)).toMatchObject({ minKw: 3, maxKw: 5.99, pricePerKw: 58000 });
  });

  it("rejects an upside-down band and implausibly low prices", () => {
    expect(fieldErrors(priceRuleSchema.safeParse({ ...p, maxKw: "2" })).maxKw).toBeDefined();
    expect(fieldErrors(priceRuleSchema.safeParse({ ...p, pricePerKw: "500" })).pricePerKw).toBeDefined();
  });
});
