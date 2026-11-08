import { CodedError } from "@/lib/errors";
import "server-only";
import { db } from "@/lib/db";
import { isEffectiveOn } from "@/lib/calc/rules";

export class RuleError extends CodedError {}

export async function addSubsidyRule(rule: { name: string; slabs: { uptoKw: number; perKw: number }[]; capAmount: number; effectiveFrom: Date }) {
  const existing = await db.subsidyRule.findMany({ select: { id: true, effectiveFrom: true, effectiveTo: true } });
  if (existing.some((r) => r.effectiveFrom.getTime() >= rule.effectiveFrom.getTime())) {
    throw new RuleError("RULE_NOT_LATEST");
  }
  const toClose = existing.filter((r) => isEffectiveOn(r, rule.effectiveFrom) || (r.effectiveTo === null && r.effectiveFrom < rule.effectiveFrom));
  await db.$transaction([
    ...toClose.map((r) => db.subsidyRule.update({ where: { id: r.id }, data: { effectiveTo: rule.effectiveFrom } })),
    db.subsidyRule.create({ data: { ...rule, effectiveTo: null } }),
  ]);
}

export async function addPriceRule(rule: { minKw: number; maxKw: number; pricePerKw: number; effectiveFrom: Date }) {
  const overlapping = await db.priceRule.findMany({
    where: { minKw: { lte: rule.maxKw }, maxKw: { gte: rule.minKw } },
    select: { id: true, effectiveFrom: true, effectiveTo: true },
  });
  if (overlapping.some((r) => r.effectiveFrom.getTime() >= rule.effectiveFrom.getTime())) {
    throw new RuleError("PRICE_NOT_LATEST");
  }
  const toClose = overlapping.filter((r) => r.effectiveTo === null || r.effectiveTo > rule.effectiveFrom);
  await db.$transaction([
    ...toClose.map((r) => db.priceRule.update({ where: { id: r.id }, data: { effectiveTo: rule.effectiveFrom } })),
    db.priceRule.create({ data: { ...rule, effectiveTo: null } }),
  ]);
}
