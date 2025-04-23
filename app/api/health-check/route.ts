/*
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force this route to be treated as a server-side route, not Edge
export const runtime = 'nodejs';

// Define the health response type
interface HealthCheck {
  status: string;
  uptime: number;
  timestamp: string;
  environment: string;
  databaseStatus: string;
  databaseLatency: number;
  responseTime?: number; // Add this property to the type
  checks: {
    database: boolean;
    prisma: boolean;
  };
  errors: string[];
}

// A specialized health check route that tests database connectivity
export async function GET() {
  const startTime = Date.now();
  const health: HealthCheck = {
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "unknown",
    databaseStatus: "unknown",
    databaseLatency: 0,
    checks: {
      database: false,
      prisma: false
    },
    errors: []
  };

  // Test database connection
  try {
    console.log('Health check: Testing database connection');
    const dbCheckStart = Date.now();
    
    // Simple query to see if database is responsive
    const result = await prisma.$queryRaw`SELECT 1 as db_response;`;
    
    health.databaseLatency = Date.now() - dbCheckStart;
    health.databaseStatus = "connected";
    health.checks.database = true;
    
    // Check if Prisma models are working by trying to count a table
    try {
      // Try listing table names in PostgreSQL
      const tables = await prisma.$queryRaw`
        SELECT tablename FROM pg_catalog.pg_tables 
        WHERE schemaname = 'public'
        LIMIT 5;
      `;
      
      health.checks.prisma = true;
      
      // Add some diagnostics
      if (Array.isArray(tables)) {
        (health as any).tables = tables.map((t: any) => t.tablename).join(', ');
      }
    } catch (modelError: any) {
      health.errors.push(`Prisma model error: ${modelError.message}`);
    }
  } catch (dbError: any) {
    health.status = "error";
    health.databaseStatus = "error";
    health.errors.push(`Database connection error: ${dbError.message}`);
    
    // Add detailed error info in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      (health as any).databaseError = {
        message: dbError.message,
        code: dbError.code,
        stack: dbError.stack
      };
    }
  }

  // Add environment information (safely)
  (health as any).env = {
    DATABASE_URL: process.env.DATABASE_URL ? 
      `${process.env.DATABASE_URL.split('://')[0]}://${process.env.DATABASE_URL.split('@')[1] || '***'}` : 
      'not set',
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
  };

  // Add response time
  health.responseTime = Date.now() - startTime;

  // Set appropriate status code
  const statusCode = health.status === "ok" ? 200 : 503;

  return NextResponse.json(health, { 
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0'
    }
  });
} 
*/

// Temporary replacement for health check that doesn't use $queryRaw
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    status: "ok",
    message: "Service is running",
    timestamp: new Date().toISOString()
  });
} 


