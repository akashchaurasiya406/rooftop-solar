import { Prisma, PrismaClient } from "@prisma/client";

const RETRYABLE = new Set(["P1001", "P1002", "P1008", "P1017", "P2024"]);

export function isRetryable(e: unknown): boolean {
  if (e instanceof Prisma.PrismaClientKnownRequestError) return RETRYABLE.has(e.code);
  if (e instanceof Prisma.PrismaClientInitializationError) return true;
  if (e instanceof Prisma.PrismaClientUnknownRequestError) return /closed the connection|ECONNRESET|terminating connection/i.test(e.message);
  return false;
}

function createClient() {
  return new PrismaClient().$extends({
    query: {
      async $allOperations({ args, query }) {
        try {
          return await query(args);
        } catch (e) {
          if (!isRetryable(e)) throw e;
          await new Promise((r) => setTimeout(r, 300));
          return query(args);
        }
      },
    },
  });
}

type Db = ReturnType<typeof createClient>;
const globalForPrisma = globalThis as unknown as { prisma?: Db };

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
