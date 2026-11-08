"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/server";
import { errorText } from "@/lib/errors";
import { getDict } from "@/lib/i18n";
import { addCalcSetting, addPriceRule, addSubsidyRule } from "@/lib/rules-admin";
import { makeCalcSettingSchema, makePriceRuleSchema, makeSubsidyRuleSchema } from "@/lib/rules-validation";

export interface RuleFormState {
  ok?: string;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

const pick = (form: FormData, keys: string[]) => Object.fromEntries(keys.map((k) => [k, String(form.get(k) ?? "")]));

export async function createSubsidyRule(_prev: RuleFormState, form: FormData): Promise<RuleFormState> {
  const [, { t }] = await Promise.all([requireRole("ADMIN"), getDict()]);
  const raw = pick(form, ["name", "slab1Upto", "slab1PerKw", "slab2Upto", "slab2PerKw", "capAmount", "effectiveFrom"]);
  if (!raw.slab2Upto) delete raw.slab2Upto;
  if (!raw.slab2PerKw) delete raw.slab2PerKw;
  const parsed = makeSubsidyRuleSchema(t.staff.rules.v).safeParse(raw);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    await addSubsidyRule(parsed.data);
  } catch (e) {
    const msg = errorText(t.staff.errors, e);
    if (msg) return { error: msg };
    throw e;
  }
  revalidatePath("/admin/rules");
  return { ok: t.staff.rules.subsidyAdded };
}

export async function createPriceRule(_prev: RuleFormState, form: FormData): Promise<RuleFormState> {
  const [, { t }] = await Promise.all([requireRole("ADMIN"), getDict()]);
  const parsed = makePriceRuleSchema(t.staff.rules.v).safeParse(pick(form, ["minKw", "maxKw", "pricePerKw", "effectiveFrom"]));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    await addPriceRule(parsed.data);
  } catch (e) {
    const msg = errorText(t.staff.errors, e);
    if (msg) return { error: msg };
    throw e;
  }
  revalidatePath("/admin/rules");
  return { ok: t.staff.rules.priceAdded };
}

export async function createCalcSetting(_prev: RuleFormState, form: FormData): Promise<RuleFormState> {
  const [, { t }] = await Promise.all([requireRole("ADMIN"), getDict()]);
  const parsed = makeCalcSettingSchema(t.staff.rules.v).safeParse(pick(form, ["generationPerKwYear", "tariffPerUnit", "exportRatePerUnit", "sqftPerKw", "effectiveFrom"]));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    await addCalcSetting(parsed.data);
  } catch (e) {
    const msg = errorText(t.staff.errors, e);
    if (msg) return { error: msg };
    throw e;
  }
  revalidatePath("/admin/rules");
  return { ok: t.staff.rules.settingAdded };
}
