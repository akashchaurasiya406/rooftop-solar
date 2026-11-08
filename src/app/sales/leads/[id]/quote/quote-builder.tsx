"use client";

import { useActionState, useMemo, useState } from "react";
import { Alert, Button, Card, cx, inr } from "@/components/ui";
import type { en } from "@/lib/i18n/en";
import { fill } from "@/lib/i18n/format";
import { bestValue, buildOptions, KW_STEP, MAX_KW, MIN_KW, snapKw, type QuoteRules } from "@/lib/quotes/options";
import { sendQuote, type StaffFormState } from "../../../actions";

type BuilderText = typeof en.staff.builder;

export function QuoteBuilder({
  leadId,
  monthlyUnits,
  suggestedKw,
  roofMaxKw,
  rules,
  t,
}: {
  leadId: string;
  monthlyUnits: number;
  suggestedKw: number;
  roofMaxKw: number | null;
  rules: QuoteRules;
  t: BuilderText;
}) {
  const [kw, setKw] = useState(snapKw(suggestedKw));
  const [state, action, pending] = useActionState<StaffFormState, FormData>(sendQuote.bind(null, leadId), {});

  const result = useMemo(() => {
    try {
      return { ...buildOptions(kw, monthlyUnits, rules), error: null };
    } catch (e) {
      return { chosen: null, options: [], error: e instanceof Error ? e.message : "—" };
    }
  }, [kw, monthlyUnits, rules]);

  const best = bestValue(result.options);
  const c = result.chosen;
  const overRoof = roofMaxKw !== null && kw > roofMaxKw;
  const change = (d: number) => setKw((k) => snapKw(k + d));
  const pct = ((kw - MIN_KW) / (MAX_KW - MIN_KW)) * 100;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted">{t.size}</p>
            <p key={kw} className="num mt-1 animate-pop text-5xl font-semibold tracking-tight">
              {kw} <span className="text-xl text-muted">kW</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => change(-KW_STEP)} disabled={kw <= MIN_KW} aria-label={t.smaller} className="size-12 px-0 text-xl">
              −
            </Button>
            <Button type="button" variant="secondary" onClick={() => change(KW_STEP)} disabled={kw >= MAX_KW} aria-label={t.bigger} className="size-12 px-0 text-xl">
              +
            </Button>
          </div>
        </div>
        <div className="relative mt-6">
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-line">
            <div className="h-full rounded-full bg-gradient-to-r from-brand to-sun transition-[width] duration-300 ease-[var(--ease-out-soft)]" style={{ width: `${pct}%` }} />
          </div>
          <input
            type="range"
            min={MIN_KW}
            max={MAX_KW}
            step={KW_STEP}
            value={kw}
            onChange={(e) => setKw(snapKw(Number(e.target.value)))}
            aria-label={t.sizeLabel}
            className="relative w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:size-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-surface [&::-moz-range-thumb]:bg-brand [&::-webkit-slider-thumb]:size-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-surface [&::-webkit-slider-thumb]:bg-brand [&::-webkit-slider-thumb]:shadow-lift [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
          <span>{fill(t.suggested, { kw: suggestedKw })}</span>
          <span>{fill(t.uses, { n: monthlyUnits })}</span>
          {roofMaxKw !== null && <span>{fill(t.roofFits, { kw: roofMaxKw })}</span>}
        </div>
        {overRoof && <p className="mt-3 animate-pop rounded-xl bg-medium-soft px-3 py-2 text-[13px] text-sun-ink">{t.overRoof}</p>}

        {result.error ? (
          <div className="mt-5">
            <Alert>{result.error}</Alert>
          </div>
        ) : (
          <>
            <h2 className="mt-7 text-sm font-medium text-muted">{t.options}</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {result.options.map((o) => (
                <button
                  key={o.systemKw}
                  type="button"
                  onClick={() => setKw(o.systemKw)}
                  className={cx(
                    "relative rounded-xl border p-3.5 text-left transition-all duration-300 active:scale-[0.97]",
                    o.systemKw === kw ? "-translate-y-0.5 border-brand bg-brand-soft shadow-[0_0_0_1px_var(--color-brand)]" : "border-line bg-surface hover:-translate-y-0.5 hover:border-ink/25 hover:shadow-soft",
                  )}
                >
                  {best === o.systemKw && (
                    <span className="absolute right-2.5 top-2.5 animate-pop rounded-full bg-sun-soft px-2 py-0.5 text-[11px] font-medium text-sun-ink">{t.best}</span>
                  )}
                  <p className="num font-semibold">{o.systemKw} kW</p>
                  <p className="num mt-1 text-sm">{inr(o.netCost)}</p>
                  <p className="num text-[13px] text-muted">{o.paybackYears === null ? t.noPayback : fill(t.ydPayback, { n: o.paybackYears })}</p>
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
                [t.price, `${inr(c.pricePerKw)}/kW`],
                [t.total, inr(c.grossCost)],
                [t.subsidy, `− ${inr(c.subsidy)}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between px-5 py-3">
                  <dt className="text-muted">{k}</dt>
                  <dd key={v} className="animate-fade">
                    {v}
                  </dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between bg-brand-soft/60 px-5 py-4">
                <dt className="font-medium text-brand">{t.pays}</dt>
                <dd key={c.netCost} className="animate-pop text-2xl font-semibold tracking-tight">
                  {inr(c.netCost)}
                </dd>
              </div>
              {[
                [t.units, c.annualGeneration.toLocaleString("en-IN")],
                [t.saves, inr(c.annualSavings)],
                [t.payback, c.paybackYears === null ? "—" : `${c.paybackYears} ${t.years}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between px-5 py-3">
                  <dt className="text-muted">{k}</dt>
                  <dd key={v} className="animate-fade font-medium">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          <form action={action} className="space-y-3 border-t border-line p-5">
            <input type="hidden" name="kw" value={kw} />
            {state.error && <Alert>{state.error}</Alert>}
            <Button type="submit" pending={pending} disabled={!c} className="w-full">
              {pending ? t.sending : fill(t.send, { kw })}
            </Button>
            <p className="text-center text-[12px] text-muted">{t.note}</p>
          </form>
        </Card>
      </div>
    </div>
  );
}
