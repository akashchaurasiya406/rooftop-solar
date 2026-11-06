"use client";

import { useActionState, useState } from "react";
import { keepValues } from "@/components/keep-values";
import { Alert, Button, Field, Input, inr } from "@/components/ui";
import { computeSubsidy } from "@/lib/calc/quote";
import { createPriceRule, createSubsidyRule, type RuleFormState } from "../actions";

const today = () => new Date(Date.now() + 5.5 * 3600_000 + 86_400_000).toISOString().slice(0, 10);

export function SubsidyRuleForm() {
  const [state, action, pending] = useActionState<RuleFormState, FormData>(createSubsidyRule, {});
  const fe = state.fieldErrors ?? {};
  const [v, setV] = useState({ slab1Upto: "2", slab1PerKw: "30000", slab2Upto: "3", slab2PerKw: "18000", capAmount: "78000" });
  const n = (s: string) => Number(s.replace(/[,\s₹]/g, ""));
  const slabs = [{ uptoKw: n(v.slab1Upto), perKw: n(v.slab1PerKw) }, ...(v.slab2Upto && v.slab2PerKw ? [{ uptoKw: n(v.slab2Upto), perKw: n(v.slab2PerKw) }] : [])];
  const valid = slabs.every((s) => s.uptoKw > 0 && s.perKw >= 0) && n(v.capAmount) >= 0;
  const preview = valid ? [1, 2, 3, 5].map((kw) => [kw, computeSubsidy(kw, { slabs, capAmount: n(v.capAmount) })] as const) : [];
  const bind = (k: keyof typeof v) => ({ value: v[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value }) });

  return (
    <form onSubmit={keepValues(action)} className="space-y-4">
      {state.ok && <Alert tone="info">{state.ok}</Alert>}
      {state.error && <Alert>{state.error}</Alert>}
      <Field label="Name" htmlFor="name" errors={fe.name}>
        <Input id="name" name="name" placeholder="e.g. Central residential scheme 2027" invalid={!!fe.name} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Slab 1 up to (kW)" htmlFor="slab1Upto" errors={fe.slab1Upto}>
          <Input id="slab1Upto" name="slab1Upto" inputMode="decimal" {...bind("slab1Upto")} />
        </Field>
        <Field label="₹ per kW" htmlFor="slab1PerKw" errors={fe.slab1PerKw}>
          <Input id="slab1PerKw" name="slab1PerKw" inputMode="numeric" {...bind("slab1PerKw")} />
        </Field>
        <Field label="Slab 2 up to (kW)" htmlFor="slab2Upto" errors={fe.slab2Upto} hint="Optional">
          <Input id="slab2Upto" name="slab2Upto" inputMode="decimal" {...bind("slab2Upto")} />
        </Field>
        <Field label="₹ per kW" htmlFor="slab2PerKw" errors={fe.slab2PerKw}>
          <Input id="slab2PerKw" name="slab2PerKw" inputMode="numeric" {...bind("slab2PerKw")} />
        </Field>
        <Field label="Cap (₹)" htmlFor="capAmount" errors={fe.capAmount}>
          <Input id="capAmount" name="capAmount" inputMode="numeric" {...bind("capAmount")} />
        </Field>
        <Field label="Starts on" htmlFor="effectiveFrom" errors={fe.effectiveFrom}>
          <Input id="effectiveFrom" name="effectiveFrom" type="date" defaultValue={today()} />
        </Field>
      </div>
      {preview.length > 0 && (
        <div className="rounded-xl bg-paper p-3 text-[13px]">
          <p className="text-muted">Preview subsidy</p>
          <p className="num mt-1">{preview.map(([kw, s]) => `${kw} kW → ${inr(s)}`).join("   ·   ")}</p>
        </div>
      )}
      <Button type="submit" pending={pending} className="w-full">
        Add subsidy rule
      </Button>
    </form>
  );
}

export function PriceRuleForm() {
  const [state, action, pending] = useActionState<RuleFormState, FormData>(createPriceRule, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form onSubmit={keepValues(action)} className="space-y-4">
      {state.ok && <Alert tone="info">{state.ok}</Alert>}
      {state.error && <Alert>{state.error}</Alert>}
      <div className="grid grid-cols-2 gap-3">
        <Field label="From (kW)" htmlFor="minKw" errors={fe.minKw}>
          <Input id="minKw" name="minKw" inputMode="decimal" defaultValue="3" />
        </Field>
        <Field label="To (kW)" htmlFor="maxKw" errors={fe.maxKw}>
          <Input id="maxKw" name="maxKw" inputMode="decimal" defaultValue="5.99" />
        </Field>
        <Field label="Price per kW (₹)" htmlFor="pricePerKw" errors={fe.pricePerKw}>
          <Input id="pricePerKw" name="pricePerKw" inputMode="numeric" placeholder="58000" />
        </Field>
        <Field label="Starts on" htmlFor="pEffectiveFrom" errors={fe.effectiveFrom}>
          <Input id="pEffectiveFrom" name="effectiveFrom" type="date" defaultValue={today()} />
        </Field>
      </div>
      <Button type="submit" variant="secondary" pending={pending} className="w-full">
        Add price
      </Button>
    </form>
  );
}
