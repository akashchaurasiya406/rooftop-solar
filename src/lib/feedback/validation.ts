import { createHash } from "node:crypto";
import { z } from "zod";
import { en } from "@/lib/i18n/en";

type FeedbackErrors = typeof en.feedback.errors;

const optionalText = (max: number) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().trim().max(max).optional());

export const makeFeedbackSchema = (m: FeedbackErrors = en.feedback.errors) =>
  z.object({
    rating: z.coerce.number({ error: m.rating }).int(m.rating).min(1, m.rating).max(5, m.rating),
    message: z
      .string({ error: m.message })
      .transform((s) => s.replace(/\s+/g, " ").trim())
      .pipe(z.string().min(10, m.message).max(500, m.long)),
    name: optionalText(40),
    city: optionalText(40),
  });

export const feedbackSchema = makeFeedbackSchema();
export type FeedbackInput = z.infer<typeof feedbackSchema>;

export function hashIp(ip: string | null, secret: string): string | null {
  if (!ip) return null;
  return createHash("sha256").update(`${secret}:${ip}`).digest("hex").slice(0, 32);
}

export function clientIp(forwardedFor: string | null, realIp: string | null): string | null {
  const first = forwardedFor?.split(",")[0]?.trim();
  return first || realIp?.trim() || null;
}

export function averageRating(ratings: number[]): number | null {
  if (ratings.length === 0) return null;
  return Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;
}

export function initials(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "★";
  return parts
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}
