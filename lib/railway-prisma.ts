// Special Prisma initialization file for Railway
import { PrismaClient } from '@prisma/client';

/**
 * PrismaClient is attached to the `global` object in development to prevent
 * exhausting your database connection limit.
 * 
 * Learn more: 
 * https://pris.ly/d/help/next-js-best-practices
 */

// PrismaClient initialization
const createPrismaClient = () => {
  console.log('RAILWAY-PRISMA: Creating new PrismaClient instance');
  return new PrismaClient({
    log: ['error']
  });
};

// In development, we'll keep a global instance to avoid multiple connections
// In production, we'll create a new instance for every import (which Next.js will optimize)
let prisma: PrismaClient;

// Check if we're in production
if (process.env.NODE_ENV === 'production') {
  // In production, create a new instance directly
  prisma = createPrismaClient();
} else {
  // In development, use global to avoid too many connections
  if (!(global as any).prisma) {
    (global as any).prisma = createPrismaClient();
  }
  prisma = (global as any).prisma;
}

// Helper function to get the Prisma client instance
export function getPrismaClient(): PrismaClient {
  return prisma;
}

// Export the Prisma client as default and named exports for flexibility
export { prisma };
export default prisma; 