"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { endSession, startSession } from "@/lib/auth/server";
import { canAccess, homeFor } from "@/lib/auth/session";
import { makeLoginSchema, makeSignupSchema, safeNext } from "@/lib/auth/validation";
import { db } from "@/lib/db";
import { getDict } from "@/lib/i18n";

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
}

const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export async function login(_prev: FormState, form: FormData): Promise<FormState> {
  const raw = { email: String(form.get("email") ?? ""), password: String(form.get("password") ?? "") };
  const { t } = await getDict();
  const parsed = makeLoginSchema(t.auth.errors).safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, values: { email: raw.email } };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  const ok = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) {
    return { error: t.auth.errors.wrongLogin, values: { email: raw.email } };
  }

  await startSession({ userId: user.id, role: user.role, name: user.name });
  const next = safeNext(form.get("next"));
  redirect(next && canAccess(next, user.role) ? next : homeFor(user.role));
}

export async function signup(_prev: FormState, form: FormData): Promise<FormState> {
  const raw = {
    name: String(form.get("name") ?? ""),
    email: String(form.get("email") ?? ""),
    phone: String(form.get("phone") ?? ""),
    password: String(form.get("password") ?? ""),
  };
  const { t } = await getDict();
  const parsed = makeSignupSchema(t.auth.errors).safeParse(raw);
  const values = { name: raw.name, email: raw.email, phone: raw.phone };
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors, values };

  const exists = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) {
    return { fieldErrors: { email: [t.auth.errors.emailTaken] }, values };
  }

  const user = await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
      role: "HOMEOWNER",
    },
  });
  await startSession({ userId: user.id, role: user.role, name: user.name });
  redirect("/my/new");
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/");
}
