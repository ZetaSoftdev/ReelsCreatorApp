import { NextResponse } from "next/server";
import prisma from '@/lib/railway-prisma';

// Specify nodejs runtime for Prisma to work properly
export const runtime = 'nodejs';

// GET - Fetch all active subscription plans for public viewing
export async function GET() {
  try {
    console.log("GET /api/subscription-plans: Starting request");
    
    try {
      // Use the prisma client to fetch subscription plans
      console.log("GET /api/subscription-plans: Fetching subscription plans from database");
      const subscriptionPlans = await prisma.subscriptionPlan.findMany({
        where: {
          isActive: true
        },
        orderBy: {
          monthlyPrice: 'asc'
        }
      });
      
      console.log(`GET /api/subscription-plans: Found ${subscriptionPlans.length} active subscription plans`);
      return NextResponse.json({ subscriptionPlans });
    } catch (dbError: any) {
      console.error("GET /api/subscription-plans: Database query error:", dbError);
      throw dbError;
    }
  } catch (error: any) {
    console.error("GET /api/subscription-plans: Error fetching subscription plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription plans", details: error.message },
      { status: 500 }
    );
  }
} 