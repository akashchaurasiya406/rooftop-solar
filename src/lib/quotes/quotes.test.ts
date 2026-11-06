import { describe, expect, it } from "vitest";
import { canMoveTo, daysInStage, isStuck, nextStage, stageMessage, STAGES } from "@/lib/projects/stages";
import { advanceFor, bestValue, buildOptions, optionSizes, snapKw, validUntil } from "./options";

const RULES = {
  bands: [
    { minKw: 1, maxKw: 2.99, pricePerKw: 65000 },
    { minKw: 3, maxKw: 5.99, pricePerKw: 58000 },
    { minKw: 6, maxKw: 10, pricePerKw: 54000 },
  ],
  subsidy: { slabs: [{ uptoKw: 2, perKw: 30000 }, { uptoKw: 3, perKw: 18000 }], capAmount: 78000 },
  setting: { generationPerKwYear: 1400, tariffPerUnit: 9.4, exportRatePerUnit: 3.5 },
};

describe("snapKw", () => {
  it("rounds to half a kW and stays within 1–10 kW", () => {
    expect(snapKw(2.74)).toBe(2.5);
    expect(snapKw(2.76)).toBe(3);
    expect(snapKw(0.2)).toBe(1);
    expect(snapKw(42)).toBe(10);
    expect(snapKw(Number.NaN)).toBe(1);
  });
});

describe("optionSizes", () => {
  it("offers one size below and one above", () => {
    expect(optionSizes(3, RULES.bands)).toEqual([2, 3, 4]);
  });
  it("drops sizes outside 1–10 kW", () => {
    expect(optionSizes(1, RULES.bands)).toEqual([1, 2]);
    expect(optionSizes(10, RULES.bands)).toEqual([9, 10]);
  });
  it("drops sizes without a price", () => {
    expect(optionSizes(3, [{ minKw: 3, maxKw: 3, pricePerKw: 58000 }])).toEqual([3]);
  });
});

describe("buildOptions", () => {
  it("computes the chosen size and the alternatives with the same rules", () => {
    const { chosen, options } = buildOptions(3, 340, RULES);
    expect(chosen.systemKw).toBe(3);
    expect(chosen.netCost).toBe(96000);
    expect(options.map((o) => o.systemKw)).toEqual([2, 3, 4]);
    expect(options[0].subsidy).toBe(60000);
    expect(options[2].subsidy).toBe(78000);
  });

  it("snaps an odd size before computing", () => {
    expect(buildOptions(3.2, 340, RULES).chosen.systemKw).toBe(3);
  });
});

describe("bestValue", () => {
  it("picks the size with the fastest payback", () => {
    const { options } = buildOptions(3, 340, RULES);
    expect(bestValue(options)).toBe(3);
  });
  it("returns null when nothing pays back", () => {
    expect(bestValue([{ ...buildOptions(3, 340, RULES).chosen, paybackYears: null }])).toBeNull();
  });
});

describe("quote terms", () => {
  it("is valid for 15 days", () => {
    expect(validUntil(new Date("2026-11-07T00:00:00Z")).toISOString()).toBe("2026-11-22T00:00:00.000Z");
  });
  it("takes a 20% advance rounded to ₹100", () => {
    expect(advanceFor(96000)).toBe(19200);
    expect(advanceFor(96049)).toBe(19200);
  });
});

describe("project stages", () => {
  it("only moves one stage forward", () => {
    expect(nextStage("ADVANCE_PAID")).toBe("MATERIALS_DISPATCHED");
    expect(nextStage("SUBSIDY_CREDITED")).toBeNull();
    expect(canMoveTo("ADVANCE_PAID", "MATERIALS_DISPATCHED")).toBe(true);
    expect(canMoveTo("ADVANCE_PAID", "INSTALLED")).toBe(false);
    expect(canMoveTo("INSTALLED", "ADVANCE_PAID")).toBe(false);
  });

  it("covers the brief's journey from advance to subsidy credited", () => {
    expect(STAGES[0]).toBe("ADVANCE_PAID");
    expect(STAGES.at(-1)).toBe("SUBSIDY_CREDITED");
  });

  it("flags a stage as stuck only after its limit", () => {
    const now = new Date("2026-11-30T00:00:00Z");
    expect(daysInStage(new Date("2026-11-20T00:00:00Z"), now)).toBe(10);
    expect(isStuck("NET_METER_APPLIED", new Date("2026-11-20T00:00:00Z"), now)).toBe(false);
    expect(isStuck("ADVANCE_PAID", new Date("2026-11-20T00:00:00Z"), now)).toBe(true);
    expect(isStuck("SUBSIDY_CREDITED", new Date("2020-01-01T00:00:00Z"), now)).toBe(false);
  });

  it("writes a short customer message with the status link", () => {
    const m = stageMessage("Prashant", "INSTALLED", "https://example.com/status/abc");
    expect(m).toMatch(/^Namaste Prashant/);
    expect(m).toContain("https://example.com/status/abc");
  });
});
