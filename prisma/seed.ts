// Seeds realistic FAKE data. No real people, phone numbers or consumer numbers.
// Run: npm run db:seed   (wipes and recreates everything)

import { PrismaClient, type LeadStatus, type Ownership, type RoofType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { scoreLead } from "../src/lib/calc/scoring";

const prisma = new PrismaClient();
const DEMO_PASSWORD = "Demo@1234"; // demo accounts only — listed in deployment.md
const ist = (s: string) => new Date(`${s}T00:00:00+05:30`);
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

// ASSUMPTION A-08: installed prices per kW (not given in the brief).
const PRICE_BANDS = [
  { minKw: 1, maxKw: 2.99, pricePerKw: 65000 },
  { minKw: 3, maxKw: 5.99, pricePerKw: 58000 },
  { minKw: 6, maxKw: 10, pricePerKw: 54000 },
];
// ASSUMPTION A-09: ₹9.4/unit average residential tariff, ₹3.5/unit export rate,
// 100 sq ft of shade-free roof per kW.
const SETTING = { generationPerKwYear: 1400, tariffPerUnit: 9.4, exportRatePerUnit: 3.5, sqftPerKw: 100 };

type SeedLead = {
  code: string;
  name: string;
  ownership: Ownership;
  roofType: RoofType;
  roofAreaSqft: number;
  monthlyBill: number;
  monthlyUnits: number;
  pincode: string;
  district: string;
  ageDays: number;
};

// First three rows are the sample data from the brief.
const LEADS: SeedLead[] = [
  { code: "LD-30881", name: "Prashant Wankhede", ownership: "OWNER", roofType: "RCC", roofAreaSqft: 450, monthlyBill: 3200, monthlyUnits: 340, pincode: "440022", district: "Nagpur", ageDays: 1 },
  { code: "LD-30902", name: "Rohit Meshram", ownership: "TENANT", roofType: "RCC", roofAreaSqft: 400, monthlyBill: 1900, monthlyUnits: 210, pincode: "440015", district: "Nagpur", ageDays: 1 },
  { code: "LD-30915", name: "Ayesha Siddiqui", ownership: "OWNER", roofType: "RCC", roofAreaSqft: 300, monthlyBill: 650, monthlyUnits: 85, pincode: "444601", district: "Amravati", ageDays: 0 },
  { code: "LD-30921", name: "Sunita Deshmukh", ownership: "OWNER", roofType: "RCC", roofAreaSqft: 650, monthlyBill: 4800, monthlyUnits: 495, pincode: "444001", district: "Akola", ageDays: 0 },
  { code: "LD-30927", name: "Vijay Raut", ownership: "OWNER", roofType: "METAL_SHEET", roofAreaSqft: 500, monthlyBill: 2900, monthlyUnits: 310, pincode: "445001", district: "Yavatmal", ageDays: 2 },
  { code: "LD-30933", name: "Meena Bhoyar", ownership: "OWNER", roofType: "ASBESTOS", roofAreaSqft: 420, monthlyBill: 3100, monthlyUnits: 330, pincode: "442001", district: "Wardha", ageDays: 2 },
  { code: "LD-30940", name: "Imran Sheikh", ownership: "TENANT", roofType: "RCC", roofAreaSqft: 350, monthlyBill: 2600, monthlyUnits: 275, pincode: "442401", district: "Chandrapur", ageDays: 3 },
  { code: "LD-30946", name: "Kavita Thakre", ownership: "OWNER", roofType: "RCC", roofAreaSqft: 380, monthlyBill: 1700, monthlyUnits: 180, pincode: "441601", district: "Gondia", ageDays: 3 },
  { code: "LD-30952", name: "Anil Gawande", ownership: "OWNER", roofType: "RCC", roofAreaSqft: 900, monthlyBill: 7200, monthlyUnits: 720, pincode: "440010", district: "Nagpur", ageDays: 4 },
  { code: "LD-30958", name: "Shubhangi Kale", ownership: "OWNER", roofType: "RCC", roofAreaSqft: 200, monthlyBill: 3500, monthlyUnits: 370, pincode: "441904", district: "Bhandara", ageDays: 4 },
  { code: "LD-30963", name: "Rajesh Ingle", ownership: "OWNER", roofType: "OTHER", roofAreaSqft: 300, monthlyBill: 900, monthlyUnits: 100, pincode: "443001", district: "Buldhana", ageDays: 5 },
  { code: "LD-30970", name: "Pooja Dhote", ownership: "OWNER", roofType: "RCC", roofAreaSqft: 550, monthlyBill: 3900, monthlyUnits: 410, pincode: "444505", district: "Washim", ageDays: 6 },
  { code: "LD-30977", name: "Sachin Lanjewar", ownership: "OWNER", roofType: "RCC", roofAreaSqft: 480, monthlyBill: 2700, monthlyUnits: 290, pincode: "440024", district: "Nagpur", ageDays: 8 },
  { code: "LD-30985", name: "Farhana Qureshi", ownership: "OWNER", roofType: "RCC", roofAreaSqft: 700, monthlyBill: 5600, monthlyUnits: 560, pincode: "444603", district: "Amravati", ageDays: 12 },
  { code: "LD-30991", name: "Nitin Bawankule", ownership: "TENANT", roofType: "METAL_SHEET", roofAreaSqft: 250, monthlyBill: 1200, monthlyUnits: 130, pincode: "442605", district: "Gadchiroli", ageDays: 15 },
  { code: "LD-30998", name: "Rekha Chaudhari", ownership: "OWNER", roofType: "RCC", roofAreaSqft: 600, monthlyBill: 4200, monthlyUnits: 440, pincode: "440034", district: "Nagpur", ageDays: 20 },
];

// Fake but realistic-looking numbers (all start with 9999 so they are obviously fake).
const fakePhone = (i: number) => `99990${String(10000 + i * 137).slice(-5)}`;
const fakeConsumerNo = (i: number) => `4100${String(87654321 + i * 9173).slice(-8)}`;

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
        // Illustrative older rule — exists to demonstrate that old quotes keep old rules.
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
    // Newest leads still need bill review; older ones have been routed.
    let status: LeadStatus;
    if (l.ageDays === 0) status = "BILL_REVIEW";
    else status = result.nextAction === "CALL" ? "CALL_ONLY" : "SURVEY";

    const createdAt = daysAgo(l.ageDays);
    const verified = status !== "BILL_REVIEW";
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
            imagePath: "/sample-bills/sample-bill.svg",
            status: verified ? "CONFIRMED" : "EXTRACTED",
            aiExtraction: {
              source: "seed",
              consumerNumber: { value: fakeConsumerNo(i), confidence: 0.96 },
              tariffCategory: { value: "LT-I Residential", confidence: 0.91 },
              sanctionedLoadKw: { value: l.monthlyUnits > 400 ? 5 : 3, confidence: 0.88 },
              monthlyUnits: { value: l.monthlyUnits, confidence: 0.94 },
            },
            consumerNumber: fakeConsumerNo(i),
            tariffCategory: "LT-I Residential",
            sanctionedLoadKw: l.monthlyUnits > 400 ? 5 : 3,
            monthlyUnits: l.monthlyUnits,
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
