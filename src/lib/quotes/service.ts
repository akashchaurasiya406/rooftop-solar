import { CodedError } from "@/lib/errors";
import "server-only";
import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { canMoveTo, firstName, stageMessage, STAGE_INFO, type Stage } from "@/lib/projects/stages";
import { getEffectiveRules } from "@/lib/rules-repo";
import { advanceFor, buildOptions, snapKw, validUntil } from "./options";

export class QuoteFlowError extends CodedError {}

export async function confirmedUnits(leadId: string): Promise<number | null> {
  const bill = await db.bill.findFirst({
    where: { leadId, status: "CONFIRMED" },
    orderBy: { createdAt: "desc" },
    select: { monthlyUnits: true },
  });
  return bill?.monthlyUnits ?? null;
}

async function nextCode(prefix: "QT"): Promise<string> {
  const rows = await db.$queryRaw<{ max: number | null }[]>`
    SELECT MAX(CAST(SUBSTRING(code FROM 4) AS INTEGER)) AS max FROM "Quote" WHERE code ~ '^QT-[0-9]+$'`;
  return `${prefix}-${(rows[0]?.max ?? 50000) + 1}`;
}

export async function createQuote(leadId: string, staffId: string, kw: number, on: Date = new Date()) {
  const lead = await db.lead.findUnique({ where: { id: leadId }, select: { id: true, status: true, ownership: true } });
  if (!lead) throw new QuoteFlowError("LEAD_NOT_FOUND");
  if (lead.status === "WON") throw new QuoteFlowError("ALREADY_WON");
  if (lead.ownership === "TENANT") throw new QuoteFlowError("TENANT");
  const units = await confirmedUnits(leadId);
  if (units === null) throw new QuoteFlowError("NOT_CONFIRMED");

  const rules = await getEffectiveRules(on);
  const { chosen, options } = buildOptions(snapKw(kw), units, rules);

  const snapshot = {
    computedOn: on.toISOString(),
    inputs: { monthlyUnits: units, systemKw: chosen.systemKw },
    subsidyRule: { id: rules.subsidy.id, name: rules.subsidy.name, slabs: rules.subsidy.slabs, capAmount: rules.subsidy.capAmount },
    priceBands: rules.bands,
    setting: rules.setting,
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const quote = await db.quote.create({
        data: {
          code: await nextCode("QT"),
          leadId,
          createdById: staffId,
          status: "SENT",
          sentAt: on,
          validUntil: validUntil(on),
          systemKw: chosen.systemKw,
          grossCost: chosen.grossCost,
          subsidy: chosen.subsidy,
          netCost: chosen.netCost,
          annualGeneration: chosen.annualGeneration,
          annualSavings: chosen.annualSavings,
          paybackYears: chosen.paybackYears,
          options: options as unknown as Prisma.InputJsonValue,
          snapshot: snapshot as unknown as Prisma.InputJsonValue,
        },
        select: { id: true, code: true },
      });
      await db.lead.update({ where: { id: leadId }, data: { status: "QUOTED", recommendedKw: chosen.systemKw } });
      return quote;
    } catch (e) {
      const clash = e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
      if (!clash || attempt === 2) throw e;
    }
  }
  throw new QuoteFlowError("SAVE_FAILED");
}

export function newStatusToken(): string {
  return randomBytes(24).toString("base64url");
}

async function notify(projectId: string, to: string, body: string) {
  await db.notification.create({ data: { projectId, channel: "WHATSAPP", to, body } });
}

export async function acceptQuote(quoteId: string, homeownerId: string, baseUrl: string, now: Date = new Date()) {
  const quote = await db.quote.findUnique({
    where: { id: quoteId },
    include: { lead: { select: { id: true, name: true, phone: true, homeownerId: true, status: true } } },
  });
  if (!quote || quote.lead.homeownerId !== homeownerId) throw new QuoteFlowError("QUOTE_NOT_FOUND");
  if (quote.status !== "SENT") throw new QuoteFlowError("QUOTE_CLOSED");
  if (quote.validUntil < now) throw new QuoteFlowError("QUOTE_EXPIRED");

  const latest = await db.quote.findFirst({ where: { leadId: quote.leadId }, orderBy: { createdAt: "desc" }, select: { id: true } });
  if (latest?.id !== quote.id) throw new QuoteFlowError("QUOTE_OUTDATED");

  const token = newStatusToken();
  const project = await db.project.create({
    data: {
      leadId: quote.leadId,
      quoteId: quote.id,
      stage: "ADVANCE_PAID",
      advanceAmount: advanceFor(quote.netCost),
      statusToken: token,
      stageUpdated: now,
      events: { create: { stage: "ADVANCE_PAID", note: "Advance received (test payment)", byId: homeownerId, at: now } },
      notifications: {
        create: {
          channel: "WHATSAPP",
          to: quote.lead.phone,
          body: stageMessage(firstName(quote.lead.name), "ADVANCE_PAID", `${baseUrl}/status/${token}`),
        },
      },
    },
    select: { id: true, statusToken: true },
  });
  await db.$transaction([
    db.quote.update({ where: { id: quote.id }, data: { status: "ACCEPTED", acceptedAt: now } }),
    db.quote.updateMany({ where: { leadId: quote.leadId, status: "SENT", id: { not: quote.id } }, data: { status: "DECLINED" } }),
    db.lead.update({ where: { id: quote.leadId }, data: { status: "WON" } }),
  ]);
  return project;
}

export async function advanceProject(projectId: string, staffId: string, to: Stage, note: string | null, baseUrl: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { lead: { select: { name: true, phone: true } } },
  });
  if (!project) throw new QuoteFlowError("PROJECT_NOT_FOUND");
  if (!canMoveTo(project.stage, to)) {
    throw new QuoteFlowError("BAD_MOVE", `Can't move from ${STAGE_INFO[project.stage].label} to ${STAGE_INFO[to].label}.`);
  }

  const now = new Date();
  const moved = await db.project.updateMany({
    where: { id: projectId, stage: project.stage },
    data: { stage: to, stageUpdated: now },
  });
  if (moved.count === 0) throw new QuoteFlowError("CONFLICT");

  await db.projectEvent.create({ data: { projectId, stage: to, note, byId: staffId, at: now } });
  await notify(projectId, project.lead.phone, stageMessage(firstName(project.lead.name), to, `${baseUrl}/status/${project.statusToken}`));
}
