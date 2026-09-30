import { PrismaClient } from "@prisma/client";

// One PrismaClient per server process. In development, Next.js hot reload
// re-evaluates modules, so the instance is cached on globalThis.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.APP_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
