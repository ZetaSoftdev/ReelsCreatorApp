import { PrismaClient } from '@prisma/client';

// This check ensures Prisma only runs on the server side
// and prevents "PrismaClient is unable to run in this browser environment" errors
const globalForPrisma = global as unknown as { prisma: PrismaClient };

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
                logoUrl: "/logo.png",
                faviconUrl: "/favicon.ico",
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

// Fix for PrismaClient being bundled for the browser
export const prisma = 
  globalForPrisma.prisma || 
  (() => {
    // Check if we're in a Node.js environment
    if (typeof window === 'undefined') {
      return new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });
    }
    
    // Return a mock for browser environments
    console.warn('Creating Prisma mock for browser environment');
    return createPrismaMock();
  })();

if (process.env.NODE_ENV !== 'production' && typeof window === 'undefined') {
  globalForPrisma.prisma = prisma;
} 