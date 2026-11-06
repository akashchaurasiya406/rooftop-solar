import { NextResponse } from "next/server";
import type { QuoteResult } from "@/lib/calc/quote";
import { getSession } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { renderQuotePdf } from "@/lib/quotes/pdf";

export const runtime = "nodejs";

interface Snapshot {
  computedOn: string;
  subsidyRule: { name: string };
  setting: { tariffPerUnit: number; generationPerKwYear: number };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return new NextResponse("Not found", { status: 404 });

  const { id } = await params;
  const quote = await db.quote.findUnique({
    where: { id },
    include: { lead: { select: { name: true, pincode: true, district: true, homeownerId: true } } },
  });
  const isStaff = session.role === "SALES" || session.role === "ADMIN";
  const isOwner = session.role === "HOMEOWNER" && quote?.lead.homeownerId === session.userId;
  if (!quote || (!isStaff && !isOwner)) return new NextResponse("Not found", { status: 404 });

  const snap = quote.snapshot as unknown as Snapshot;
  const options = quote.options as unknown as QuoteResult[];
  const chosen = options.find((o) => o.systemKw === quote.systemKw) ?? options[0];

  const pdf = await renderQuotePdf({
    code: quote.code,
    createdAt: quote.createdAt,
    validUntil: quote.validUntil,
    customer: { name: quote.lead.name, pincode: quote.lead.pincode, region: quote.lead.district },
    chosen,
    options,
    subsidyRuleName: snap.subsidyRule.name,
    tariffPerUnit: snap.setting.tariffPerUnit,
    generationPerKwYear: snap.setting.generationPerKwYear,
    computedOn: new Date(snap.computedOn),
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="solar-quote-${quote.code}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
