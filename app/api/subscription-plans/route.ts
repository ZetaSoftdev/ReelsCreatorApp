import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force this route to be treated as a server-side route, not Edge
export const runtime = 'nodejs';

// GET - Fetch all subscription plans for public access
export async function GET() {
  try {
    console.log('Fetching subscription plans for public access');
    
    // Test database connection first to identify connection issues
    try {
      // Simple query to test database connectivity using Prisma model API
      await prisma.$connect();
      console.log('Database connection test successful');
    } catch (connError: any) {
      console.error('Database connection test failed:', connError);
      
      // Return a more specific error for database connection issues
      return NextResponse.json({
        error: "Database connection failed", 
        message: "Unable to connect to the database. Please try again later.",
        diagnostics: process.env.NODE_ENV === 'development' ? connError.message : undefined
      }, { 
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'X-Error-Type': 'database-connection'
        }
      });
    }
    
    // If connection is successful, proceed with fetching plans
    try {
      // Only get active subscription plans and select specific fields using Prisma model API
      const subscriptionPlans = await prisma.subscriptionPlan.findMany({
        where: {
          isActive: true
        },
        select: {
          id: true,
          name: true,
          description: true,
          monthlyPrice: true,
          yearlyPrice: true,
          features: true,
          minutesAllowed: true,
          maxFileSize: true,
          maxConcurrentRequests: true,
          storageDuration: true
        },
        orderBy: {
          monthlyPrice: 'asc'
        }
      });
      
      return NextResponse.json({ 
        subscriptionPlans,
        timestamp: new Date().toISOString() 
      });
    } catch (queryError: any) {
      console.error('Error in subscription plans query:', queryError);
      throw queryError; // Re-throw to be caught by outer handler
    }
  } catch (error: any) {
    console.error("Error fetching subscription plans:", error);
    
    // Create a detailed error response but limit sensitive info in production
    const errorResponse = {
      error: "Failed to fetch subscription plans",
      message: "An error occurred while retrieving subscription plans.",
      code: error.code || "UNKNOWN_ERROR"
    };
    
    // Add stack trace in development only
    if (process.env.NODE_ENV === 'development') {
      (errorResponse as any).details = error.message;
      (errorResponse as any).stack = error.stack;
    }
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
} 