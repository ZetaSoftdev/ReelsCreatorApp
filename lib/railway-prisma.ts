// Special Prisma initialization file for Railway
import { PrismaClient } from '@prisma/client';

// Create a global variable for PrismaClient to enable connection reuse
declare global {
  var _prismaRailway: PrismaClient | undefined;
}

// Initialize PrismaClient in a way that works better in Railway's environment
export const prismaRailway = global._prismaRailway || new PrismaClient({
  log: ['error'],
  // Define only standard PrismaClient options
});

// Store prisma instance in global (prevents multiple instances in development)
if (process.env.NODE_ENV !== 'production') {
  global._prismaRailway = prismaRailway;
}

// Helper function to get PrismaClient with improved error handling
export function getPrismaClient() {
  try {
    return prismaRailway;
  } catch (error) {
    console.error("Error initializing Prisma:", error);
    // Attempt to create a new instance if the global one failed
    return new PrismaClient({
      log: ['error'],
    });
  }
}

export default prismaRailway; 