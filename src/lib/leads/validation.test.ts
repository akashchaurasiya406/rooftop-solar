import { describe, expect, it } from "vitest";
import { confirmBillSchema, leadFormSchema } from "./validation";

const ok = { ownership: "OWNER", roofType: "RCC", roofAreaSqft: "450", monthlyBill: "3200", pincode: "440022" };
const errorsOf = (r: { success: boolean; error?: { flatten: () => { fieldErrors: Record<string, string[]> } } }) =>
  r.success ? {} : r.error!.flatten().fieldErrors;

describe("leadFormSchema", () => {
  it("accepts a valid form and converts numbers", () => {
    expect(leadFormSchema.parse(ok)).toEqual({ ownership: "OWNER", roofType: "RCC", roofAreaSqft: 450, monthlyBill: 3200, pincode: "440022" });
  });

  it("accepts amounts typed with ₹, commas or spaces", () => {
    expect(leadFormSchema.parse({ ...ok, monthlyBill: "₹3,200" }).monthlyBill).toBe(3200);
    expect(leadFormSchema.parse({ ...ok, roofAreaSqft: " 1 200 " }).roofAreaSqft).toBe(1200);
  });

  it("asks for missing values instead of calling them too small", () => {
    const e = errorsOf(leadFormSchema.safeParse({ ...ok, roofAreaSqft: "", monthlyBill: "" }));
    expect(e.roofAreaSqft?.[0]).toBe("Enter your roof area.");
    expect(e.monthlyBill?.[0]).toBe("Enter your monthly bill.");
  });

  it("rejects unknown choices and bad pincodes", () => {
    const e = errorsOf(leadFormSchema.safeParse({ ...ok, ownership: "LANDLORD", roofType: "", pincode: "04402" }));
    expect(Object.keys(e).sort()).toEqual(["ownership", "pincode", "roofType"]);
  });

  it("rejects absurd sizes", () => {
    expect(leadFormSchema.safeParse({ ...ok, roofAreaSqft: "10" }).success).toBe(false);
    expect(leadFormSchema.safeParse({ ...ok, monthlyBill: "5000000" }).success).toBe(false);
  });
});

describe("confirmBillSchema", () => {
  const bill = { consumerNumber: "4100 1928-3746", tariffCategory: "LT-I(B)", sanctionedLoadKw: "3", monthlyUnits: "340", billAmount: "3200" };

  it("cleans the consumer number and converts numbers", () => {
    expect(confirmBillSchema.parse(bill)).toEqual({
      consumerNumber: "410019283746",
      tariffCategory: "LT-I(B)",
      sanctionedLoadKw: 3,
      monthlyUnits: 340,
      billAmount: 3200,
    });
  });

  it("allows load and amount to be left blank", () => {
    const r = confirmBillSchema.parse({ ...bill, sanctionedLoadKw: "", billAmount: "" });
    expect(r.sanctionedLoadKw).toBeNull();
    expect(r.billAmount).toBeNull();
  });

  it("requires units within a household range", () => {
    expect(confirmBillSchema.safeParse({ ...bill, monthlyUnits: "" }).success).toBe(false);
    expect(confirmBillSchema.safeParse({ ...bill, monthlyUnits: "99999" }).success).toBe(false);
  });
});
