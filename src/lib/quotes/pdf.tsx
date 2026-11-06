import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { QuoteResult } from "@/lib/calc/quote";
import { ADVANCE_PERCENT, advanceFor } from "./options";

const rs = (n: number) => `Rs. ${Math.round(n).toLocaleString("en-IN")}`;
const date = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const C = { ink: "#1c1b18", muted: "#6b6860", line: "#e7e5df", brand: "#1f5f45", soft: "#e8f1ec", sun: "#e9962e" };

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: C.ink, fontFamily: "Helvetica" },
  row: { flexDirection: "row" },
  between: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  brand: { fontSize: 16, fontFamily: "Helvetica-Bold", color: C.brand },
  muted: { color: C.muted },
  h2: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 8, marginTop: 22 },
  story: { flexDirection: "row", marginTop: 22, borderRadius: 6, backgroundColor: C.soft },
  storyCell: { flex: 1, padding: 14 },
  storyLabel: { fontSize: 9, color: C.brand },
  storyValue: { fontSize: 18, fontFamily: "Helvetica-Bold", marginTop: 4 },
  storySub: { fontSize: 8, color: C.muted, marginTop: 3 },
  th: { fontSize: 9, color: C.muted, paddingVertical: 6, borderBottom: `1 solid ${C.line}` },
  td: { paddingVertical: 7, borderBottom: `1 solid ${C.line}` },
  chosen: { fontFamily: "Helvetica-Bold" },
  line: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderBottom: `1 solid ${C.line}` },
  foot: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 8, color: C.muted, borderTop: `1 solid ${C.line}`, paddingTop: 8 },
});

const COLS = [
  { k: "System", w: 0.21 },
  { k: "Cost", w: 0.16 },
  { k: "Subsidy", w: 0.15 },
  { k: "You pay", w: 0.16 },
  { k: "Units / year", w: 0.16 },
  { k: "Payback", w: 0.16 },
];

export interface QuotePdfData {
  code: string;
  createdAt: Date;
  validUntil: Date;
  customer: { name: string; pincode: string; region: string | null };
  chosen: QuoteResult;
  options: QuoteResult[];
  subsidyRuleName: string;
  tariffPerUnit: number;
  generationPerKwYear: number;
  computedOn: Date;
}

function QuoteDoc({ q }: { q: QuotePdfData }) {
  const c = q.chosen;
  return (
    <Document title={`Solar quote ${q.code}`} author="Rooftop Solar">
      <Page size="A4" style={s.page}>
        <View style={s.between}>
          <View>
            <Text style={s.brand}>Rooftop Solar</Text>
            <Text style={[s.muted, { marginTop: 2 }]}>Rooftop solar across Vidarbha</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 12 }}>Quote {q.code}</Text>
            <Text style={[s.muted, { marginTop: 2 }]}>Issued {date(q.createdAt)}</Text>
            <Text style={s.muted}>Valid until {date(q.validUntil)}</Text>
          </View>
        </View>

        <Text style={{ marginTop: 22 }}>
          Prepared for <Text style={{ fontFamily: "Helvetica-Bold" }}>{q.customer.name}</Text>
          {q.customer.region ? `, ${q.customer.region}` : ""} ({q.customer.pincode})
        </Text>

        <View style={s.story}>
          <View style={s.storyCell}>
            <Text style={s.storyLabel}>YOUR SYSTEM</Text>
            <Text style={s.storyValue}>{c.systemKw} kW</Text>
            <Text style={s.storySub}>{c.annualGeneration.toLocaleString("en-IN")} units a year</Text>
          </View>
          <View style={s.storyCell}>
            <Text style={s.storyLabel}>YOU PAY</Text>
            <Text style={s.storyValue}>{rs(c.netCost)}</Text>
            <Text style={s.storySub}>after {rs(c.subsidy)} government subsidy</Text>
          </View>
          <View style={s.storyCell}>
            <Text style={s.storyLabel}>PAYS BACK IN</Text>
            <Text style={s.storyValue}>{c.paybackYears === null ? "—" : `${c.paybackYears} years`}</Text>
            <Text style={s.storySub}>saves about {rs(c.annualSavings)} a year</Text>
          </View>
        </View>

        <Text style={s.h2}>System options</Text>
        <View style={s.row}>
          {COLS.map((col) => (
            <Text key={col.k} style={[s.th, { width: `${col.w * 100}%` }]}>
              {col.k}
            </Text>
          ))}
        </View>
        {q.options.map((o) => {
          const cells = [
            `${o.systemKw} kW${o.systemKw === c.systemKw ? "  (quoted)" : ""}`,
            rs(o.grossCost),
            rs(o.subsidy),
            rs(o.netCost),
            o.annualGeneration.toLocaleString("en-IN"),
            o.paybackYears === null ? "—" : `${o.paybackYears} yrs`,
          ];
          return (
            <View key={o.systemKw} style={s.row}>
              {cells.map((v, i) => (
                <Text key={i} style={[s.td, { width: `${COLS[i].w * 100}%` }, o.systemKw === c.systemKw ? s.chosen : {}]}>
                  {v}
                </Text>
              ))}
            </View>
          );
        })}

        <Text style={s.h2}>How we worked it out ({c.systemKw} kW)</Text>
        {[
          ["Installed price", `${rs(c.pricePerKw)} per kW x ${c.systemKw} kW = ${rs(c.grossCost)}`],
          ["Government subsidy", `${rs(c.subsidy)} (${q.subsidyRuleName}, rules in effect on ${date(q.computedOn)})`],
          ["You pay", rs(c.netCost)],
          ["Electricity generated", `${q.generationPerKwYear.toLocaleString("en-IN")} units per kW per year = ${c.annualGeneration.toLocaleString("en-IN")} units`],
          ["Used at home", `${c.selfUsedUnits.toLocaleString("en-IN")} units x Rs. ${q.tariffPerUnit} saved per unit`],
          ["Exported to the grid", `${c.exportedUnits.toLocaleString("en-IN")} units (net metering)`],
          ["Yearly saving", rs(c.annualSavings)],
          ["Advance to book", `${rs(advanceFor(c.netCost))} (${ADVANCE_PERCENT * 100}% of what you pay)`],
        ].map(([k, v]) => (
          <View key={k} style={s.line}>
            <Text style={s.muted}>{k}</Text>
            <Text>{v}</Text>
          </View>
        ))}

        <Text style={[s.muted, { marginTop: 18, lineHeight: 1.5 }]}>
          The subsidy is paid by the government into your bank account after installation and net metering, as per the scheme rules on the
          date of this quote. Savings depend on your actual usage and tariff. Final system size is confirmed after the site survey.
        </Text>

        <Text style={s.foot}>
          Rooftop Solar · Demo project, all names and numbers are fictional · Quote {q.code}
        </Text>
      </Page>
    </Document>
  );
}

export function renderQuotePdf(q: QuotePdfData): Promise<Buffer> {
  return renderToBuffer(<QuoteDoc q={q} />);
}
