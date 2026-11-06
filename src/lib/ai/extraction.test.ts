import { describe, expect, it } from "vitest";
import { assessExtraction, maskConsumerNumber, type BillExtraction } from "./extraction";

const f = <T>(value: T | null, confidence = 0.97) => ({ value, confidence });

const good = (over: Partial<BillExtraction> = {}): BillExtraction => ({
  isElectricityBill: true,
  readable: true,
  qualityIssue: null,
  consumerNumber: f("410019283746"),
  tariffCategory: f("LT-I(B) Residential"),
  sanctionedLoadKw: f(3),
  monthlyUnits: f(340),
  billAmount: f(3200),
  billingMonth: f("OCT-2026"),
  ...over,
});

describe("assessExtraction — accept", () => {
  it("accepts a clean, confident reading with nothing to check", () => {
    const a = assessExtraction(good(), 3200);
    expect(a.decision).toBe("ACCEPT");
    expect(a.needsCheck).toEqual([]);
    expect(a.values).toEqual({
      consumerNumber: "410019283746",
      tariffCategory: "LT-I(B) Residential",
      sanctionedLoadKw: 3,
      monthlyUnits: 340,
      billAmount: 3200,
    });
  });

  it("rounds units and amount, and strips spaces from the consumer number", () => {
    const a = assessExtraction(good({ monthlyUnits: f(339.6), billAmount: f(3199.5), consumerNumber: f(" 4100 1928-3746 ") }), 3200);
    expect(a.values.monthlyUnits).toBe(340);
    expect(a.values.billAmount).toBe(3200);
    expect(a.values.consumerNumber).toBe("410019283746");
  });
});

describe("assessExtraction — ask for a new photo", () => {
  it("rejects documents that are not electricity bills", () => {
    const a = assessExtraction(good({ isElectricityBill: false }), 3200);
    expect(a.decision).toBe("REUPLOAD");
    expect(a.reuploadReason).toMatch(/doesn't look like an electricity bill/);
  });

  it("rejects unreadable photos and passes on the model's reason", () => {
    const a = assessExtraction(good({ readable: false, qualityIssue: "Image is too dark." }), 3200);
    expect(a.decision).toBe("REUPLOAD");
    expect(a.reuploadReason).toContain("(image is too dark)");
  });

  it("rejects when units are missing", () => {
    expect(assessExtraction(good({ monthlyUnits: f(null, 0) }), 3200).decision).toBe("REUPLOAD");
  });

  it("rejects when units confidence is below 50%", () => {
    expect(assessExtraction(good({ monthlyUnits: f(340, 0.4) }), 3200).decision).toBe("REUPLOAD");
  });

  it("never returns values when rejecting", () => {
    const a = assessExtraction(good({ readable: false }), 3200);
    expect(Object.values(a.values).every((v) => v === null)).toBe(true);
  });
});

describe("assessExtraction — accept but flag for staff", () => {
  it("flags fields read with confidence under 80%", () => {
    const a = assessExtraction(good({ sanctionedLoadKw: f(3, 0.6) }), 3200);
    expect(a.decision).toBe("ACCEPT");
    expect(a.needsCheck).toEqual(["sanctionedLoadKw"]);
    expect(a.issues[0]).toMatch(/60%/);
  });

  it("flags missing optional fields", () => {
    const a = assessExtraction(good({ tariffCategory: f(null, 0) }), 3200);
    expect(a.needsCheck).toContain("tariffCategory");
  });

  it("flags implausible units and load", () => {
    const a = assessExtraction(good({ monthlyUnits: f(9000), sanctionedLoadKw: f(120) }), 3200);
    expect(a.needsCheck).toEqual(expect.arrayContaining(["monthlyUnits", "sanctionedLoadKw"]));
  });

  it("flags a malformed consumer number", () => {
    expect(assessExtraction(good({ consumerNumber: f("41A9") }), 3200).needsCheck).toContain("consumerNumber");
  });

  it("flags a bill amount far from what the homeowner declared", () => {
    const a = assessExtraction(good({ billAmount: f(1200) }), 3200);
    expect(a.needsCheck).toContain("billAmount");
    expect(a.issues.join(" ")).toMatch(/homeowner said ₹3,200/);
  });

  it("does not flag small differences from the declared bill", () => {
    expect(assessExtraction(good({ billAmount: f(2900) }), 3200).needsCheck).toEqual([]);
  });

  it("lists flagged fields in a stable order", () => {
    const a = assessExtraction(good({ billAmount: f(3200, 0.5), consumerNumber: f("1", 0.5) }), 3200);
    expect(a.needsCheck).toEqual(["consumerNumber", "billAmount"]);
  });
});

describe("maskConsumerNumber", () => {
  it("shows only the last four digits", () => {
    expect(maskConsumerNumber("410019283746")).toBe("••••••••3746");
  });
  it("handles empty and short values", () => {
    expect(maskConsumerNumber(null)).toBe("—");
    expect(maskConsumerNumber("123")).toBe("123");
  });
});
