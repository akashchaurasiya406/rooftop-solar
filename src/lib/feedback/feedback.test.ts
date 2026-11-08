import { describe, expect, it } from "vitest";
import { hi } from "@/lib/i18n/hi";
import { averageRating, clientIp, hashIp, initials, makeFeedbackSchema } from "./validation";

const errs = (r: { success: boolean; error?: { flatten: () => { fieldErrors: Record<string, string[]> } } }) =>
  r.success ? {} : r.error!.flatten().fieldErrors;

describe("feedback validation", () => {
  const schema = makeFeedbackSchema();

  it("accepts a rating with a message and trims whitespace", () => {
    expect(schema.parse({ rating: "5", message: "  Quote came the  same day.  ", name: " Asha ", city: "" })).toEqual({
      rating: 5,
      message: "Quote came the same day.",
      name: "Asha",
      city: undefined,
    });
  });

  it("rejects missing or out-of-range ratings", () => {
    expect(errs(schema.safeParse({ rating: "", message: "Very helpful team" })).rating).toBeDefined();
    expect(errs(schema.safeParse({ rating: "6", message: "Very helpful team" })).rating).toBeDefined();
    expect(errs(schema.safeParse({ rating: "2.5", message: "Very helpful team" })).rating).toBeDefined();
  });

  it("rejects very short and very long messages", () => {
    expect(errs(schema.safeParse({ rating: 4, message: "ok" })).message).toBeDefined();
    expect(errs(schema.safeParse({ rating: 4, message: "a".repeat(501) })).message).toBeDefined();
  });

  it("does not count padding towards the minimum length", () => {
    expect(errs(schema.safeParse({ rating: 4, message: "  good          " })).message).toBeDefined();
  });

  it("speaks Hindi when asked", () => {
    expect(errs(makeFeedbackSchema(hi.feedback.errors).safeParse({ rating: 0, message: "x" })).rating?.[0]).toBe(hi.feedback.errors.rating);
  });
});

describe("privacy-safe rate limiting", () => {
  it("never stores the raw IP and is stable for the same visitor", () => {
    const a = hashIp("203.0.113.7", "secret");
    expect(a).not.toContain("203");
    expect(a).toHaveLength(32);
    expect(hashIp("203.0.113.7", "secret")).toBe(a);
    expect(hashIp("203.0.113.8", "secret")).not.toBe(a);
    expect(hashIp("203.0.113.7", "other")).not.toBe(a);
    expect(hashIp(null, "secret")).toBeNull();
  });

  it("takes the first address from forwarded headers", () => {
    expect(clientIp("203.0.113.7, 10.0.0.1", null)).toBe("203.0.113.7");
    expect(clientIp(null, " 198.51.100.2 ")).toBe("198.51.100.2");
    expect(clientIp(null, null)).toBeNull();
  });
});

describe("display helpers", () => {
  it("averages ratings to one decimal", () => {
    expect(averageRating([5, 4, 4])).toBe(4.3);
    expect(averageRating([])).toBeNull();
  });
  it("builds initials", () => {
    expect(initials("Sunita Deshmukh")).toBe("SD");
    expect(initials("")).toBe("★");
    expect(initials(null)).toBe("★");
  });
});
