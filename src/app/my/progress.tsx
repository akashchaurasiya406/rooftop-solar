import type { LeadStatus } from "@prisma/client";
import { cx } from "@/components/ui";
import type { Dict } from "@/lib/i18n";

const META: Record<LeadStatus, { step: number; needsYou?: boolean }> = {
  NEW: { step: 0 },
  BILL_REVIEW: { step: 1 },
  REUPLOAD_REQUESTED: { step: 1, needsYou: true },
  SURVEY: { step: 2 },
  CALL_ONLY: { step: 2 },
  QUOTED: { step: 3 },
  WON: { step: 4 },
  LOST: { step: -1 },
};

export function homeownerStatus(t: Dict, status: LeadStatus) {
  return { ...t.my.status[status], ...META[status] };
}

export function NeedsYouPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-sun-soft px-3 py-1 text-[13px] font-medium text-sun-ink">
      <span className="size-1.5 animate-pulse rounded-full bg-sun" /> {label}
    </span>
  );
}

export function Progress({ step, steps }: { step: number; steps: string[] }) {
  if (step < 0) return null;
  const pct = (step / (steps.length - 1)) * 100;
  return (
    <div>
      <div
        className="relative h-1.5 rounded-full bg-line"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-valuenow={step + 1}
        aria-valuetext={steps[step]}
      >
        <div className="absolute inset-y-0 left-0 origin-left animate-[grow_1s_var(--ease-out-soft)_0.3s_both] rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
      <ol className="mt-3 grid grid-cols-5 gap-1 text-center text-[11px] leading-tight sm:text-xs">
        {steps.map((label, idx) => (
          <li key={label} className={cx(idx <= step ? "font-medium text-ink" : "text-muted")}>
            <span
              aria-hidden
              className={cx(
                "mx-auto mb-1.5 block size-2.5 rounded-full border-2",
                idx < step && "border-brand bg-brand",
                idx === step && "border-brand bg-surface ring-4 ring-brand-soft",
                idx > step && "border-line-strong bg-surface",
              )}
            />
            {label}
          </li>
        ))}
      </ol>
    </div>
  );
}
