import { PrismaClient, type LeadStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { scoreLead } from "../src/lib/calc/scoring";
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

async function main() {
  console.log("Clearing old data…");
  await prisma.notification.deleteMany();
  await prisma.projectEvent.deleteMany();
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
        scoreReasons: result.reasons,
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
