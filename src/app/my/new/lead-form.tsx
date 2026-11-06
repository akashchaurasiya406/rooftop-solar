"use client";

import { startTransition, useActionState, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { BillPicker } from "@/components/bill-picker";
import { Alert, Button, cx, Field, Input } from "@/components/ui";
import { submitLead, type LeadFormState } from "../actions";

function Choice({
  name,
  options,
  value,
  onChange,
  invalid,
}: {
  name: string;
  options: { value: string; label: string; hint?: string; icon?: ReactNode }[];
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
}) {
  return (
    <div className={cx("grid gap-2", "grid-cols-2")}>
      {options.map((o, i) => {
        const checked = value === o.value;
        return (
          <label
            key={o.value}
            className={cx(
              "relative flex min-h-14 cursor-pointer select-none flex-col justify-center rounded-xl border px-3.5 py-2.5 transition-all duration-200 active:scale-[0.98]",
              checked ? "border-brand bg-brand-soft shadow-[0_0_0_1px_var(--color-brand)]" : invalid ? "border-danger/60 bg-surface" : "border-line-strong bg-surface hover:border-ink/30",
            )}
          >
            <input type="radio" id={i === 0 ? name : undefined} name={name} value={o.value} checked={checked} onChange={() => onChange(o.value)} className="sr-only" />
            <span className="flex items-center gap-2 text-[15px] font-medium">
              {o.icon}
              {o.label}
            </span>
            {o.hint && <span className="text-[13px] text-muted">{o.hint}</span>}
            {checked && (
              <span aria-hidden className="absolute right-2.5 top-2.5 inline-flex size-5 animate-pop items-center justify-center rounded-full bg-brand text-white">
                <svg viewBox="0 0 20 20" className="size-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 10.5 8.5 14 15 6.5" />
                </svg>
              </span>
            )}
          </label>
        );
      })}
    </div>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="animate-rise" style={{ animationDelay: `${n * 70}ms` }}>
      <h2 className="mb-3 flex items-center gap-2.5 text-[15px] font-semibold">
        <span className="num inline-flex size-6 items-center justify-center rounded-full bg-ink text-xs text-white">{n}</span>
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function LeadForm() {
  const [state, formAction, pending] = useActionState<LeadFormState, FormData>(submitLead, {});
  const v = state.values ?? {};
  const [edited, setEdited] = useState<Set<string>>(new Set());
  useEffect(() => setEdited(new Set()), [state]);
  const markEdited = (name: string) => name && setEdited((prev) => (prev.has(name) ? prev : new Set(prev).add(name)));
  const fe = Object.fromEntries(Object.entries(state.fieldErrors ?? {}).filter(([k]) => !edited.has(k)));
  const [ownership, setOwnership] = useState(v.ownership ?? "");
  const [roofType, setRoofType] = useState(v.roofType ?? "");
  const [file, setFile] = useState<File | null>(null);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.delete("bill");
    if (file) fd.set("bill", file);
    startTransition(() => formAction(fd));
  };

  return (
    <form onSubmit={onSubmit} onChange={(e) => markEdited((e.target as unknown as HTMLInputElement).name)} noValidate className="space-y-9">
      {state.error && <Alert>{state.error}</Alert>}

      <Section n={1} title="Your home">
        <Field label="Do you own this house?" htmlFor="ownership" errors={fe.ownership}>
          <Choice
            name="ownership"
            value={ownership}
            onChange={setOwnership}
            invalid={!!fe.ownership}
            options={[
              { value: "OWNER", label: "I own it" },
              { value: "TENANT", label: "I rent it" },
            ]}
          />
        </Field>
        <Field label="Roof type" htmlFor="roofType" errors={fe.roofType}>
          <Choice
            name="roofType"
            value={roofType}
            onChange={setRoofType}
            invalid={!!fe.roofType}
            options={[
              { value: "RCC", label: "Concrete", hint: "Flat RCC slab" },
              { value: "METAL_SHEET", label: "Metal sheet", hint: "Tin / GI sheet" },
              { value: "ASBESTOS", label: "Asbestos", hint: "Cement sheet" },
              { value: "OTHER", label: "Other", hint: "Tiles, mixed" },
            ]}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Roof area (sq ft)" htmlFor="roofAreaSqft" errors={fe.roofAreaSqft} hint="Open, shade-free part">
            <Input id="roofAreaSqft" name="roofAreaSqft" inputMode="numeric" placeholder="e.g. 400" defaultValue={v.roofAreaSqft} invalid={!!fe.roofAreaSqft} />
          </Field>
          <Field label="Pincode" htmlFor="pincode" errors={fe.pincode}>
            <Input id="pincode" name="pincode" inputMode="numeric" maxLength={6} autoComplete="postal-code" placeholder="440022" defaultValue={v.pincode} invalid={!!fe.pincode} />
          </Field>
        </div>
      </Section>

      <Section n={2} title="Your electricity bill">
        <Field label="Usual monthly bill (₹)" htmlFor="monthlyBill" errors={fe.monthlyBill} hint="A rough figure is fine — we'll read the exact one from your bill.">
          <Input id="monthlyBill" name="monthlyBill" inputMode="numeric" placeholder="e.g. 2500" defaultValue={v.monthlyBill} invalid={!!fe.monthlyBill} />
        </Field>
        <div className="space-y-1.5">
          <span className="block text-sm font-medium">Photo of your latest bill</span>
          <BillPicker
            file={file}
            onChange={(f) => {
              setFile(f);
              markEdited("bill");
            }}
            error={fe.bill?.[0]}
          />
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-4 border-t border-line bg-paper/90 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <Button type="submit" pending={pending} className="w-full min-h-12 text-base">
          {pending ? "Reading your bill…" : "Check my home"}
        </Button>
        <p className="mt-2 text-center text-[13px] text-muted">
          {pending ? "This takes about 10 seconds." : "Your bill is only seen by our team. We never share it."}
        </p>
      </div>
    </form>
  );
}
