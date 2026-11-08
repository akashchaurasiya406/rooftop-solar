import "server-only";
import type { FeedbackStatus } from "@prisma/client";
import { db } from "@/lib/db";
import type { FeedbackInput } from "./validation";

export const FEEDBACK_PER_HOUR = 3;

export async function tooManyFeedback(ipHash: string | null): Promise<boolean> {
  if (!ipHash) return false;
  const recent = await db.feedback.count({ where: { ipHash, createdAt: { gte: new Date(Date.now() - 3_600_000) } } });
  return recent >= FEEDBACK_PER_HOUR;
}

export async function saveFeedback(input: FeedbackInput, meta: { lang: string; ipHash: string | null; userId: string | null }) {
  return db.feedback.create({
    data: {
      rating: input.rating,
      message: input.message,
      name: input.name ?? null,
      city: input.city ?? null,
      lang: meta.lang,
      ipHash: meta.ipHash,
      userId: meta.userId,
    },
    select: { id: true },
  });
}

export async function publishedFeedback(limit = 18) {
  const [items, stats] = await Promise.all([
    db.feedback.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, name: true, city: true, rating: true, message: true, lang: true, sample: true, createdAt: true },
    }),
    db.feedback.aggregate({ where: { status: "APPROVED" }, _avg: { rating: true }, _count: true }),
  ]);
  return { items, average: stats._avg.rating ? Math.round(stats._avg.rating * 10) / 10 : null, count: stats._count };
}

export async function setFeedbackStatus(id: string, status: FeedbackStatus) {
  await db.feedback.update({ where: { id }, data: { status } });
}

export async function pendingFeedbackCount() {
  return db.feedback.count({ where: { status: "PENDING" } });
}
