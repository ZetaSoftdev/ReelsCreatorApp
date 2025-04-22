import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force this route to be treated as a server-side route, not Edge
export const runtime = 'nodejs';

// Define types for our diagnostics object
interface DatabaseDiagnostics {
  status: string;
  connected: boolean;
  error: any | null;
  connectionTime: number | null;
  prismaVersion: string;
  counts?: {
    subscriptionPlans: number;
    users: number;
  };
}

interface HealthDiagnostics {
  timestamp: string;
  environment: string;
  database: DatabaseDiagnostics;
  serverInfo: {
    nodejs: string;
    platform: string;
    arch: string;
    uptime: number;
  };
  responseTime?: number;
}

/**
 * Health check endpoint that tests database connectivity and reports detailed diagnostics
 */
export async function GET() {
  const startTime = Date.now();
  const diagnostics: HealthDiagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    database: {
      status: 'unknown',
      connected: false,
      error: null,
      connectionTime: null,
      prismaVersion: require('@prisma/client/package.json').version,
    },
    serverInfo: {
      nodejs: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: Math.floor(process.uptime()),
    }
  };

  // Test database connection
  try {
    console.log('Health check: Testing database connection');
    const dbStartTime = Date.now();
    
    // Test database connection
    await prisma.$connect();
    
    // Simple query to verify functionality
    const plansCount = await prisma.subscriptionPlan.count();
    const usersCount = await prisma.user.count();
    
    diagnostics.database.connected = true;
    diagnostics.database.status = 'connected';
    diagnostics.database.connectionTime = Date.now() - dbStartTime;
    diagnostics.database.counts = {
      subscriptionPlans: plansCount,
      users: usersCount
    };
    
    console.log('Health check: Database connection successful', {
      connectionTime: diagnostics.database.connectionTime,
      plansCount,
      usersCount
    });
  } catch (error) {
    console.error('Health check: Database connection failed', error);
    diagnostics.database.status = 'error';
    diagnostics.database.connected = false;
    
    // Format the error for diagnostics
    if (error instanceof Error) {
      diagnostics.database.error = {
        message: error.message,
        name: error.name,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
      };
    } else {
      diagnostics.database.error = { message: String(error) };
    }
  } finally {
    try {
      // Always disconnect to clean up
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('Health check: Error disconnecting from database', disconnectError);
    }
  }

  // Calculate total response time
  diagnostics.responseTime = Date.now() - startTime;

  return NextResponse.json(diagnostics, {
    status: diagnostics.database.connected ? 200 : 503,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0'
    }
  });
} 