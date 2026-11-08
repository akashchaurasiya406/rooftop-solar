"use client";

import { useActionState, useState, useTransition } from "react";
import { keepValues } from "@/components/keep-values";
import { Alert, Button, cx, Field, Input } from "@/components/ui";
import type { ExtractedField } from "@/lib/ai/extraction";
import type { en } from "@/lib/i18n/en";
import { askForNewPhoto, confirmBill, readAgain, type StaffFormState } from "../../actions";

type ReviewText = typeof en.staff.review;

export interface ReviewValues {
  consumerNumber: string;
  tariffCategory: string;
  sanctionedLoadKw: string;
  monthlyUnits: string;
  billAmount: string;
}

function Confidence({ value, flagged, t }: { value: number | null; flagged: boolean; t: ReviewText }) {
  if (value === null) return <span className="text-[12px] text-muted">{t.byHand}</span>;
  const pct = Math.round(value * 100);
  return (
    <span
      className={cx(
        "num inline-flex animate-pop items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium",
        flagged ? "bg-medium-soft text-medium" : "bg-high-soft text-high",
      )}
      title={t.confidenceTip}
    >
      {flagged ? t.check : t.ai} {pct}%
    </span>
  );
}

const FIELDS: { key: ExtractedField; inputMode?: "numeric" | "decimal"; suffix?: string }[] = [
  { key: "monthlyUnits", inputMode: "numeric", suffix: "kWh" },
  { key: "sanctionedLoadKw", inputMode: "decimal", suffix: "kW" },
  { key: "consumerNumber", inputMode: "numeric" },
  { key: "tariffCategory" },
  { key: "billAmount", inputMode: "numeric", suffix: "₹" },
];

export function BillReview({
  leadId,
  billId,
  initial,
  confidence,
  needsCheck,
  confirmed,
  aiFailed,
  canReadAgain,
  t,
}: {
  leadId: string;
  billId: string;
  initial: ReviewValues;
  confidence: Partial<Record<ExtractedField, number>>;
  needsCheck: ExtractedField[];
  confirmed: boolean;
  aiFailed: boolean;
  canReadAgain: boolean;
  t: ReviewText;
}) {
  const [state, formAction, pending] = useActionState<StaffFormState, FormData>(confirmBill.bind(null, leadId, billId), {});
  const [reState, reAction, rePending] = useActionState<StaffFormState, FormData>(askForNewPhoto.bind(null, leadId, billId), {});
  const [again, setAgain] = useState<StaffFormState>({});
  const [readingAgain, startReading] = useTransition();
  const [showReupload, setShowReupload] = useState(false);
  const fe = state.fieldErrors ?? {};

  return (
    <div className="space-y-4">
      {aiFailed && (
        <Alert tone="danger">
          {t.aiFailedA}
          {canReadAgain && (
            <>
              {" "}
              {t.aiFailedOr}{" "}
              <button
                type="button"
                disabled={readingAgain}
                onClick={() => startReading(async () => setAgain(await readAgain(leadId, billId)))}
                className="font-semibold underline underline-offset-2"
              >
                {readingAgain ? t.reading : t.tryAgain}
              </button>
            </>
          )}
          .
        </Alert>
      )}
      {again.error && <Alert>{again.error}</Alert>}
      {again.ok && <Alert tone="info">{again.ok}</Alert>}
      {state.ok && <Alert tone="info">{state.ok}</Alert>}
      {state.error && <Alert>{state.error}</Alert>}

      <form onSubmit={keepValues(formAction)} className="space-y-4" noValidate>
        {FIELDS.map((f, i) => {
          const flagged = needsCheck.includes(f.key);
          return (
            <div
              key={f.key}
              className={cx("animate-[rise_0.5s_var(--ease-out-soft)_both] rounded-xl transition-colors", flagged && !confirmed && "-mx-2 bg-medium-soft/50 px-2 py-2")}
              style={{ animationDelay: `${150 + i * 70}ms` }}
            >
              <Field label={t.fields[f.key]} htmlFor={f.key} errors={fe[f.key]}>
                <div className="relative">
                  <Input
                    id={f.key}
                    name={f.key}
                    inputMode={f.inputMode}
                    defaultValue={initial[f.key]}
                    invalid={!!fe[f.key]}
                    className={cx("num pr-28", f.key === "monthlyUnits" && "text-lg font-semibold")}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center gap-2">
                    {f.suffix && <span className="text-[13px] text-muted">{f.suffix}</span>}
                    <Confidence value={confidence[f.key] ?? null} flagged={flagged} t={t} />
                  </span>
                </div>
              </Field>
            </div>
          );
        })}

        <Button type="submit" pending={pending} className="w-full">
          {pending ? t.saving : confirmed ? t.update : t.confirm}
        </Button>
      </form>

      <div className="border-t border-line pt-4">
        {!showReupload ? (
          <button type="button" onClick={() => setShowReupload(true)} className="text-sm font-medium text-muted underline-offset-4 hover:text-ink hover:underline">
            {t.unclear}
          </button>
        ) : (
          <form onSubmit={keepValues(reAction)} className="animate-rise space-y-3">
            {reState.ok && <Alert tone="info">{reState.ok}</Alert>}
            <Field label={t.fix} htmlFor="reason" errors={reState.fieldErrors?.reason}>
              <Input id="reason" name="reason" defaultValue={t.fixDefault} />
            </Field>
            <div className="flex gap-2">
              <Button type="submit" variant="secondary" pending={rePending}>
                {t.send}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowReupload(false)}>
                {t.cancel}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
