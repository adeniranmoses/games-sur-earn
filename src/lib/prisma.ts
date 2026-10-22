import { PrismaClient } from "@prisma/client";

// This file ensures we only create ONE instance of PrismaClient in development.
// Otherwise, Next.js hot-reloading will create hundreds of connections and crash your database.

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
