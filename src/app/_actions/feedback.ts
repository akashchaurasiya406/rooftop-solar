"use server";

import { headers } from "next/headers";
import { getSession } from "@/lib/auth/server";
import { saveFeedback, tooManyFeedback } from "@/lib/feedback/service";
import { clientIp, hashIp, makeFeedbackSchema } from "@/lib/feedback/validation";
import { getDict } from "@/lib/i18n";

export interface FeedbackState {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export async function submitFeedback(_prev: FeedbackState, form: FormData): Promise<FeedbackState> {
  const [{ lang, t }, session, h] = await Promise.all([getDict(), getSession(), headers()]);

  if (String(form.get("website") ?? "") !== "") return { ok: true };

  const parsed = makeFeedbackSchema(t.feedback.errors).safeParse({
    rating: form.get("rating") ?? "",
    message: form.get("message") ?? "",
    name: form.get("name") ?? "",
    city: form.get("city") ?? "",
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const ipHash = hashIp(clientIp(h.get("x-forwarded-for"), h.get("x-real-ip")), process.env.SESSION_SECRET ?? "");
  if (await tooManyFeedback(ipHash)) return { error: t.feedback.errors.limit };

  await saveFeedback(parsed.data, { lang, ipHash, userId: session?.userId ?? null });
  return { ok: true };
}
