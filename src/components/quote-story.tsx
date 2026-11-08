import type { QuoteResult } from "@/lib/calc/quote";
import { en } from "@/lib/i18n/en";
import { Card, cx, inr, stagger } from "./ui";

type QuoteText = typeof en.quote;

export function QuoteStory({
  q,
  label,
  exampleLabel,
  text = en.quote,
  className,
}: {
  q: QuoteResult;
  label?: string;
  exampleLabel?: string;
  text?: QuoteText;
  className?: string;
}) {
  const t = text;
  const join = (...parts: string[]) => parts.filter(Boolean).join(" ");
  const paybackText = q.paybackYears === null ? "—" : join(String(q.paybackYears), t.years);
  const steps = [
    { k: t.system, v: `${q.systemKw} kW`, sub: join(q.annualGeneration.toLocaleString("en-IN"), t.unitsYear) },
    { k: t.youPay, v: inr(q.netCost), sub: join(t.after, inr(q.subsidy), t.subsidy) },
    { k: t.paysBack, v: paybackText, sub: join(t.saves, inr(q.annualSavings), t.aYear) },
  ];
  return (
    <Card className={cx("overflow-hidden p-0", className)}>
      {label && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3 text-[13px] text-muted">
          <span>{label}</span>
          <span className="shrink-0 rounded-full bg-sun-soft px-2 py-0.5 font-medium text-sun-ink">{exampleLabel ?? t.example}</span>
        </div>
      )}
      <ol className="stagger divide-y divide-line">
        {steps.map((s, i) => (
          <li key={s.k} style={stagger(i + 2)} className="flex items-baseline justify-between gap-4 px-5 py-4">
            <span className="text-sm text-muted">{s.k}</span>
            <span className="text-right">
              <span className="num block text-xl font-semibold tracking-tight">{s.v}</span>
              <span className="num block text-[13px] text-muted">{s.sub}</span>
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
