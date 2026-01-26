import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prismaGlobal?: PrismaClient;
};

const prisma =
  globalForPrisma.prismaGlobal ??
  new PrismaClient({
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaGlobal = prisma;
}

export default prisma;
