"use client";

import { useActionState, useState, useTransition } from "react";
import { keepValues } from "@/components/keep-values";
import { Alert, Button, cx, Field, Input } from "@/components/ui";
import type { ExtractedField } from "@/lib/ai/extraction";
import { askForNewPhoto, confirmBill, readAgain, type StaffFormState } from "../../actions";

export interface ReviewValues {
  consumerNumber: string;
  tariffCategory: string;
  sanctionedLoadKw: string;
  monthlyUnits: string;
  billAmount: string;
}

function Confidence({ value, flagged }: { value: number | null; flagged: boolean }) {
  if (value === null) return <span className="text-[12px] text-muted">entered by hand</span>;
  const pct = Math.round(value * 100);
  return (
    <span
      className={cx(
        "num inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium",
        flagged ? "bg-medium-soft text-medium" : "bg-high-soft text-high",
      )}
      title="How sure the AI is about this value"
    >
      {flagged ? "Check" : "AI"} {pct}%
    </span>
  );
}

const FIELDS: { key: ExtractedField; label: string; inputMode?: "numeric" | "decimal"; suffix?: string }[] = [
  { key: "monthlyUnits", label: "Units this month", inputMode: "numeric", suffix: "kWh" },
  { key: "sanctionedLoadKw", label: "Sanctioned load", inputMode: "decimal", suffix: "kW" },
  { key: "consumerNumber", label: "Consumer number", inputMode: "numeric" },
  { key: "tariffCategory", label: "Tariff" },
  { key: "billAmount", label: "Bill amount", inputMode: "numeric", suffix: "₹" },
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
}: {
  leadId: string;
  billId: string;
  initial: ReviewValues;
  confidence: Partial<Record<ExtractedField, number>>;
  needsCheck: ExtractedField[];
  confirmed: boolean;
  aiFailed: boolean;
  canReadAgain: boolean;
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
          The AI couldn&apos;t read this bill. Enter the values from the image by hand
          {canReadAgain && (
            <>
              {" "}or{" "}
              <button
                type="button"
                disabled={readingAgain}
                onClick={() => startReading(async () => setAgain(await readAgain(leadId, billId)))}
                className="font-semibold underline underline-offset-2"
              >
                {readingAgain ? "reading…" : "try the AI again"}
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
        {FIELDS.map((f) => {
          const flagged = needsCheck.includes(f.key);
          return (
            <div key={f.key} className={cx("rounded-xl transition-colors", flagged && !confirmed && "-mx-2 bg-medium-soft/50 px-2 py-2")}>
              <Field label={f.label} htmlFor={f.key} errors={fe[f.key]}>
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
                    <Confidence value={confidence[f.key] ?? null} flagged={flagged} />
                  </span>
                </div>
              </Field>
            </div>
          );
        })}

        <Button type="submit" pending={pending} className="w-full">
          {pending ? "Saving…" : confirmed ? "Update values" : "Confirm values & route lead"}
        </Button>
      </form>

      <div className="border-t border-line pt-4">
        {!showReupload ? (
          <button type="button" onClick={() => setShowReupload(true)} className="text-sm font-medium text-muted underline-offset-4 hover:text-ink hover:underline">
            Photo unclear? Ask the homeowner for a new one
          </button>
        ) : (
          <form onSubmit={keepValues(reAction)} className="animate-rise space-y-3">
            {reState.ok && <Alert tone="info">{reState.ok}</Alert>}
            <Field label="What should they fix?" htmlFor="reason" errors={reState.fieldErrors?.reason}>
              <Input id="reason" name="reason" defaultValue="The units used are not readable. Please take a photo of the whole bill in good light." />
            </Field>
            <div className="flex gap-2">
              <Button type="submit" variant="secondary" pending={rePending}>
                Send request
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowReupload(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
