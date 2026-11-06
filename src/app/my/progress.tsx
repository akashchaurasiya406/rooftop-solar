import type { LeadStatus } from "@prisma/client";
import { cx } from "@/components/ui";

export const STEPS = ["Request received", "Bill checked", "Visit or call", "Quote ready", "Installation"];

export const HOMEOWNER_STATUS: Record<LeadStatus, { title: string; body: string; step: number; needsYou?: boolean }> = {
  NEW: { title: "We received your request", body: "We're reading your bill now.", step: 0 },
  BILL_REVIEW: { title: "We are checking your bill", body: "Our team is confirming the details we read from it.", step: 1 },
  REUPLOAD_REQUESTED: { title: "Please upload a clearer bill photo", body: "We couldn't read your bill well enough.", step: 1, needsYou: true },
  SURVEY: { title: "A surveyor will contact you", body: "They'll call to fix a time to check your roof.", step: 2 },
  CALL_ONLY: { title: "Our team will call you", body: "A short call to understand your needs before any visit.", step: 2 },
  QUOTED: { title: "Your quote is ready", body: "See your system size, subsidy and payback.", step: 3 },
  WON: { title: "Installation in progress", body: "We'll update you at every stage.", step: 4 },
  LOST: { title: "Request closed", body: "Contact us any time to restart.", step: -1 },
};

export function NeedsYouPill() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-sun-soft px-3 py-1 text-[13px] font-medium text-[#8a4f0f]">
      <span className="size-1.5 animate-pulse rounded-full bg-sun" /> Action needed from you
    </span>
  );
}

export function Progress({ step }: { step: number }) {
  if (step < 0) return null;
  const pct = (step / (STEPS.length - 1)) * 100;
  return (
    <div>
      <div
        className="relative h-1.5 rounded-full bg-line"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-valuenow={step + 1}
        aria-valuetext={STEPS[step]}
        aria-label="Progress"
      >
        <div
          className="absolute inset-y-0 left-0 origin-left animate-[grow_1s_var(--ease-out-soft)_0.3s_both] rounded-full bg-brand"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ol className="mt-3 grid grid-cols-5 gap-1 text-center text-[11px] leading-tight sm:text-xs">
        {STEPS.map((label, idx) => (
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
