import { describe, expect, it } from "vitest";
import { makeLoginSchema, makeSignupSchema } from "@/lib/auth/validation";
import { makeLeadFormSchema } from "@/lib/leads/validation";
import { STAGES } from "@/lib/projects/stages";
import { en } from "./en";
import { hi } from "./hi";
import { mr } from "./mr";

type Leaf = [path: string, value: unknown];
const leaves = (o: unknown, path = ""): Leaf[] =>
  o && typeof o === "object" ? Object.entries(o).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k)) : [[path, o]];

const DEVANAGARI = /[ऀ-ॿ]/;

describe("dictionaries", () => {
  it("Hindi has exactly the same keys as English", () => {
    expect(leaves(hi).map(([p]) => p).sort()).toEqual(leaves(en).map(([p]) => p).sort());
  });

  it("Marathi has exactly the same keys as English", () => {
    expect(leaves(mr).map(([p]) => p).sort()).toEqual(leaves(en).map(([p]) => p).sort());
  });

  it("has no empty strings, except where Hindi word order needs one", () => {
    const allowedEmpty = ["quote.after"];
    for (const [p, v] of [...leaves(en), ...leaves(hi), ...leaves(mr)]) {
      if (typeof v === "string" && !allowedEmpty.includes(p)) expect(v.trim(), p).not.toBe("");
    }
  });

  it("actually translates sentences into Hindi", () => {
    const sentences = leaves(hi).filter(([, v]) => typeof v === "string" && (v as string).split(" ").length > 2);
    const untranslated = sentences.filter(([, v]) => !DEVANAGARI.test(v as string)).map(([p]) => p);
    expect(untranslated).toEqual([]);
  });

  it("actually translates sentences into Marathi", () => {
    const sentences = leaves(mr).filter(([, v]) => typeof v === "string" && (v as string).split(" ").length > 2);
    expect(sentences.filter(([, v]) => !DEVANAGARI.test(v as string)).map(([p]) => p)).toEqual([]);
  });

  it("covers every project stage in both languages", () => {
    for (const s of STAGES) {
      expect(en.stages[s]).toHaveLength(2);
      expect(hi.stages[s][0]).toMatch(DEVANAGARI);
      expect(mr.stages[s][0]).toMatch(DEVANAGARI);
    }
  });
});

describe("validation speaks the chosen language", () => {
  const flat = (r: { success: boolean; error?: { flatten: () => { fieldErrors: Record<string, string[]> } } }) =>
    r.success ? {} : r.error!.flatten().fieldErrors;

  it("lead form errors in Hindi", () => {
    const e = flat(makeLeadFormSchema(hi.form.errors).safeParse({ ownership: "", roofType: "", roofAreaSqft: "", monthlyBill: "5", pincode: "12" }));
    expect(e.ownership?.[0]).toBe(hi.form.errors.ownership);
    expect(e.roofAreaSqft?.[0]).toBe(hi.form.errors.roofArea);
    expect(e.monthlyBill?.[0]).toBe(hi.form.errors.monthlyBillRange);
    expect(e.pincode?.[0]).toBe(hi.form.errors.pincode);
  });

  it("sign-up and login errors in Hindi", () => {
    expect(flat(makeSignupSchema(hi.auth.errors).safeParse({ name: "A", email: "x", phone: "1", password: "short" })).phone?.[0]).toBe(hi.auth.errors.phone);
    expect(flat(makeLoginSchema(hi.auth.errors).safeParse({ email: "nope", password: "" })).email?.[0]).toBe(hi.auth.errors.email);
  });

  it("lead form errors in Marathi", () => {
    expect(flat(makeLeadFormSchema(mr.form.errors).safeParse({ ownership: "" })).ownership?.[0]).toBe(mr.form.errors.ownership);
  });

  it("defaults to English", () => {
    expect(flat(makeLeadFormSchema().safeParse({ ownership: "" })).ownership?.[0]).toBe(en.form.errors.ownership);
  });
});
