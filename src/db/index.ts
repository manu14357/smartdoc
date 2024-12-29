import { PrismaClient } from "@prisma/client";

declare global {
  // Declare a global variable to hold the PrismaClient instance
  // This prevents multiple instances from being created during development
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  // In production, always create a new PrismaClient instance
  prisma = new PrismaClient();
} else {
  // In development, use the cached instance if it exists
  if (!global.cachedPrisma) {
    global.cachedPrisma = new PrismaClient();
  }
  prisma = global.cachedPrisma;
}

// Export the PrismaClient instance for use in the rest of the application
export const db = prisma;
