import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force this route to be treated as a server-side route, not Edge
export const runtime = 'nodejs';

// GET - Fetch all subscription plans for public access
export async function GET() {
  try {
    console.log('Fetching subscription plans for public access');
    
    // Skip explicit database connection test as it's redundant
    // Prisma will implicitly connect when needed, and we'll handle errors
    
    // Get active subscription plans with proper error handling
    try {
      console.log('Querying subscription plans from database');
      
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
      
      console.log(`Found ${subscriptionPlans.length} active subscription plans`);
      
      return NextResponse.json({ 
        subscriptionPlans,
        timestamp: new Date().toISOString(),
        source: 'database'
      });
    } catch (queryError: any) {
      // Log the real error for diagnosis
      console.error('Error in subscription plans query:', queryError);
      
      // Forward the error response with detailed information
      return NextResponse.json({ 
        error: "Database query failed",
        message: "Failed to retrieve subscription plans from database",
        errorCode: queryError.code,
        errorType: queryError.name,
        // Include more details in non-production for debugging
        details: process.env.NODE_ENV !== 'production' ? queryError.message : undefined,
        timestamp: new Date().toISOString()
      }, { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-Error-Type': 'database-query'
        }
      });
    }
  } catch (error: any) {
    // Log the error with stack trace for server-side diagnosis
    console.error("Unexpected error fetching subscription plans:", error);
    
    // Return a detailed error response
    return NextResponse.json({
      error: "Failed to process subscription plans request",
      message: "An unexpected error occurred while processing your request",
      errorType: error.name,
      errorCode: error.code || "UNKNOWN_ERROR",
      timestamp: new Date().toISOString(),
      // Include more details in non-production for debugging
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Error-Type': 'server-error'
      }
    });
  }
} 