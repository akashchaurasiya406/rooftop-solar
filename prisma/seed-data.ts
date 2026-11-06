import type { Ownership, RoofType } from "@prisma/client";

export type Scenario = "reviewed" | "needs-check" | "reupload";

export type SeedLead = {
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
  scenario?: Scenario;
};

export const LEADS: SeedLead[] = [
  { code: "LD-30881", name: "Prashant Wankhede", ownership: "OWNER", roofType: "RCC", roofAreaSqft: 450, monthlyBill: 3200, monthlyUnits: 340, pincode: "440022", district: "Nagpur", ageDays: 1 },
  { code: "LD-30902", name: "Rohit Meshram", ownership: "TENANT", roofType: "RCC", roofAreaSqft: 400, monthlyBill: 1900, monthlyUnits: 210, pincode: "440015", district: "Nagpur", ageDays: 1 },
  { code: "LD-30915", name: "Ayesha Siddiqui", ownership: "OWNER", roofType: "RCC", roofAreaSqft: 300, monthlyBill: 650, monthlyUnits: 85, pincode: "444601", district: "Amravati", ageDays: 0, scenario: "reviewed" },
  { code: "LD-30921", name: "Sunita Deshmukh", ownership: "OWNER", roofType: "RCC", roofAreaSqft: 650, monthlyBill: 4800, monthlyUnits: 495, pincode: "444001", district: "Akola", ageDays: 0, scenario: "needs-check" },
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
  { code: "LD-31004", name: "Manoj Dhurve", ownership: "OWNER", roofType: "RCC", roofAreaSqft: 520, monthlyBill: 3600, monthlyUnits: 380, pincode: "440027", district: "Nagpur", ageDays: 0, scenario: "reupload" },
];

export const fakePhone = (i: number) => `99990${String(10000 + i * 137).slice(-5)}`;
export const fakeConsumerNo = (i: number) => `4100${String(87654321 + i * 9173).slice(-8)}`;
export const sanctionedLoadFor = (units: number) => (units > 400 ? 5 : 3);
export const billImageFor = (l: SeedLead) =>
  l.scenario === "reupload" ? "/sample-bills/sample-bill-blurry.jpg" : `/sample-bills/seed/${l.code}.jpg`;
