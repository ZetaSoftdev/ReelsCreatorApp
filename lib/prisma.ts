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
          
          // Implement basic methods that return safe defaults but with proper warning logs
          if (['findUnique', 'findFirst', 'findMany', 'count'].includes(methodProp)) {
            return (...args: any[]) => {
              console.warn(`Prisma browser mock: ${prop}.${methodProp} called with`, JSON.stringify(args));
              console.warn('Database connection not available, returning empty result');
              return Promise.resolve(methodProp === 'findMany' ? [] : null);
            };
          }
          if (['create', 'update', 'upsert'].includes(methodProp)) {
            return (...args: any[]) => {
              console.warn(`Prisma browser mock: ${prop}.${methodProp} called with`, JSON.stringify(args));
              console.warn('Database connection not available, returning empty result');
              return Promise.resolve({});
            };
          }
          if (['delete', 'deleteMany'].includes(methodProp)) {
            return (...args: any[]) => {
              console.warn(`Prisma browser mock: ${prop}.${methodProp} called with`, JSON.stringify(args));
              console.warn('Database connection not available, returning empty result');
              return Promise.resolve({ count: 0 });
            };
          }
          
          // Handle raw SQL queries like $queryRaw with safe fallbacks
          if (methodProp === '$queryRaw' || methodProp === '$executeRaw') {
            return (...args: any[]) => {
              console.warn(`Prisma browser mock: ${methodProp} called with`, JSON.stringify(args));
              console.warn('Database connection not available, returning empty result');
              return Promise.resolve([]);
            };
          }
          
          // For any other method, return a function that does nothing but logs the attempt
          return (...args: any[]) => {
            console.warn(`Prisma browser mock: ${prop}.${methodProp} called with`, JSON.stringify(args));
            console.warn('Database connection not available, returning null');
            return Promise.resolve(null);
          };
        }
      });
    }
  };
  
  return new Proxy({}, handler) as unknown as PrismaClient;
};

// Production-safe Prisma client with improved logging and connection handling
const createProdSafePrismaClient = () => {
  // Create a normal PrismaClient with better logging
  const client = new PrismaClient({
    log: ['error', 'warn', 'info'],
  });
  
  // Wrap it in error-handling proxy with improved logging
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
                
                // For query methods, return appropriate empty results instead of nulls
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

// Better detection of build vs runtime environments
const isBuildPhase = () => {
  // Check multiple indicators of build phase
  const explicitBuildFlag = process.env.NEXT_PHASE === 'phase-production-build';
  const isStaticGeneration = process.env.NEXT_RUNTIME === 'edge' && typeof process.env.VERCEL_URL === 'string';
  
  // Log the detection for debugging
  if (explicitBuildFlag || isStaticGeneration) {
    console.log('Build phase detected based on environment variables');
    return true;
  }
  
  return false;
};

// Improved Prisma client initialization
export const prisma = global.prisma || (() => {
  // Check if we're in a Node.js environment
  if (typeof window === 'undefined') {
    console.log('Server environment detected');
    
    // Check for build phase with improved detection
    if (isBuildPhase()) {
      console.log('Build phase confirmed, using Prisma mock');
      return createPrismaMock();
    }
    
    // In production and development on server side, use actual Prisma client
    try {
      console.log('Initializing Prisma client for database connection');
      
      // Always use the enhanced error-handling client for better stability
      return createProdSafePrismaClient();
    } catch (err) {
      console.error('Failed to initialize Prisma client:', err);
      
      // Re-throw the error to make database issues visible
      // This will help identify connection problems instead of silently failing
      throw err;
    }
  }
  
  // Return a mock for browser environments with clear logging
  console.warn('Browser environment detected, using Prisma mock (client-side rendering)');
  return createPrismaMock();
})();

// In development, maintain a single instance across hot reloads
if (process.env.NODE_ENV !== 'production' && typeof window === 'undefined') {
  global.prisma = prisma;
} 