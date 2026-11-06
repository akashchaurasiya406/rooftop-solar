import type { Metadata } from "next";
import { Card, cx, inr } from "@/components/ui";
import { requireRole } from "@/lib/auth/server";
import { subsidySlabsSchema } from "@/lib/calc/quote";
import { findOverlaps, isEffectiveOn } from "@/lib/calc/rules";
import { db } from "@/lib/db";
import { PriceRuleForm, SubsidyRuleForm } from "./rule-forms";

export const metadata: Metadata = { title: "Rules" };

const d = (x: Date | null) => (x ? x.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "open");

function State({ from, to }: { from: Date; to: Date | null }) {
  const now = new Date();
  const label = isEffectiveOn({ effectiveFrom: from, effectiveTo: to }, now) ? "In effect" : from > now ? "Upcoming" : "Ended";
  return (
    <span
      className={cx(
        "rounded-full px-2 py-0.5 text-[12px] font-medium",
        label === "In effect" ? "bg-high-soft text-high" : label === "Upcoming" ? "bg-sun-soft text-[#8a4f0f]" : "bg-low-soft text-low",
      )}
    >
      {label}
    </span>
  );
}

export default async function RulesPage() {
  await requireRole("ADMIN");
  const [subsidy, prices, settings] = await Promise.all([
    db.subsidyRule.findMany({ orderBy: { effectiveFrom: "desc" } }),
    db.priceRule.findMany({ orderBy: [{ effectiveFrom: "desc" }, { minKw: "asc" }] }),
    db.calcSetting.findMany({ orderBy: { effectiveFrom: "desc" } }),
  ]);
  const overlaps = findOverlaps(subsidy);

  return (
    <>
      <div className="animate-rise">
        <h1 className="text-[1.75rem] font-semibold tracking-tight">Rules</h1>
        <p className="mt-1 max-w-2xl text-[15px] text-muted">
          Subsidy and prices change over time, so every rule has a start date. Rules are never edited: add a new one and the old one ends
          the day it starts. Each quote keeps a copy of the rules it used.
        </p>
      </div>

      {overlaps.length > 0 && (
        <p role="alert" className="mt-4 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {overlaps.length} subsidy rules overlap in time. The one that started most recently is used.
        </p>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <h2 className="border-b border-line px-5 py-3 font-semibold">Subsidy rules</h2>
            <ul className="divide-y divide-line">
              {subsidy.map((r) => {
                const slabs = subsidySlabsSchema.safeParse(r.slabs);
                return (
                  <li key={r.id} className="px-5 py-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{r.name}</span>
                      <State from={r.effectiveFrom} to={r.effectiveTo} />
                    </div>
                    <p className="num mt-1 text-muted">
                      {slabs.success
                        ? slabs.data.map((s, i) => `${i === 0 ? "up to" : "then up to"} ${s.uptoKw} kW: ${inr(s.perKw)}/kW`).join(" · ")
                        : "Invalid slabs"}{" "}
                      · cap {inr(r.capAmount)}
                    </p>
                    <p className="num mt-0.5 text-[13px] text-muted">
                      {d(r.effectiveFrom)} → {d(r.effectiveTo)}
                    </p>
                    {r.note && <p className="mt-1 text-[13px] text-muted">{r.note}</p>}
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card className="overflow-hidden">
            <h2 className="border-b border-line px-5 py-3 font-semibold">Installed prices</h2>
            <table className="num w-full text-left text-sm">
              <thead className="text-[13px] text-muted">
                <tr>
                  <th className="px-5 py-2 font-medium">Sizes</th>
                  <th className="px-3 py-2 font-medium">Price / kW</th>
                  <th className="px-3 py-2 font-medium">Dates</th>
                  <th className="px-5 py-2 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {prices.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-3">
                      {p.minKw}–{p.maxKw} kW
                    </td>
                    <td className="px-3 py-3">{inr(p.pricePerKw)}</td>
                    <td className="px-3 py-3 text-muted">
                      {d(p.effectiveFrom)} → {d(p.effectiveTo)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <State from={p.effectiveFrom} to={p.effectiveTo} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card className="p-5 text-sm">
            <h2 className="font-semibold">Calculation settings</h2>
            {settings.map((s) => (
              <p key={s.id} className="num mt-2 text-muted">
                {s.generationPerKwYear.toLocaleString("en-IN")} units per kW per year · ₹{s.tariffPerUnit}/unit saved · ₹{s.exportRatePerUnit}/unit
                exported · {s.sqftPerKw} sq ft per kW · from {d(s.effectiveFrom)}
              </p>
            ))}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="font-semibold">New subsidy rule</h2>
            <p className="mb-4 mt-1 text-[13px] text-muted">Check the official notice before adding.</p>
            <SubsidyRuleForm />
          </Card>
          <Card className="p-5">
            <h2 className="mb-4 font-semibold">New price</h2>
            <PriceRuleForm />
          </Card>
        </div>
      </div>
    </>
  );
}
