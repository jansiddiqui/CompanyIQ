import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

// Elite-level Javascript Proxy for Lazy Initialization + Global Caching.
// 1. Lazy Initialization: Prevents PrismaClient from instantiating during Next.js build-time static pre-rendering.
// 2. Global Caching: Stores the instance on the Node.js global object to prevent connection leaks during hot reloads.
export const db = new Proxy({} as PrismaClient, {
  get(target, prop, receiver) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      });
    }
    return Reflect.get(globalForPrisma.prisma, prop, receiver);
  }
});
