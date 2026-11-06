export const STAGES = [
  "ADVANCE_PAID",
  "MATERIALS_DISPATCHED",
  "INSTALLED",
  "NET_METER_APPLIED",
  "NET_METER_INSTALLED",
  "SUBSIDY_APPLIED",
  "SUBSIDY_CREDITED",
] as const;

export type Stage = (typeof STAGES)[number];

export const STAGE_INFO: Record<Stage, { label: string; customer: string; maxDays: number | null }> = {
  ADVANCE_PAID: { label: "Advance paid", customer: "We've received your advance. We're preparing your system.", maxDays: 7 },
  MATERIALS_DISPATCHED: { label: "Materials dispatched", customer: "Your panels and inverter are on the way.", maxDays: 7 },
  INSTALLED: { label: "Installed", customer: "Your system is installed. Next we apply for net metering.", maxDays: 5 },
  NET_METER_APPLIED: { label: "Net meter applied", customer: "We've applied to the electricity company for your net meter.", maxDays: 21 },
  NET_METER_INSTALLED: { label: "Net meter installed", customer: "Your net meter is in. Your system is now saving you money.", maxDays: 7 },
  SUBSIDY_APPLIED: { label: "Subsidy applied", customer: "We've filed your subsidy claim. Credit usually takes a few weeks.", maxDays: 45 },
  SUBSIDY_CREDITED: { label: "Subsidy credited", customer: "Your subsidy has been credited. Your project is complete!", maxDays: null },
};

export const stageIndex = (s: Stage) => STAGES.indexOf(s);

export function nextStage(s: Stage): Stage | null {
  const i = stageIndex(s);
  return i >= 0 && i < STAGES.length - 1 ? STAGES[i + 1] : null;
}

export function canMoveTo(from: Stage, to: Stage): boolean {
  return nextStage(from) === to;
}

export function daysInStage(since: Date, now: Date = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - since.getTime()) / 86_400_000));
}

export function isStuck(stage: Stage, since: Date, now: Date = new Date()): boolean {
  const max = STAGE_INFO[stage].maxDays;
  return max !== null && daysInStage(since, now) > max;
}

export function stageMessage(firstName: string, stage: Stage, statusUrl: string): string {
  return `Namaste ${firstName}, update on your solar project: ${STAGE_INFO[stage].customer} Track it here: ${statusUrl}`;
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}
