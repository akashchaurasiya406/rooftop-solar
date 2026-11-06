"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/server";
import { addPriceRule, addSubsidyRule, RuleError } from "@/lib/rules-admin";
import { priceRuleSchema, subsidyRuleSchema } from "@/lib/rules-validation";

export interface RuleFormState {
  ok?: string;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

const pick = (form: FormData, keys: string[]) => Object.fromEntries(keys.map((k) => [k, String(form.get(k) ?? "")]));

export async function createSubsidyRule(_prev: RuleFormState, form: FormData): Promise<RuleFormState> {
  await requireRole("ADMIN");
  const raw = pick(form, ["name", "slab1Upto", "slab1PerKw", "slab2Upto", "slab2PerKw", "capAmount", "effectiveFrom"]);
  if (!raw.slab2Upto) delete raw.slab2Upto;
  if (!raw.slab2PerKw) delete raw.slab2PerKw;
  const parsed = subsidyRuleSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    await addSubsidyRule(parsed.data);
  } catch (e) {
    if (e instanceof RuleError) return { error: e.message };
    throw e;
  }
  revalidatePath("/admin/rules");
  return { ok: "Subsidy rule added. Quotes from its start date will use it; earlier quotes keep their old rule." };
}

export async function createPriceRule(_prev: RuleFormState, form: FormData): Promise<RuleFormState> {
  await requireRole("ADMIN");
  const parsed = priceRuleSchema.safeParse(pick(form, ["minKw", "maxKw", "pricePerKw", "effectiveFrom"]));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    await addPriceRule(parsed.data);
  } catch (e) {
    if (e instanceof RuleError) return { error: e.message };
    throw e;
  }
  revalidatePath("/admin/rules");
  return { ok: "Price added." };
}
