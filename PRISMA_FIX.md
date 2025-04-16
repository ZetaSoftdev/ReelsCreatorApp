# Fixing Prisma Browser Environment Issues

This document provides instructions for fixing the "PrismaClient is unable to run in this browser environment" errors that occur in Next.js applications.

## The Problem

The error occurs because:

1. Next.js uses React Server Components (RSC) by default
2. Some components may unintentionally include Prisma client code in client bundles
3. NextAuth is trying to use Prisma on both server and client sides

## Solution 

### 1. Prisma Client Configuration

The `lib/prisma.ts` file has been updated to include browser environment detection:

```typescript
import { PrismaClient } from '@prisma/client';

// This check ensures Prisma only runs on the server side
const globalForPrisma = global as unknown as { prisma: PrismaClient };

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
    return {} as PrismaClient;
  })();

if (process.env.NODE_ENV !== 'production' && typeof window === 'undefined') {
  globalForPrisma.prisma = prisma;
}
```

### 2. Auth Configuration

The `auth.ts` file has been updated to include a safePrismaOperation helper function:

```typescript
// Helper function to safely use Prisma with error handling
const safePrismaOperation = async (operation: () => Promise<any>, fallback: any = null) => {
  try {
    if (typeof window !== 'undefined') {
      console.error("Prisma cannot be used in the browser!");
      return fallback;
    }
    return await operation();
  } catch (error) {
    console.error("Error in Prisma operation:", error);
    return fallback;
  }
};
```

This function should be used to wrap all Prisma operations in auth callbacks.

### 3. Additional Recommendations

To completely eliminate these issues:

1. **Create server-only routes**: Move all database operations to API routes that run exclusively on the server
   
2. **Use explicit RSC/RCC separation**: Mark client components with "use client" directive and keep Prisma operations in server components only

3. **Update NextAuth config**: Configure NextAuth to use your API routes for session handling instead of direct Prisma calls

4. **Fix database duplication errors**: The logs show a unique constraint error on the email field. You may need to:
   - Make the user's email optional in the schema
   - Create a migration to deduplicate existing email entries
   - Use the findFirst method instead of findUnique when querying emails

### 4. Database Fixes

Run these commands to fix database issues:

```bash
# Generate Prisma migration to ensure schema is up to date
npx prisma migrate dev --name fix_user_schema

# Run the Prisma database push to apply changes
npx prisma db push

# If needed, deduplicate users with the same email (run as a script)
```

## Testing

After applying these fixes, test thoroughly:
- Login/logout process
- Profile updates
- Image uploads
- Session persistence across page refreshes 