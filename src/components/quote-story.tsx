import type { QuoteResult } from "@/lib/calc/quote";
import { Card, cx, inr, stagger } from "./ui";

export function QuoteStory({ q, label, className }: { q: QuoteResult; label?: string; className?: string }) {
  const paybackText = q.paybackYears === null ? "—" : `${q.paybackYears} years`;
  const steps = [
    { k: "System", v: `${q.systemKw} kW`, sub: `${q.annualGeneration.toLocaleString("en-IN")} units a year` },
    { k: "You pay", v: inr(q.netCost), sub: `after ${inr(q.subsidy)} subsidy` },
    { k: "Pays back in", v: paybackText, sub: `saves about ${inr(q.annualSavings)} a year` },
  ];
  return (
    <Card className={cx("overflow-hidden p-0", className)}>
      {label && (
        <div className="flex items-center justify-between border-b border-line px-5 py-3 text-[13px] text-muted">
          <span>{label}</span>
          <span className="rounded-full bg-sun-soft px-2 py-0.5 font-medium text-[#9a5a12]">Example</span>
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
