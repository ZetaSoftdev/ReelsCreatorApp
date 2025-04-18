// Special Prisma initialization file for Railway
import { PrismaClient } from '@prisma/client';

// Create a global variable for PrismaClient to enable connection reuse
declare global {
  var _prismaRailway: PrismaClient | undefined;
}

// Function to initialize and validate a PrismaClient instance
function createPrismaClient() {
  try {
    console.log('Initializing PrismaClient for Railway environment');
    const client = new PrismaClient({
      log: ['error'],
      // Define only standard PrismaClient options
    });
    
    // Test the connection with a simple query
    // Uncomment if you want to test the connection immediately (may slow down initialization)
    // client.$queryRaw`SELECT 1`.then(() => console.log('PrismaClient connection test successful'))
    //   .catch(e => console.error('PrismaClient connection test failed:', e));
    
    return client;
  } catch (e) {
    console.error('Failed to initialize PrismaClient:', e);
    throw e; // Re-throw to be handled by the caller
  }
}

// Initialize PrismaClient in a way that works better in Railway's environment
export const prismaRailway = global._prismaRailway || createPrismaClient();

// Store prisma instance in global (prevents multiple instances in development)
if (process.env.NODE_ENV !== 'production') {
  global._prismaRailway = prismaRailway;
}

// Helper function to get PrismaClient with improved error handling
export function getPrismaClient() {
  try {
    // If global instance exists, return it
    if (global._prismaRailway) {
      return global._prismaRailway;
    }
    
    // If global instance doesn't exist but prismaRailway should be initialized
    if (prismaRailway) {
      return prismaRailway;
    }
    
    // Last resort: create a new instance
    console.log('Creating new PrismaClient instance as fallback');
    const newClient = createPrismaClient();
    if (process.env.NODE_ENV !== 'production') {
      global._prismaRailway = newClient;
    }
    return newClient;
  } catch (error) {
    console.error("Error in getPrismaClient:", error);
    // Create a new instance without storing it globally
    console.log('Creating emergency PrismaClient instance');
    return new PrismaClient({
      log: ['error'],
    });
  }
}

export default prismaRailway; 