"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/server";
import { baseUrl } from "@/lib/base-url";
import { db } from "@/lib/db";
import { MAX_UPLOAD_BYTES, checkBillFile } from "@/lib/files";
import { getDict, type Dict } from "@/lib/i18n";
import { addBill, createLead, markReadFailed, processBill, rateLimitHit } from "@/lib/leads/service";
import { makeLeadFormSchema } from "@/lib/leads/validation";
import { errorText } from "@/lib/errors";
import { acceptQuote } from "@/lib/quotes/service";

export interface LeadFormState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
}

async function readFile(form: FormData, t: Dict) {
  const file = form.get("bill");
  if (!(file instanceof File) || file.size === 0) return { ok: false as const, error: t.form.errors.bill };
  const data = new Uint8Array(await file.arrayBuffer());
  const check = checkBillFile(data);
  if (check.ok) return { ok: true as const, data, mime: check.mime };
  return { ok: false as const, error: data.length > MAX_UPLOAD_BYTES ? t.form.errors.billBig : t.form.errors.billType };
}

const limitMessage = (t: Dict, code: "hour" | "day") => (code === "hour" ? t.form.errors.limitHour : t.form.errors.limitDay);

export async function submitLead(_prev: LeadFormState, form: FormData): Promise<LeadFormState> {
  const [session, { t }] = await Promise.all([requireRole("HOMEOWNER"), getDict()]);
  const raw = Object.fromEntries(["ownership", "roofType", "roofAreaSqft", "monthlyBill", "pincode"].map((k) => [k, String(form.get(k) ?? "")]));

  const parsed = makeLeadFormSchema(t.form.errors).safeParse(raw);
  const file = await readFile(form, t);
  if (!parsed.success || !file.ok) {
    return {
      fieldErrors: { ...(parsed.success ? {} : parsed.error.flatten().fieldErrors), ...(file.ok ? {} : { bill: [file.error] }) },
      values: raw,
    };
  }

  const limited = await rateLimitHit(session.userId);
  if (limited) return { error: limitMessage(t, limited), values: raw };

  const user = await db.user.findUniqueOrThrow({ where: { id: session.userId }, select: { id: true, name: true, phone: true } });
  const { leadId, billId } = await createLead(user, parsed.data, { data: file.data, mime: file.mime });
  await processBill(billId).catch(() => markReadFailed(billId));
  redirect(`/my/requests/${leadId}?sent=1`);
}

export interface ReuploadState {
  error?: string;
}

export async function reuploadBill(leadId: string, _prev: ReuploadState, form: FormData): Promise<ReuploadState> {
  const [session, { t }] = await Promise.all([requireRole("HOMEOWNER"), getDict()]);
  const lead = await db.lead.findFirst({ where: { id: leadId, homeownerId: session.userId }, select: { id: true, status: true } });
  if (!lead || lead.status !== "REUPLOAD_REQUESTED") return { error: t.request.reuploadDefault };

  const file = await readFile(form, t);
  if (!file.ok) return { error: file.error };

  const limited = await rateLimitHit(session.userId);
  if (limited === "hour") return { error: limitMessage(t, limited) };

  const billId = await addBill(lead.id, { data: file.data, mime: file.mime });
  await processBill(billId).catch(() => markReadFailed(billId));
  redirect(`/my/requests/${lead.id}?sent=1`);
}

export interface AcceptState {
  error?: string;
}

export async function acceptQuoteAction(quoteId: string, leadId: string, _prev: AcceptState, form: FormData): Promise<AcceptState> {
  const [session, { t }] = await Promise.all([requireRole("HOMEOWNER"), getDict()]);
  if (form.get("agree") !== "on") return { error: t.request.tickBox };
  try {
    await acceptQuote(quoteId, session.userId, await baseUrl());
  } catch (e) {
    const msg = errorText(t.staff.errors, e);
    if (msg) return { error: msg };
    throw e;
  }
  redirect(`/my/requests/${leadId}?accepted=1`);
}
