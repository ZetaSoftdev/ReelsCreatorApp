import { PrismaClient } from '@prisma/client';

// Define the global variable shape
declare global {
  var prisma: PrismaClient | undefined;
}

// Create a browser-safe mock that acts like a PrismaClient but does nothing
const createPrismaMock = () => {
  const handler = {
    get: (target: any, prop: string) => {
      // For any model access (user, post, etc.), return a proxy with common methods
      return new Proxy({}, {
        get: (modelTarget: any, methodProp: string) => {
          // When accessing brandingSettings specifically, provide more helpful mock data
          if (prop === 'brandingSettings' && methodProp === 'findFirst') {
            return () => {
              console.warn('Prisma browser mock: Returning default branding settings');
              return Promise.resolve({
                id: 'mock-id',
                siteName: "Reels Creator",
                logoUrl: "branding/logo.png",
                faviconUrl: "branding/favicon.ico",
                primaryColor: "#8B5CF6",
                accentColor: "#F59E0B",
                defaultFont: "Poppins",
                createdAt: new Date(),
                updatedAt: new Date()
              });
            };
          }
          
          // Implement basic methods that return safe defaults
          if (['findUnique', 'findFirst', 'findMany', 'count'].includes(methodProp)) {
            return () => Promise.resolve(null);
          }
          if (['create', 'update', 'upsert'].includes(methodProp)) {
            return () => Promise.resolve({});
          }
          if (['delete', 'deleteMany'].includes(methodProp)) {
            return () => Promise.resolve({ count: 0 });
          }
          
          // For any other method, return a function that does nothing
          return () => Promise.resolve(null);
        }
      });
    }
  };
  
  return new Proxy({}, handler) as unknown as PrismaClient;
};

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit during hot reloads.
// Learn more: https://pris.ly/d/help/next-js-best-practices

export const prisma = global.prisma || (() => {
  // Check if we're in a Node.js environment
  if (typeof window === 'undefined') {
    // During build time, we may not want to initialize Prisma fully
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.log('Build phase detected, using Prisma mock');
      return createPrismaMock();
    }
    
    // In production and development on server side, use actual Prisma client
    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
    
    return client;
  }
  
  // Return a mock for browser environments
  console.warn('Creating Prisma mock for browser environment');
  return createPrismaMock();
})();

// In development, maintain a single instance across hot reloads
if (process.env.NODE_ENV !== 'production' && typeof window === 'undefined') {
  global.prisma = prisma;
} 