import { PrismaPg } from "@prisma/adapter-pg";
import { withAccelerate } from "@prisma/extension-accelerate";

import { PrismaClient } from "@/app/generated/prisma/client";

type ExtendedPrismaClient = ReturnType<PrismaClient["$extends"]>;
type AnyPrismaClient = PrismaClient | ExtendedPrismaClient;

const globalForPrisma = globalThis as unknown as {
  prisma: AnyPrismaClient | undefined;
};

function createPrismaClient(): AnyPrismaClient {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  if (url.startsWith("prisma+postgres://")) {
    return new PrismaClient({ accelerateUrl: url }).$extends(withAccelerate());
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: url }),
  });
}

export const prisma: AnyPrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
