import { describe, expect, it } from "vitest";
import { computeQuote, computeSubsidy, findPriceBand, QuoteError } from "./quote";
import { findOverlaps, isEffectiveOn, pickEffective } from "./rules";
import { recommendSize, scoreLead } from "./scoring";

const SCHEME = {
  slabs: [
    { uptoKw: 2, perKw: 30000 },
    { uptoKw: 3, perKw: 18000 },
  ],
  capAmount: 78000,
};
const BANDS = [
  { minKw: 1, maxKw: 2.99, pricePerKw: 65000 },
  { minKw: 3, maxKw: 5.99, pricePerKw: 58000 },
  { minKw: 6, maxKw: 10, pricePerKw: 54000 },
];
const SETTING = { generationPerKwYear: 1400, tariffPerUnit: 9.4, exportRatePerUnit: 3.5 };
const SCORE_SETTINGS = { generationPerKwYear: 1400, sqftPerKw: 100 };

const d = (s: string) => new Date(`${s}T00:00:00+05:30`);

describe("computeSubsidy", () => {
  it.each([
    [1, 30000],
    [2, 60000],
    [3, 78000],
    [5, 78000],
    [10, 78000],
    [2.5, 69000],
    [0.5, 15000],
  ])("%s kW → ₹%s", (kw, expected) => {
    expect(computeSubsidy(kw, SCHEME)).toBe(expected);
  });

  it("returns 0 for zero, negative or NaN size", () => {
    expect(computeSubsidy(0, SCHEME)).toBe(0);
    expect(computeSubsidy(-2, SCHEME)).toBe(0);
    expect(computeSubsidy(Number.NaN, SCHEME)).toBe(0);
  });

  it("applies the cap when slabs alone would exceed it", () => {
    expect(computeSubsidy(3, { ...SCHEME, capAmount: 70000 })).toBe(70000);
  });

  it("handles slabs given out of order", () => {
    const reversed = { ...SCHEME, slabs: [...SCHEME.slabs].reverse() };
    expect(computeSubsidy(3, reversed)).toBe(78000);
  });
});

describe("pickEffective (dated rules)", () => {
  const old = { id: "old", effectiveFrom: d("2024-02-01"), effectiveTo: d("2026-04-01") };
  const cur = { id: "cur", effectiveFrom: d("2026-04-01"), effectiveTo: null };

  it("picks the rule valid on the date", () => {
    expect(pickEffective([old, cur], d("2025-06-15"))?.id).toBe("old");
    expect(pickEffective([old, cur], d("2026-11-04"))?.id).toBe("cur");
  });

  it("treats effectiveFrom as inclusive and effectiveTo as exclusive", () => {
    expect(pickEffective([old, cur], d("2026-04-01"))?.id).toBe("cur");
    expect(isEffectiveOn(old, d("2026-04-01"))).toBe(false);
  });

  it("returns null before any rule starts", () => {
    expect(pickEffective([old, cur], d("2020-01-01"))).toBeNull();
  });

  it("prefers the most recently started rule when ranges overlap", () => {
    const open = { id: "open", effectiveFrom: d("2024-02-01"), effectiveTo: null };
    expect(pickEffective([open, cur], d("2026-11-04"))?.id).toBe("cur");
  });

  it("detects overlapping ranges", () => {
    const open = { id: "open", effectiveFrom: d("2024-02-01"), effectiveTo: null };
    expect(findOverlaps([old, cur])).toEqual([]);
    expect(findOverlaps([open, cur])).toEqual([["open", "cur"]]);
  });
});

describe("computeQuote", () => {
  it("builds the sample 3 kW quote", () => {
    const q = computeQuote({
      systemKw: 3,
      monthlyUnits: 340,
      bands: BANDS,
      subsidy: SCHEME,
      setting: SETTING,
    });
    expect(q.grossCost).toBe(174000);
    expect(q.subsidy).toBe(78000);
    expect(q.netCost).toBe(96000);
    expect(q.annualGeneration).toBe(4200);
    expect(q.annualConsumption).toBe(4080);
    expect(q.selfUsedUnits).toBe(4080);
    expect(q.exportedUnits).toBe(120);
    expect(q.annualSavings).toBe(Math.round(4080 * 9.4 + 120 * 3.5));
    expect(q.paybackYears).toBe(2.5);
  });

  it("values surplus units at the lower export rate", () => {
    const q = computeQuote({ systemKw: 2, monthlyUnits: 0, bands: BANDS, subsidy: SCHEME, setting: SETTING });
    expect(q.selfUsedUnits).toBe(0);
    expect(q.annualSavings).toBe(2800 * 3.5);
  });

  it("never gives a subsidy larger than the cost", () => {
    const cheap = [{ minKw: 1, maxKw: 10, pricePerKw: 10000 }];
    const q = computeQuote({ systemKw: 2, monthlyUnits: 200, bands: cheap, subsidy: SCHEME, setting: SETTING });
    expect(q.subsidy).toBe(20000);
    expect(q.netCost).toBe(0);
  });

  it("reports no payback when there are no savings", () => {
    const q = computeQuote({
      systemKw: 1,
      monthlyUnits: 0,
      bands: BANDS,
      subsidy: SCHEME,
      setting: { ...SETTING, exportRatePerUnit: 0 },
    });
    expect(q.paybackYears).toBeNull();
  });

  it("rejects bad inputs with a clear error", () => {
    const base = { monthlyUnits: 300, bands: BANDS, subsidy: SCHEME, setting: SETTING };
    expect(() => computeQuote({ ...base, systemKw: 0 })).toThrow(QuoteError);
    expect(() => computeQuote({ ...base, systemKw: 3, monthlyUnits: -1 })).toThrow(QuoteError);
    expect(() => computeQuote({ ...base, systemKw: 12 })).toThrow(/No price/);
  });

  it("finds price bands inclusively", () => {
    expect(findPriceBand(3, BANDS)?.pricePerKw).toBe(58000);
    expect(findPriceBand(2.99, BANDS)?.pricePerKw).toBe(65000);
    expect(findPriceBand(0.5, BANDS)).toBeNull();
  });
});

describe("recommendSize", () => {
  it("matches the sample data", () => {
    expect(recommendSize(340, SCORE_SETTINGS).kw).toBe(3);
    expect(recommendSize(85, SCORE_SETTINGS).kw).toBe(1);
  });

  it("is limited by roof area", () => {
    expect(recommendSize(600, SCORE_SETTINGS, { roofAreaSqft: 300 })).toEqual({ kw: 3, limitedBy: "roof" });
  });

  it("is limited by sanctioned load", () => {
    expect(recommendSize(600, SCORE_SETTINGS, { roofAreaSqft: 1000, sanctionedLoadKw: 4 })).toEqual({
      kw: 4,
      limitedBy: "load",
    });
  });

  it("caps residential systems at 10 kW", () => {
    expect(recommendSize(5000, SCORE_SETTINGS).kw).toBe(10);
  });
});

describe("scoreLead — sample leads from the brief", () => {
  it("LD-30881 Prashant: owner, ₹3,200 bill → HIGH, 3 kW, survey", () => {
    const r = scoreLead(
      { ownership: "OWNER", roofType: "RCC", roofAreaSqft: 450, monthlyBill: 3200, monthlyUnits: 340 },
      SCORE_SETTINGS,
    );
    expect(r.score).toBe("HIGH");
    expect(r.recommendedKw).toBe(3);
    expect(r.nextAction).toBe("SURVEY");
    expect(r.reasons.length).toBeLessThanOrEqual(3);
  });

  it("LD-30902 Rohit: tenant → LOW (tenant), no size, call instead of visit", () => {
    const r = scoreLead(
      { ownership: "TENANT", roofType: "RCC", roofAreaSqft: 400, monthlyBill: 1900, monthlyUnits: 210 },
      SCORE_SETTINGS,
    );
    expect(r.score).toBe("LOW");
    expect(r.recommendedKw).toBeNull();
    expect(r.nextAction).toBe("CALL");
    expect(r.reasons[0]).toMatch(/Tenant/);
  });

  it("LD-30915 Ayesha: owner, ₹650 bill → LOW (small bill), 1 kW", () => {
    const r = scoreLead(
      { ownership: "OWNER", roofType: "RCC", roofAreaSqft: 300, monthlyBill: 650, monthlyUnits: 85 },
      SCORE_SETTINGS,
    );
    expect(r.score).toBe("LOW");
    expect(r.recommendedKw).toBe(1);
    expect(r.reasons[0]).toMatch(/Small bill/);
  });
});

describe("scoreLead — edge cases", () => {
  it("MEDIUM when a good lead has one concern (asbestos roof)", () => {
    const r = scoreLead(
      { ownership: "OWNER", roofType: "ASBESTOS", roofAreaSqft: 500, monthlyBill: 3000, monthlyUnits: 320 },
      SCORE_SETTINGS,
    );
    expect(r.score).toBe("MEDIUM");
    expect(r.reasons[0]).toMatch(/Asbestos/);
  });

  it("MEDIUM for a moderate bill", () => {
    const r = scoreLead(
      { ownership: "OWNER", roofType: "RCC", roofAreaSqft: 400, monthlyBill: 1800, monthlyUnits: 190 },
      SCORE_SETTINGS,
    );
    expect(r.score).toBe("MEDIUM");
  });

  it("LOW when the roof cannot fit even 1 kW", () => {
    const r = scoreLead(
      { ownership: "OWNER", roofType: "RCC", roofAreaSqft: 60, monthlyBill: 4000, monthlyUnits: 420 },
      SCORE_SETTINGS,
    );
    expect(r.score).toBe("LOW");
    expect(r.recommendedKw).toBeNull();
  });

  it("LOW with a clear reason when outside the service area, but still a call (never rejected)", () => {
    const r = scoreLead(
      { ownership: "OWNER", roofType: "RCC", roofAreaSqft: 500, monthlyBill: 4000, monthlyUnits: 420, inServiceArea: false },
      SCORE_SETTINGS,
    );
    expect(r.score).toBe("LOW");
    expect(r.nextAction).toBe("CALL");
    expect(r.reasons[0]).toMatch(/service area/);
  });

  it("estimates units from the bill when no bill has been read yet", () => {
    const r = scoreLead(
      { ownership: "OWNER", roofType: "RCC", roofAreaSqft: 500, monthlyBill: 3200 },
      SCORE_SETTINGS,
    );
    expect(r.score).toBe("HIGH");
    expect(r.recommendedKw).toBe(3);
  });
});
