export interface Dated {
  effectiveFrom: Date;
  effectiveTo: Date | null;
}

export function isEffectiveOn(rule: Dated, on: Date): boolean {
  const t = on.getTime();
  if (rule.effectiveFrom.getTime() > t) return false;
  if (rule.effectiveTo && rule.effectiveTo.getTime() <= t) return false;
  return true;
}

export function pickEffective<T extends Dated>(rules: T[], on: Date): T | null {
  const valid = rules.filter((r) => isEffectiveOn(r, on));
  if (valid.length === 0) return null;
  return valid.reduce((latest, r) =>
    r.effectiveFrom.getTime() > latest.effectiveFrom.getTime() ? r : latest,
  );
}

export function findOverlaps<T extends Dated & { id: string }>(rules: T[]): [string, string][] {
  const end = (r: Dated) => r.effectiveTo?.getTime() ?? Number.POSITIVE_INFINITY;
  const out: [string, string][] = [];
  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const a = rules[i];
      const b = rules[j];
      if (a.effectiveFrom.getTime() < end(b) && b.effectiveFrom.getTime() < end(a)) {
        out.push([a.id, b.id]);
      }
    }
  }
  return out;
}
