import "server-only";
import { Prisma, type LeadStatus } from "@prisma/client";
import { assessExtraction } from "@/lib/ai/extraction";
import { AiUnavailableError, readBill } from "@/lib/ai/gemini";
import { scoreLead, type ScoreInput } from "@/lib/calc/scoring";
import { db } from "@/lib/db";
import { getEffectiveRules } from "@/lib/rules-repo";
import { inServiceArea, regionForPincode } from "@/lib/service-area";
import type { LeadForm } from "./validation";

export const LIMITS_PER_USER = { leadsPerDay: 5, uploadsPerHour: 10 } as const;

async function scoreSettings() {
  const { setting } = await getEffectiveRules();
  return { generationPerKwYear: setting.generationPerKwYear, sqftPerKw: setting.sqftPerKw };
}

async function nextLeadCode(): Promise<string> {
  const rows = await db.$queryRaw<{ max: number | null }[]>`
    SELECT MAX(CAST(SUBSTRING(code FROM 4) AS INTEGER)) AS max FROM "Lead" WHERE code ~ '^LD-[0-9]+$'`;
  return `LD-${(rows[0]?.max ?? 30000) + 1}`;
}

async function leastBusySalesUser(): Promise<string | null> {
  const staff = await db.user.findMany({
    where: { role: "SALES" },
    select: { id: true, _count: { select: { assignedLeads: { where: { status: { notIn: ["WON", "LOST"] } } } } } },
  });
  staff.sort((a, b) => a._count.assignedLeads - b._count.assignedLeads);
  return staff[0]?.id ?? null;
}

export async function rateLimitHit(userId: string): Promise<string | null> {
  const [leadsToday, uploadsLastHour] = await Promise.all([
    db.lead.count({ where: { homeownerId: userId, createdAt: { gte: new Date(Date.now() - 86_400_000) } } }),
    db.bill.count({ where: { lead: { homeownerId: userId }, createdAt: { gte: new Date(Date.now() - 3_600_000) } } }),
  ]);
  if (uploadsLastHour >= LIMITS_PER_USER.uploadsPerHour) return "You've uploaded a lot of bills in the last hour. Please try again later.";
  if (leadsToday >= LIMITS_PER_USER.leadsPerDay) return "You've sent several requests today. Our team will contact you about them soon.";
  return null;
}

export async function createLead(
  user: { id: string; name: string; phone: string | null },
  form: LeadForm,
  file: { data: Uint8Array; mime: string },
): Promise<{ leadId: string; billId: string }> {
  const [settings, assignedToId] = await Promise.all([scoreSettings(), leastBusySalesUser()]);
  const provisional = scoreLead({ ...form, inServiceArea: inServiceArea(form.pincode) }, settings);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const lead = await db.lead.create({
        data: {
          code: await nextLeadCode(),
          name: user.name,
          phone: user.phone ?? "",
          ownership: form.ownership,
          roofType: form.roofType,
          roofAreaSqft: form.roofAreaSqft,
          monthlyBill: form.monthlyBill,
          pincode: form.pincode,
          district: regionForPincode(form.pincode),
          status: "NEW",
          score: provisional.score,
          scoreReasons: provisional.reasons,
          recommendedKw: provisional.recommendedKw,
          homeownerId: user.id,
          assignedToId,
          bills: { create: { fileData: Buffer.from(file.data), fileMime: file.mime, fileSize: file.data.length } },
        },
        select: { id: true, bills: { select: { id: true } } },
      });
      return { leadId: lead.id, billId: lead.bills[0].id };
    } catch (e) {
      const codeClash = e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
      if (!codeClash || attempt === 2) throw e;
    }
  }
  throw new Error("Could not create lead.");
}

export async function addBill(leadId: string, file: { data: Uint8Array; mime: string }): Promise<string> {
  const lead = await db.lead.update({
    where: { id: leadId },
    data: { status: "NEW", bills: { create: { fileData: Buffer.from(file.data), fileMime: file.mime, fileSize: file.data.length } } },
    select: { bills: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true } } },
  });
  return lead.bills[0].id;
}

export type ProcessOutcome = "EXTRACTED" | "NEEDS_REUPLOAD" | "AI_UNAVAILABLE";

export async function processBill(billId: string): Promise<{ outcome: ProcessOutcome; reason?: string }> {
  const bill = await db.bill.findUniqueOrThrow({
    where: { id: billId },
    select: { id: true, fileData: true, fileMime: true, lead: true },
  });
  if (!bill.fileData || !bill.fileMime) throw new Error("Bill has no file.");
  const lead = bill.lead;

  let read: Awaited<ReturnType<typeof readBill>>;
  try {
    read = await readBill(new Uint8Array(bill.fileData), bill.fileMime);
  } catch (e) {
    const message = e instanceof AiUnavailableError ? e.message : "Unexpected error while reading the bill.";
    await db.$transaction([
      db.bill.update({ where: { id: billId }, data: { status: "UPLOADED", aiError: message.slice(0, 500) } }),
      db.lead.update({ where: { id: lead.id }, data: { status: "BILL_REVIEW" } }),
    ]);
    return { outcome: "AI_UNAVAILABLE" };
  }

  const a = assessExtraction(read.extraction, lead.monthlyBill);
  const raw = read.extraction as unknown as Prisma.InputJsonValue;

  if (a.decision === "REUPLOAD") {
    await db.$transaction([
      db.bill.update({
        where: { id: billId },
        data: { status: "NEEDS_REUPLOAD", aiExtraction: raw, aiModel: read.model, aiError: null, aiIssues: a.issues, reuploadReason: a.reuploadReason },
      }),
      db.lead.update({ where: { id: lead.id }, data: { status: "REUPLOAD_REQUESTED" } }),
    ]);
    return { outcome: "NEEDS_REUPLOAD", reason: a.reuploadReason ?? undefined };
  }

  const settings = await scoreSettings();
  const s = scoreLead(
    {
      ownership: lead.ownership,
      roofType: lead.roofType,
      roofAreaSqft: lead.roofAreaSqft,
      monthlyBill: lead.monthlyBill,
      monthlyUnits: a.values.monthlyUnits,
      sanctionedLoadKw: a.values.sanctionedLoadKw,
      inServiceArea: inServiceArea(lead.pincode),
    },
    settings,
  );

  await db.$transaction([
    db.bill.update({
      where: { id: billId },
      data: {
        status: "EXTRACTED",
        aiExtraction: raw,
        aiModel: read.model,
        aiError: null,
        aiIssues: { issues: a.issues, needsCheck: a.needsCheck },
        reuploadReason: null,
        ...a.values,
      },
    }),
    db.lead.update({
      where: { id: lead.id },
      data: { status: "BILL_REVIEW", score: s.score, scoreReasons: s.reasons, recommendedKw: s.recommendedKw },
    }),
  ]);
  return { outcome: "EXTRACTED" };
}

export async function markReadFailed(billId: string): Promise<void> {
  const bill = await db.bill.update({
    where: { id: billId },
    data: { status: "UPLOADED", aiError: "The bill could not be read automatically. Please enter the values by hand." },
    select: { leadId: true },
  });
  await db.lead.update({ where: { id: bill.leadId }, data: { status: "BILL_REVIEW" } });
}

export async function confirmBillValues(
  billId: string,
  staffId: string,
  values: { consumerNumber: string; tariffCategory: string; sanctionedLoadKw: number | null; monthlyUnits: number; billAmount: number | null },
): Promise<{ status: LeadStatus }> {
  const bill = await db.bill.findUniqueOrThrow({ where: { id: billId }, include: { lead: true } });
  const lead = bill.lead;
  const input: ScoreInput = {
    ownership: lead.ownership,
    roofType: lead.roofType,
    roofAreaSqft: lead.roofAreaSqft,
    monthlyBill: lead.monthlyBill,
    monthlyUnits: values.monthlyUnits,
    sanctionedLoadKw: values.sanctionedLoadKw,
    inServiceArea: inServiceArea(lead.pincode),
  };
  const s = scoreLead(input, await scoreSettings());
  const status: LeadStatus = s.nextAction === "SURVEY" ? "SURVEY" : "CALL_ONLY";

  await db.$transaction([
    db.bill.update({
      where: { id: billId },
      data: {
        ...values,
        billAmount: values.billAmount === null ? null : Math.round(values.billAmount),
        status: "CONFIRMED",
        verifiedById: staffId,
        verifiedAt: new Date(),
        reuploadReason: null,
      },
    }),
    db.lead.update({
      where: { id: lead.id },
      data: { status, score: s.score, scoreReasons: s.reasons, recommendedKw: s.recommendedKw },
    }),
  ]);
  return { status };
}

export async function requestReupload(billId: string, reason: string): Promise<void> {
  const bill = await db.bill.findUniqueOrThrow({ where: { id: billId }, select: { leadId: true } });
  await db.$transaction([
    db.bill.update({ where: { id: billId }, data: { status: "NEEDS_REUPLOAD", reuploadReason: reason } }),
    db.lead.update({ where: { id: bill.leadId }, data: { status: "REUPLOAD_REQUESTED" } }),
  ]);
}
