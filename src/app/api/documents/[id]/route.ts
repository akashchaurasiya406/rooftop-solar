import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return new NextResponse("Not found", { status: 404 });

  const { id } = await params;
  const doc = await db.projectDocument.findUnique({
    where: { id },
    select: { title: true, fileData: true, fileMime: true, project: { select: { lead: { select: { homeownerId: true } } } } },
  });

  const isStaff = session.role === "SALES" || session.role === "ADMIN";
  const isOwner = session.role === "HOMEOWNER" && doc?.project.lead.homeownerId === session.userId;
  if (!doc || (!isStaff && !isOwner)) return new NextResponse("Not found", { status: 404 });

  const ext = doc.fileMime === "application/pdf" ? "pdf" : doc.fileMime.split("/")[1];
  const base = doc.title.replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-") || "document";
  return new NextResponse(new Uint8Array(doc.fileData), {
    headers: {
      "Content-Type": doc.fileMime,
      "Content-Disposition": `inline; filename="${base}.${ext}"`,
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
