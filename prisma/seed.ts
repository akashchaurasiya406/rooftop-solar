import { Prisma, PrismaClient, type LeadStatus } from "@prisma/client";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { scoreLead } from "../src/lib/calc/scoring";
import { STAGES, STAGE_INFO, firstName, stageMessage, type Stage } from "../src/lib/projects/stages";
import { advanceFor, buildOptions, validUntil } from "../src/lib/quotes/options";
import { billImageFor, fakeConsumerNo, fakePhone, LEADS, sanctionedLoadFor } from "./seed-data";

const prisma = new PrismaClient();
const DEMO_PASSWORD = "Demo@1234";
const ist = (s: string) => new Date(`${s}T00:00:00+05:30`);
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

const PRICE_BANDS = [
  { minKw: 1, maxKw: 2.99, pricePerKw: 65000 },
  { minKw: 3, maxKw: 5.99, pricePerKw: 58000 },
  { minKw: 6, maxKw: 10, pricePerKw: 54000 },
];
const SETTING = { generationPerKwYear: 1400, tariffPerUnit: 9.4, exportRatePerUnit: 3.5, sqftPerKw: 100 };

const DOCS: { title: string; stage: (typeof STAGES)[number] }[] = [
  { title: "Advance payment receipt", stage: STAGES[0] },
  { title: "Site survey report", stage: STAGES[1] },
  { title: "Net-meter application", stage: STAGES[2] },
];

function samplePdf(title: string, sub: string) {
  const esc = (x: string) => x.replace(/[^\x20-\x7e]/g, "").replace(/([()\\])/g, "\\$1");
  const text = `BT /F1 20 Tf 72 740 Td (${esc(title)}) Tj /F1 12 Tf 0 -28 Td (${esc(sub)}) Tj 0 -20 Td (Sample document for testing.) Tj ET`;
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${text.length} >>\nstream\n${text}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n";
  const offs: number[] = [];
  objs.forEach((o, i) => {
    offs.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}

async function main() {
  console.log("Clearing old data…");
  await prisma.notification.deleteMany();
  await prisma.projectEvent.deleteMany();
  await prisma.projectDocument.deleteMany();
  await prisma.project.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.user.deleteMany();
  await prisma.priceRule.deleteMany();
  await prisma.subsidyRule.deleteMany();
  await prisma.calcSetting.deleteMany();

  console.log("Creating users…");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const admin = await prisma.user.create({
    data: { email: "manager@demo.solar", name: "Anjali Patil", role: "ADMIN", passwordHash, phone: fakePhone(1) },
  });
  const sales1 = await prisma.user.create({
    data: { email: "sales@demo.solar", name: "Kunal Bhagat", role: "SALES", passwordHash, phone: fakePhone(2) },
  });
  const sales2 = await prisma.user.create({
    data: { email: "sales2@demo.solar", name: "Snehal Wasnik", role: "SALES", passwordHash, phone: fakePhone(3) },
  });
  const homeowner = await prisma.user.create({
    data: {
      email: "homeowner@demo.solar",
      name: "Prashant Wankhede",
      role: "HOMEOWNER",
      passwordHash,
      phone: fakePhone(10),
      language: "mr",
    },
  });

  console.log("Creating dated rule tables…");
  await prisma.subsidyRule.createMany({
    data: [
      {
        name: "Residential rooftop (illustrative older rule)",
        slabs: [{ uptoKw: 3, perKw: 14588 }],
        capAmount: 43764,
        effectiveFrom: ist("2025-04-01"),
        effectiveTo: ist("2026-04-01"),
        note: "Seed-only example for testing dated lookups. Not a real scheme value.",
      },
      {
        name: "Central residential scheme",
        slabs: [
          { uptoKw: 2, perKw: 30000 },
          { uptoKw: 3, perKw: 18000 },
        ],
        capAmount: 78000,
        effectiveFrom: ist("2026-04-01"),
        effectiveTo: null,
        note: "From client brief: ₹30,000/kW up to 2 kW + ₹18,000 for the 3rd kW, cap ₹78,000. Verify before launch.",
      },
    ],
  });
  await prisma.priceRule.createMany({
    data: PRICE_BANDS.map((b) => ({ ...b, effectiveFrom: ist("2026-04-01"), note: "Assumed prices (A-08)" })),
  });
  await prisma.calcSetting.create({ data: { ...SETTING, effectiveFrom: ist("2026-04-01") } });

  console.log("Creating leads…");
  for (const [i, l] of LEADS.entries()) {
    const result = scoreLead(
      {
        ownership: l.ownership,
        roofType: l.roofType,
        roofAreaSqft: l.roofAreaSqft,
        monthlyBill: l.monthlyBill,
        monthlyUnits: l.monthlyUnits,
      },
      SETTING,
    );
    let status: LeadStatus;
    if (l.scenario === "reupload") status = "REUPLOAD_REQUESTED";
    else if (l.scenario) status = "BILL_REVIEW";
    else status = result.nextAction === "CALL" ? "CALL_ONLY" : "SURVEY";

    const createdAt = daysAgo(l.ageDays);
    const verified = !l.scenario;
    const load = sanctionedLoadFor(l.monthlyUnits);
    const loadConfidence = l.scenario === "needs-check" ? 0.62 : 0.97;
    const read = l.scenario !== "reupload";

    await prisma.lead.create({
      data: {
        code: l.code,
        name: l.name,
        phone: fakePhone(100 + i),
        ownership: l.ownership,
        roofType: l.roofType,
        roofAreaSqft: l.roofAreaSqft,
        monthlyBill: l.monthlyBill,
        pincode: l.pincode,
        district: l.district,
        status,
        score: result.score,
        scoreReasons: result.reasons as unknown as Prisma.InputJsonValue,
        recommendedKw: result.recommendedKw,
        createdAt,
        homeownerId: l.code === "LD-30881" ? homeowner.id : null,
        assignedToId: i % 2 === 0 ? sales1.id : sales2.id,
        bills: {
          create: {
            imagePath: billImageFor(l),
            status: !read ? "NEEDS_REUPLOAD" : verified ? "CONFIRMED" : "EXTRACTED",
            aiModel: "seed",
            aiExtraction: read
              ? {
                  source: "seed",
                  consumerNumber: { value: fakeConsumerNo(i), confidence: 0.99 },
                  tariffCategory: { value: "LT-I(B) Residential", confidence: 0.95 },
                  sanctionedLoadKw: { value: load, confidence: loadConfidence },
                  monthlyUnits: { value: l.monthlyUnits, confidence: 0.98 },
                  billAmount: { value: l.monthlyBill, confidence: 0.97 },
                }
              : { source: "seed", readable: false, qualityIssue: "Image is blurry and tilted" },
            aiIssues:
              l.scenario === "needs-check"
                ? { issues: ["Sanctioned load read with low confidence (62%)"], needsCheck: ["sanctionedLoadKw"] }
                : undefined,
            reuploadReason: read ? null : "We couldn't read your bill clearly (image is blurry and tilted). Please take a clearer photo in good light.",
            consumerNumber: read ? fakeConsumerNo(i) : null,
            tariffCategory: read ? "LT-I(B) Residential" : null,
            sanctionedLoadKw: read ? load : null,
            monthlyUnits: read ? l.monthlyUnits : null,
            billAmount: read ? l.monthlyBill : null,
            verifiedById: verified ? admin.id : null,
            verifiedAt: verified ? createdAt : null,
            createdAt,
          },
        },
      },
    });
  }

  console.log("Creating quotes and projects…");
  const SUBSIDY = { slabs: [{ uptoKw: 2, perKw: 30000 }, { uptoKw: 3, perKw: 18000 }], capAmount: 78000 };
  const subsidyRule = await prisma.subsidyRule.findFirstOrThrow({ where: { effectiveTo: null } });
  const rules = { bands: PRICE_BANDS, subsidy: SUBSIDY, setting: SETTING };
  const DEMO_URL = process.env.APP_URL ?? "http://localhost:3000";

  const plans: { code: string; kw: number; stage?: Stage; daysInStage?: number; quotedDaysAgo: number }[] = [
    { code: "LD-30881", kw: 3, quotedDaysAgo: 0 },
    { code: "LD-30977", kw: 3, stage: "INSTALLED", daysInStage: 2, quotedDaysAgo: 7 },
    { code: "LD-30952", kw: 6, stage: "NET_METER_APPLIED", daysInStage: 9, quotedDaysAgo: 30 },
    { code: "LD-30998", kw: 4, stage: "ADVANCE_PAID", daysInStage: 12, quotedDaysAgo: 14 },
    { code: "LD-30985", kw: 5, stage: "SUBSIDY_CREDITED", daysInStage: 3, quotedDaysAgo: 75 },
  ];

  for (const [n, plan] of plans.entries()) {
    const seedLead = LEADS.find((l) => l.code === plan.code)!;
    const lead = await prisma.lead.findUniqueOrThrow({ where: { code: plan.code } });
    const quotedAt = daysAgo(plan.quotedDaysAgo);
    const { chosen, options } = buildOptions(plan.kw, seedLead.monthlyUnits, rules);
    const quote = await prisma.quote.create({
      data: {
        code: `QT-${50001 + n}`,
        leadId: lead.id,
        createdById: sales1.id,
        status: plan.stage ? "ACCEPTED" : "SENT",
        sentAt: quotedAt,
        acceptedAt: plan.stage ? daysAgo(plan.quotedDaysAgo - 1) : null,
        validUntil: plan.stage ? validUntil(quotedAt) : validUntil(new Date()),
        systemKw: chosen.systemKw,
        grossCost: chosen.grossCost,
        subsidy: chosen.subsidy,
        netCost: chosen.netCost,
        annualGeneration: chosen.annualGeneration,
        annualSavings: chosen.annualSavings,
        paybackYears: chosen.paybackYears,
        options: options as object[],
        snapshot: {
          computedOn: quotedAt.toISOString(),
          inputs: { monthlyUnits: seedLead.monthlyUnits, systemKw: chosen.systemKw },
          subsidyRule: { id: subsidyRule.id, name: subsidyRule.name, ...SUBSIDY },
          priceBands: PRICE_BANDS,
          setting: SETTING,
        },
        createdAt: quotedAt,
      },
    });

    if (!plan.stage) {
      await prisma.lead.update({ where: { id: lead.id }, data: { status: "QUOTED", recommendedKw: chosen.systemKw } });
      continue;
    }

    const last = STAGES.indexOf(plan.stage);
    const start = plan.quotedDaysAgo - 1;
    const end = plan.daysInStage!;
    const stageDates = STAGES.slice(0, last + 1).map((_, i) => daysAgo(last === 0 ? end : start - Math.round(((start - end) * i) / last)));
    const token = randomBytes(24).toString("base64url");
    const url = `${DEMO_URL}/status/${token}`;
    await prisma.project.create({
      data: {
        leadId: lead.id,
        quoteId: quote.id,
        stage: plan.stage,
        advanceAmount: advanceFor(chosen.netCost),
        statusToken: token,
        stageUpdated: stageDates[last],
        createdAt: stageDates[0],
        events: {
          create: STAGES.slice(0, last + 1).map((st, i) => ({
            stage: st,
            at: stageDates[i],
            byId: i === 0 ? null : sales1.id,
            note: i === 0 ? "Advance received (test payment)" : null,
          })),
        },
        documents: {
          create: DOCS.filter((d) => STAGES.indexOf(d.stage) <= last).map((d) => {
            const data = samplePdf(d.title, `${lead.name} · ${lead.code}`);
            return { title: d.title, stage: d.stage, fileData: data, fileMime: "application/pdf", fileSize: data.length, uploadedById: sales1.id, createdAt: stageDates[STAGES.indexOf(d.stage)] };
          }),
        },
        notifications: {
          create: STAGES.slice(0, last + 1).map((st, i) => ({
            channel: "WHATSAPP",
            to: lead.phone,
            body: stageMessage(firstName(lead.name), st, url),
            createdAt: stageDates[i],
          })),
        },
      },
    });
    await prisma.lead.update({ where: { id: lead.id }, data: { status: "WON", recommendedKw: chosen.systemKw } });
    console.log(`  ${plan.code} → ${STAGE_INFO[plan.stage].label}`);
  }

  console.log("Creating sample feedback…");
  await prisma.feedback.deleteMany({ where: { sample: true } });
  const SAMPLE_FEEDBACK = [
    { name: "Sunil K.", city: "Nagpur", rating: 5, lang: "en", message: "Uploaded my bill in the evening and had a clear quote the next day. The payback number was exactly what I needed to decide." },
    { name: "मीना ब.", city: "वर्धा", rating: 5, lang: "hi", message: "सब्सिडी का पूरा हिसाब पहले से कोटेशन में था। किसी दफ़्तर के चक्कर नहीं लगाने पड़े।" },
    { name: "Farah Q.", city: "Amravati", rating: 4, lang: "en", message: "The status link saved me so many calls. I could see when the net meter was applied without asking anyone." },
    { name: "राजेश इ.", city: "बुलढाणा", rating: 4, lang: "hi", message: "बिल छोटा था तो उन्होंने साफ़ बताया कि बचत कम होगी। ईमानदारी अच्छी लगी।" },
    { name: "Anil G.", city: "Nagpur", rating: 5, lang: "en", message: "They read my bill photo correctly and the surveyor already knew my sanctioned load when he came." },
    { name: "Pooja D.", city: "Washim", rating: 5, lang: "en", message: "Simple form, no jargon. Even my parents could follow the quote." },
    { name: "कविता ठ.", city: "गोंदिया", rating: 4, lang: "hi", message: "धुंधली फ़ोटो भेजी तो तुरंत नई फ़ोटो माँगी गई। दूसरी बार में सब ठीक पढ़ लिया।" },
    { name: "Vijay R.", city: "Yavatmal", rating: 5, lang: "en", message: "Clear options for 2, 3 and 4 kW. Seeing the payback side by side made the choice easy." },
  ];
  await prisma.feedback.createMany({
    data: SAMPLE_FEEDBACK.map((x, i) => ({ ...x, status: "APPROVED" as const, sample: true, createdAt: daysAgo(2 + i * 3) })),
  });

  const counts = {
    users: await prisma.user.count(),
    leads: await prisma.lead.count(),
    high: await prisma.lead.count({ where: { score: "HIGH" } }),
    medium: await prisma.lead.count({ where: { score: "MEDIUM" } }),
    low: await prisma.lead.count({ where: { score: "LOW" } }),
  };
  console.log("Done:", counts);
  console.log(`Demo password for all accounts: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
