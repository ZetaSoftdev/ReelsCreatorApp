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
                siteName: "Editur",
                logoUrl: "/branding/logo.png",
                faviconUrl: "/branding/favicon.png",
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
          
          // Handle raw SQL queries like $queryRaw with safe fallbacks
          if (methodProp === '$queryRaw' || methodProp === '$executeRaw') {
            return () => Promise.resolve([]);
          }
          
          // For any other method, return a function that does nothing
          return () => Promise.resolve(null);
        }
      });
    }
  };
  
  return new Proxy({}, handler) as unknown as PrismaClient;
};

// Production-safe Prisma client that handles connection errors gracefully
const createProdSafePrismaClient = () => {
  // Create a normal PrismaClient
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
  
  // Wrap it in error-handling proxy
  const handler = {
    get: (target: any, prop: string) => {
      const original = target[prop];
      
      // If this isn't a function or is a built-in, just return it
      if (typeof original !== 'function' || prop.startsWith('$')) {
        return original;
      }
      
      // For model properties, wrap those with error handling
      if (typeof original === 'object') {
        return new Proxy(original, {
          get: (modelTarget: any, methodProp: string) => {
            const modelMethod = modelTarget[methodProp];
            
            // If not a function, return directly
            if (typeof modelMethod !== 'function') {
              return modelMethod;
            }
            
            // Wrap the method with error handling
            return async function(...args: any[]) {
              try {
                return await modelMethod.apply(modelTarget, args);
              } catch (error) {
                console.error(`Prisma error in ${String(prop)}.${String(methodProp)}:`, error);
                
                // For query methods, return appropriate empty results
                if (['findUnique', 'findFirst'].includes(methodProp)) {
                  return null;
                }
                if (['findMany', 'count'].includes(methodProp)) {
                  return [];
                }
                if (['create', 'update', 'upsert'].includes(methodProp)) {
                  throw error; // Re-throw for mutations - we want to know if these fail
                }
                
                // Default fallback
                return null;
              }
            };
          }
        });
      }
      
      // For direct client methods
      return async function(...args: any[]) {
        try {
          return await original.apply(target, args);
        } catch (error) {
          console.error(`Prisma error in ${String(prop)}:`, error);
          // For raw queries, return empty result instead of crashing
          if (prop === '$queryRaw' || prop === '$executeRaw') {
            return [];
          }
          throw error; // Re-throw other errors
        }
      };
    }
  };
  
  return new Proxy(client, handler) as PrismaClient;
};

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit during hot reloads.
// Learn more: https://pris.ly/d/help/next-js-best-practices

export const prisma = global.prisma || (() => {
  // Check if we're in a Node.js environment
  if (typeof window === 'undefined') {
    /* Remove build phase detection that's causing issues
    // During build time, we may not want to initialize Prisma fully
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      console.log('Build phase detected, using Prisma mock');
      return createPrismaMock();
    }
    */
    
    // In production and development on server side, use actual Prisma client
    try {
      // Use enhanced error-handling client in production
      if (process.env.NODE_ENV === 'production') {
        console.log('Production environment detected, using error-handling Prisma client');
        return createProdSafePrismaClient();
      } else {
        // Standard client for development
        return new PrismaClient({
          log: ['query', 'error', 'warn'],
        });
      }
    } catch (err) {
      console.error('Failed to initialize Prisma client:', err);
      // In production, fall back to mock to prevent application crash
      if (process.env.NODE_ENV === 'production') {
        console.warn('Using Prisma mock in production due to initialization error');
        return createPrismaMock();
      }
      throw err; // In development, let it fail visibly
    }
  }
  
  // Return a mock for browser environments
  console.warn('Creating Prisma mock for browser environment');
  return createPrismaMock();
})();

// In development, maintain a single instance across hot reloads
if (process.env.NODE_ENV !== 'production' && typeof window === 'undefined') {
  global.prisma = prisma;
} 