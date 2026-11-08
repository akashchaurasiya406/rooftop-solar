import type { Metadata } from "next";
import { Card, cx, inr } from "@/components/ui";
import { requireRole } from "@/lib/auth/server";
import { subsidySlabsSchema } from "@/lib/calc/quote";
import { findOverlaps, isEffectiveOn } from "@/lib/calc/rules";
import { db } from "@/lib/db";
import { dateLocale, getDict } from "@/lib/i18n";
import { fill } from "@/lib/i18n/format";
import { CalcSettingForm, PriceRuleForm, SubsidyRuleForm } from "./rule-forms";

export const metadata: Metadata = { title: "Rules" };

function State({ from, to, labels }: { from: Date; to: Date | null; labels: { inEffect: string; upcoming: string; ended: string } }) {
  const now = new Date();
  const kind = isEffectiveOn({ effectiveFrom: from, effectiveTo: to }, now) ? "live" : from > now ? "upcoming" : "ended";
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] font-medium",
        kind === "live" ? "bg-high-soft text-high" : kind === "upcoming" ? "bg-sun-soft text-sun-ink" : "bg-low-soft text-low",
      )}
    >
      {kind === "live" && (
        <span className="relative flex size-1.5">
          <span className="absolute inset-0 animate-ping rounded-full bg-high opacity-70" />
          <span className="relative size-1.5 rounded-full bg-high" />
        </span>
      )}
      {kind === "live" ? labels.inEffect : kind === "upcoming" ? labels.upcoming : labels.ended}
    </span>
  );
}

export default async function RulesPage() {
  const [, { lang, t }] = await Promise.all([requireRole("ADMIN"), getDict()]);
  const R = t.staff.rules;
  const d = (x: Date | null) => (x ? x.toLocaleDateString(dateLocale(lang), { day: "numeric", month: "short", year: "numeric" }) : R.open);
  const [subsidy, prices, settings] = await Promise.all([
    db.subsidyRule.findMany({ orderBy: { effectiveFrom: "desc" } }),
    db.priceRule.findMany({ orderBy: [{ effectiveFrom: "desc" }, { minKw: "asc" }] }),
    db.calcSetting.findMany({ orderBy: { effectiveFrom: "desc" } }),
  ]);
  const overlaps = findOverlaps(subsidy);

  return (
    <>
      <div className="animate-rise">
        <h1 className="text-[2rem] font-semibold tracking-tight">{R.title}</h1>
        <p className="mt-1 max-w-2xl text-[15px] text-muted">{R.sub}</p>
      </div>

      {overlaps.length > 0 && (
        <p role="alert" className="mt-4 animate-pop rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {fill(R.overlaps, { n: overlaps.length })}
        </p>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Card className="animate-[rise_0.6s_var(--ease-out-soft)_0.05s_both] overflow-hidden">
            <h2 className="border-b border-line px-5 py-3 font-semibold">{R.subsidy}</h2>
            <ul className="divide-y divide-line">
              {subsidy.map((r, i) => {
                const slabs = subsidySlabsSchema.safeParse(r.slabs);
                return (
                  <li
                    key={r.id}
                    className="animate-[rise_0.5s_var(--ease-out-soft)_both] px-5 py-4 text-sm transition-colors hover:bg-paper"
                    style={{ animationDelay: `${200 + i * 90}ms` }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{r.name}</span>
                      <State from={r.effectiveFrom} to={r.effectiveTo} labels={R} />
                    </div>
                    <p className="num mt-1 text-muted">
                      {slabs.success
                        ? slabs.data.map((s, j) => fill(j === 0 ? R.upto : R.thenUpto, { kw: s.uptoKw, amt: inr(s.perKw) })).join(" · ")
                        : R.invalid}{" "}
                      · {R.cap} {inr(r.capAmount)}
                    </p>
                    <p className="num mt-0.5 text-[13px] text-muted">
                      {d(r.effectiveFrom)} → {d(r.effectiveTo)}
                    </p>
                    {r.note && lang === "en" && <p className="mt-1 text-[13px] text-muted">{r.note}</p>}
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card className="animate-[rise_0.6s_var(--ease-out-soft)_0.1s_both] overflow-hidden">
            <h2 className="border-b border-line px-5 py-3 font-semibold">{R.prices}</h2>
            <table className="num w-full text-left text-sm">
              <thead className="text-[13px] text-muted">
                <tr>
                  <th className="px-5 py-2 font-medium">{R.sizes}</th>
                  <th className="px-3 py-2 font-medium">{R.perKw}</th>
                  <th className="px-3 py-2 font-medium">{R.dates}</th>
                  <th className="px-5 py-2 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {prices.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-paper">
                    <td className="px-5 py-3">
                      {p.minKw}–{p.maxKw} kW
                    </td>
                    <td className="px-3 py-3">{inr(p.pricePerKw)}</td>
                    <td className="px-3 py-3 text-muted">
                      {d(p.effectiveFrom)} → {d(p.effectiveTo)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <State from={p.effectiveFrom} to={p.effectiveTo} labels={R} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card className="animate-[rise_0.6s_var(--ease-out-soft)_0.15s_both] p-5 text-sm">
            <h2 className="font-semibold">{R.settings}</h2>
            {settings.map((s) => (
              <p key={s.id} className="num mt-2 flex flex-wrap items-center gap-2 text-muted">
                <State from={s.effectiveFrom} to={s.effectiveTo} labels={R} />
                {fill(R.settingLine, {
                  gen: s.generationPerKwYear.toLocaleString("en-IN"),
                  tariff: s.tariffPerUnit,
                  export: s.exportRatePerUnit,
                  sqft: s.sqftPerKw,
                  date: d(s.effectiveFrom),
                })}
              </p>
            ))}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="animate-[rise_0.6s_var(--ease-out-soft)_0.1s_both] p-5">
            <h2 className="font-semibold">{R.newSubsidy}</h2>
            <p className="mb-4 mt-1 text-[13px] text-muted">{R.checkNotice}</p>
            <SubsidyRuleForm t={R} />
          </Card>
          <Card className="animate-[rise_0.6s_var(--ease-out-soft)_0.2s_both] p-5">
            <h2 className="mb-4 font-semibold">{R.newPrice}</h2>
            <PriceRuleForm t={R} />
          </Card>
          <Card className="animate-[rise_0.6s_var(--ease-out-soft)_0.25s_both] p-5">
            <h2 className="font-semibold">{R.newSetting}</h2>
            <p className="mb-4 mt-1 text-[13px] text-muted">{R.settingHint}</p>
            <CalcSettingForm
              t={R}
              current={{
                gen: settings[0]?.generationPerKwYear ?? 1400,
                tariff: settings[0]?.tariffPerUnit ?? 9.4,
                exportRate: settings[0]?.exportRatePerUnit ?? 3.5,
                sqft: settings[0]?.sqftPerKw ?? 100,
              }}
            />
          </Card>
        </div>
      </div>
    </>
  );
}
