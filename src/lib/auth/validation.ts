import { z } from "zod";
import { en } from "@/lib/i18n/en";

type AuthErrors = typeof en.auth.errors;

export const makeLoginSchema = (m: AuthErrors = en.auth.errors) =>
  z.object({
    email: z.string().trim().toLowerCase().email(m.email),
    password: z.string().min(1, m.password).max(200),
  });

export const makeSignupSchema = (m: AuthErrors = en.auth.errors) =>
  z.object({
    name: z.string().trim().min(2, m.name).max(80),
    email: z.string().trim().toLowerCase().email(m.email),
    phone: z
      .string()
      .trim()
      .transform((v) => v.replace(/[\s-]/g, "").replace(/^(\+91|0)/, ""))
      .pipe(z.string().regex(/^[6-9]\d{9}$/, m.phone)),
    password: z.string().min(8, m.passwordShort).max(200).regex(/[A-Za-z]/, m.passwordLetter).regex(/\d/, m.passwordNumber),
  });

export const loginSchema = makeLoginSchema();
export const signupSchema = makeSignupSchema();

export function safeNext(next: unknown): string | null {
  if (typeof next !== "string") return null;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return null;
  return next;
}
