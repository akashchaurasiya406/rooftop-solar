"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { confirmBillValues, processBill, requestReupload } from "@/lib/leads/service";
import { confirmBillSchema, reuploadRequestSchema } from "@/lib/leads/validation";

export interface StaffFormState {
  ok?: string;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

async function billForLead(leadId: string, billId: string) {
  return db.bill.findFirst({ where: { id: billId, leadId }, select: { id: true, status: true, fileData: true } });
}

export async function confirmBill(leadId: string, billId: string, _prev: StaffFormState, form: FormData): Promise<StaffFormState> {
  const session = await requireRole("SALES", "ADMIN");
  const bill = await billForLead(leadId, billId);
  if (!bill) return { error: "This bill no longer exists." };
  if (bill.status === "NEEDS_REUPLOAD") return { error: "A new photo has been requested for this bill." };

  const parsed = confirmBillSchema.safeParse({
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
  return { ok: status === "SURVEY" ? "Confirmed. This lead is worth a survey visit." : "Confirmed. A short call is enough for this lead." };
}

export async function askForNewPhoto(leadId: string, billId: string, _prev: StaffFormState, form: FormData): Promise<StaffFormState> {
  await requireRole("SALES", "ADMIN");
  const bill = await billForLead(leadId, billId);
  if (!bill) return { error: "This bill no longer exists." };

  const parsed = reuploadRequestSchema.safeParse({ reason: form.get("reason") ?? "" });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  await requestReupload(bill.id, parsed.data.reason);
  revalidatePath(`/sales/leads/${leadId}`);
  revalidatePath("/sales");
  return { ok: "The homeowner has been asked for a new photo." };
}

export async function readAgain(leadId: string, billId: string): Promise<StaffFormState> {
  await requireRole("SALES", "ADMIN");
  const bill = await billForLead(leadId, billId);
  if (!bill?.fileData) return { error: "There is no uploaded file to read." };
  const { outcome } = await processBill(bill.id);
  revalidatePath(`/sales/leads/${leadId}`);
  revalidatePath("/sales");
  if (outcome === "AI_UNAVAILABLE") return { error: "The AI is still unavailable. Please enter the values by hand." };
  return { ok: outcome === "EXTRACTED" ? "Bill read again." : "The AI could not read this photo." };
}
