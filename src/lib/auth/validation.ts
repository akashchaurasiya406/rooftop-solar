import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password.").max(200),
});

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  // Indian mobile: 10 digits starting 6–9, optional +91 / 0 prefix.
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, "").replace(/^(\+91|0)/, ""))
    .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number.")),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(200)
    .regex(/[A-Za-z]/, "Include at least one letter.")
    .regex(/\d/, "Include at least one number."),
});

/** Only allow redirects to our own pages (blocks open-redirects like //evil.com). */
export function safeNext(next: unknown): string | null {
  if (typeof next !== "string") return null;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return null;
  return next;
}
