"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { checkBillFile } from "@/lib/files";
import { addBill, createLead, markReadFailed, processBill, rateLimitHit } from "@/lib/leads/service";
import { leadFormSchema } from "@/lib/leads/validation";

export interface LeadFormState {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
}

async function readFile(form: FormData) {
  const file = form.get("bill");
  if (!(file instanceof File)) return { ok: false as const, error: "Please add a photo or PDF of your bill." };
  const data = new Uint8Array(await file.arrayBuffer());
  const check = checkBillFile(data);
  return check.ok ? { ok: true as const, data, mime: check.mime } : check;
}

export async function submitLead(_prev: LeadFormState, form: FormData): Promise<LeadFormState> {
  const session = await requireRole("HOMEOWNER");
  const raw = Object.fromEntries(
    ["ownership", "roofType", "roofAreaSqft", "monthlyBill", "pincode"].map((k) => [k, String(form.get(k) ?? "")]),
  );

  const parsed = leadFormSchema.safeParse(raw);
  const file = await readFile(form);
  if (!parsed.success || !file.ok) {
    return {
      fieldErrors: { ...(parsed.success ? {} : parsed.error.flatten().fieldErrors), ...(file.ok ? {} : { bill: [file.error] }) },
      values: raw,
    };
  }

  const limited = await rateLimitHit(session.userId);
  if (limited) return { error: limited, values: raw };

  const user = await db.user.findUniqueOrThrow({ where: { id: session.userId }, select: { id: true, name: true, phone: true } });
  const { leadId, billId } = await createLead(user, parsed.data, { data: file.data, mime: file.mime });
  await processBill(billId).catch(() => markReadFailed(billId));
  redirect(`/my/requests/${leadId}?sent=1`);
}

export interface ReuploadState {
  error?: string;
}

export async function reuploadBill(leadId: string, _prev: ReuploadState, form: FormData): Promise<ReuploadState> {
  const session = await requireRole("HOMEOWNER");
  const lead = await db.lead.findFirst({ where: { id: leadId, homeownerId: session.userId }, select: { id: true, status: true } });
  if (!lead) return { error: "We couldn't find that request." };
  if (lead.status !== "REUPLOAD_REQUESTED") return { error: "This request doesn't need a new bill photo." };

  const file = await readFile(form);
  if (!file.ok) return { error: file.error };

  const limited = await rateLimitHit(session.userId);
  if (limited?.includes("hour")) return { error: limited };

  const billId = await addBill(lead.id, { data: file.data, mime: file.mime });
  await processBill(billId).catch(() => markReadFailed(billId));
  redirect(`/my/requests/${lead.id}?sent=1`);
}
