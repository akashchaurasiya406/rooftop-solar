"use server";

import type { FeedbackStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/server";
import { baseUrl } from "@/lib/base-url";
import { QuoteError } from "@/lib/calc/quote";
import { db } from "@/lib/db";
import { errorText } from "@/lib/errors";
import { setFeedbackStatus } from "@/lib/feedback/service";
import { getDict } from "@/lib/i18n";
import { fill } from "@/lib/i18n/format";
import { confirmBillValues, processBill, requestReupload } from "@/lib/leads/service";
import { makeConfirmBillSchema, makeReuploadRequestSchema } from "@/lib/leads/validation";
import { STAGES, type Stage } from "@/lib/projects/stages";
import { advanceProject, createQuote } from "@/lib/quotes/service";

export interface StaffFormState {
  ok?: string;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

async function billForLead(leadId: string, billId: string) {
  return db.bill.findFirst({ where: { id: billId, leadId }, select: { id: true, status: true, fileData: true } });
}

export async function confirmBill(leadId: string, billId: string, _prev: StaffFormState, form: FormData): Promise<StaffFormState> {
  const [session, { t }] = await Promise.all([requireRole("SALES", "ADMIN"), getDict()]);
  const A = t.staff.actions;
  const bill = await billForLead(leadId, billId);
  if (!bill) return { error: A.billGone };
  if (bill.status === "NEEDS_REUPLOAD") return { error: A.photoRequested };

  const parsed = makeConfirmBillSchema(t.staff.validation).safeParse({
    consumerNumber: form.get("consumerNumber") ?? "",
    tariffCategory: form.get("tariffCategory") ?? "",
    sanctionedLoadKw: form.get("sanctionedLoadKw") ?? "",
    monthlyUnits: form.get("monthlyUnits") ?? "",
    billAmount: form.get("billAmount") ?? "",
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { status } = await confirmBillValues(bill.id, session.userId, parsed.data);
  revalidatePath(`/sales/leads/${leadId}`);
  revalidatePath("/sales");
  return { ok: status === "SURVEY" ? A.routedSurvey : A.routedCall };
}

export async function askForNewPhoto(leadId: string, billId: string, _prev: StaffFormState, form: FormData): Promise<StaffFormState> {
  const [, { t }] = await Promise.all([requireRole("SALES", "ADMIN"), getDict()]);
  const bill = await billForLead(leadId, billId);
  if (!bill) return { error: t.staff.actions.billGone };

  const parsed = makeReuploadRequestSchema(t.staff.validation).safeParse({ reason: form.get("reason") ?? "" });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  await requestReupload(bill.id, parsed.data.reason);
  revalidatePath(`/sales/leads/${leadId}`);
  revalidatePath("/sales");
  return { ok: t.staff.actions.askedPhoto };
}

export async function readAgain(leadId: string, billId: string): Promise<StaffFormState> {
  const [, { t }] = await Promise.all([requireRole("SALES", "ADMIN"), getDict()]);
  const A = t.staff.actions;
  const bill = await billForLead(leadId, billId);
  if (!bill?.fileData) return { error: A.noFile };
  const { outcome } = await processBill(bill.id);
  revalidatePath(`/sales/leads/${leadId}`);
  revalidatePath("/sales");
  if (outcome === "AI_UNAVAILABLE") return { error: A.aiStillDown };
  return { ok: outcome === "EXTRACTED" ? A.readAgainOk : A.readAgainFail };
}

export async function sendQuote(leadId: string, _prev: StaffFormState, form: FormData): Promise<StaffFormState> {
  const [session, { t }] = await Promise.all([requireRole("SALES", "ADMIN"), getDict()]);
  const kw = Number(form.get("kw"));
  if (!Number.isFinite(kw) || kw < 1 || kw > 10) return { error: t.staff.actions.pickSize };
  try {
    await createQuote(leadId, session.userId, kw);
  } catch (e) {
    const msg = errorText(t.staff.errors, e);
    if (msg) return { error: msg };
    if (e instanceof QuoteError) return { error: e.code ? t.staff.errors[e.code] : e.message };
    throw e;
  }
  revalidatePath(`/sales/leads/${leadId}`);
  revalidatePath("/sales");
  redirect(`/sales/leads/${leadId}?quote=sent`);
}

export async function moveStage(projectId: string, to: string, _prev: StaffFormState, form: FormData): Promise<StaffFormState> {
  const [session, { t }] = await Promise.all([requireRole("SALES", "ADMIN"), getDict()]);
  if (!(STAGES as readonly string[]).includes(to)) return { error: t.staff.actions.unknownStage };
  const note = String(form.get("note") ?? "").trim().slice(0, 300) || null;
  try {
    await advanceProject(projectId, session.userId, to as Stage, note, await baseUrl());
  } catch (e) {
    const msg = errorText(t.staff.errors, e);
    if (msg) return { error: msg };
    throw e;
  }
  revalidatePath(`/sales/projects/${projectId}`);
  revalidatePath("/sales/projects");
  return { ok: fill(t.staff.actions.moved, { stage: t.stages[to as Stage][0] }) };
}

export async function updateFeedback(id: string, status: FeedbackStatus): Promise<void> {
  await requireRole("SALES", "ADMIN");
  if (!["PENDING", "APPROVED", "HIDDEN"].includes(status)) return;
  await setFeedbackStatus(id, status);
  revalidatePath("/sales/feedback");
  revalidatePath("/");
}
