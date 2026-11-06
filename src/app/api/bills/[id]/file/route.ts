import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return new NextResponse("Not found", { status: 404 });

  const { id } = await params;
  const bill = await db.bill.findUnique({
    where: { id },
    select: { fileData: true, fileMime: true, lead: { select: { homeownerId: true } } },
  });

  const isStaff = session.role === "SALES" || session.role === "ADMIN";
  const isOwner = session.role === "HOMEOWNER" && bill?.lead.homeownerId === session.userId;
  if (!bill || !bill.fileData || !bill.fileMime || (!isStaff && !isOwner)) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(new Uint8Array(bill.fileData), {
    headers: {
      "Content-Type": bill.fileMime,
      "Content-Disposition": "inline",
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
