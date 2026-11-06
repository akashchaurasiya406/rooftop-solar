"use client";

import { useActionState, useMemo, useState } from "react";
import { Alert, Button, Card, cx, inr } from "@/components/ui";
import { bestValue, buildOptions, KW_STEP, MAX_KW, MIN_KW, snapKw, type QuoteRules } from "@/lib/quotes/options";
import { sendQuote, type StaffFormState } from "../../../actions";

export function QuoteBuilder({
  leadId,
  monthlyUnits,
  suggestedKw,
  roofMaxKw,
  rules,
}: {
  leadId: string;
  monthlyUnits: number;
  suggestedKw: number;
  roofMaxKw: number | null;
  rules: QuoteRules;
}) {
  const [kw, setKw] = useState(snapKw(suggestedKw));
  const [state, action, pending] = useActionState<StaffFormState, FormData>(sendQuote.bind(null, leadId), {});

  const result = useMemo(() => {
    try {
      return { ...buildOptions(kw, monthlyUnits, rules), error: null };
    } catch (e) {
      return { chosen: null, options: [], error: e instanceof Error ? e.message : "Cannot price this size." };
    }
  }, [kw, monthlyUnits, rules]);

  const best = bestValue(result.options);
  const c = result.chosen;
  const overRoof = roofMaxKw !== null && kw > roofMaxKw;
  const change = (d: number) => setKw((k) => snapKw(k + d));

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted">System size</p>
            <p className="num mt-1 text-4xl font-semibold tracking-tight">
              {kw} <span className="text-xl text-muted">kW</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => change(-KW_STEP)} disabled={kw <= MIN_KW} aria-label="Smaller system" className="size-12 px-0 text-xl">
              −
            </Button>
            <Button type="button" variant="secondary" onClick={() => change(KW_STEP)} disabled={kw >= MAX_KW} aria-label="Bigger system" className="size-12 px-0 text-xl">
              +
            </Button>
          </div>
        </div>
        <input
          type="range"
          min={MIN_KW}
          max={MAX_KW}
          step={KW_STEP}
          value={kw}
          onChange={(e) => setKw(snapKw(Number(e.target.value)))}
          aria-label="System size in kW"
          className="mt-5 w-full accent-[var(--color-brand)]"
        />
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
          <span>Suggested from bill: {suggestedKw} kW</span>
          <span>Uses {monthlyUnits} units/month</span>
          {roofMaxKw !== null && <span>Roof fits up to {roofMaxKw} kW</span>}
        </div>
        {overRoof && (
          <p className="mt-3 rounded-xl bg-medium-soft px-3 py-2 text-[13px] text-[#7a4510]">
            This is bigger than the roof area allows. Check the survey notes before sending.
          </p>
        )}

        {result.error ? (
          <div className="mt-5">
            <Alert>{result.error}</Alert>
          </div>
        ) : (
          <>
            <h2 className="mt-7 text-sm font-medium text-muted">Options the customer will see</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {result.options.map((o) => (
                <button
                  key={o.systemKw}
                  type="button"
                  onClick={() => setKw(o.systemKw)}
                  className={cx(
                    "relative rounded-xl border p-3.5 text-left transition-all duration-200 active:scale-[0.98]",
                    o.systemKw === kw ? "border-brand bg-brand-soft shadow-[0_0_0_1px_var(--color-brand)]" : "border-line bg-surface hover:border-ink/25",
                  )}
                >
                  {best === o.systemKw && (
                    <span className="absolute right-2.5 top-2.5 rounded-full bg-sun-soft px-2 py-0.5 text-[11px] font-medium text-[#8a4f0f]">Best payback</span>
                  )}
                  <p className="num font-semibold">{o.systemKw} kW</p>
                  <p className="num mt-1 text-sm">{inr(o.netCost)}</p>
                  <p className="num text-[13px] text-muted">{o.paybackYears === null ? "No payback" : `${o.paybackYears} yr payback`}</p>
                </button>
              ))}
            </div>
          </>
        )}
      </Card>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <Card className="overflow-hidden">
          {c && (
            <dl className="num divide-y divide-line text-sm">
              {[
                ["Installed price", `${inr(c.pricePerKw)}/kW`],
                ["Total cost", inr(c.grossCost)],
                ["Subsidy", `− ${inr(c.subsidy)}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between px-5 py-3">
                  <dt className="text-muted">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between bg-brand-soft/60 px-5 py-4">
                <dt className="font-medium text-brand">Customer pays</dt>
                <dd key={c.netCost} className="animate-pop text-2xl font-semibold tracking-tight">{inr(c.netCost)}</dd>
              </div>
              {[
                ["Units a year", c.annualGeneration.toLocaleString("en-IN")],
                ["Saves a year", inr(c.annualSavings)],
                ["Payback", c.paybackYears === null ? "—" : `${c.paybackYears} years`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between px-5 py-3">
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          )}
          <form action={action} className="space-y-3 border-t border-line p-5">
            <input type="hidden" name="kw" value={kw} />
            {state.error && <Alert>{state.error}</Alert>}
            <Button type="submit" pending={pending} disabled={!c} className="w-full">
              {pending ? "Sending…" : `Send ${kw} kW quote to customer`}
            </Button>
            <p className="text-center text-[12px] text-muted">Prices and subsidy from today&apos;s rule tables. Valid 15 days.</p>
          </form>
        </Card>
      </div>
    </div>
  );
}
