// Special Prisma initialization file for Railway
import { PrismaClient } from '@prisma/client';

/**
 * PrismaClient is attached to the `global` object in development to prevent
 * exhausting your database connection limit.
 * 
 * Learn more: 
 * https://pris.ly/d/help/next-js-best-practices
 */

// Setup for reliable Prisma client in Next.js environment
const prismaClientSingleton = () => {
  console.log('RAILWAY-PRISMA: Creating new PrismaClient instance');
  return new PrismaClient({
    log: ['error'],
  });
};

// For non-production, use a global variable to avoid multiple instances
declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

// For production, create a new instance every time
// For development, reuse the existing instance if available
const prisma = global.prismaGlobal ?? prismaClientSingleton();

// Only store the instance in global in non-production
if (process.env.NODE_ENV !== 'production') {
  global.prismaGlobal = prisma;
}

// Simple function to get the initialized PrismaClient
export function getPrismaClient() {
  return prisma;
}

export default prisma; 