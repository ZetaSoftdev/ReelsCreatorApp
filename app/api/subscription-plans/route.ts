import { NextResponse } from "next/server";
import prisma from '@/lib/railway-prisma';

// Force Node.js runtime for Prisma
export const runtime = 'nodejs';

// GET - Fetch all active subscription plans for public viewing
export async function GET() {
  console.log("GET /api/subscription-plans: Starting request");
  
  try {
    // Use the prisma client directly to fetch subscription plans
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
  } catch (error) {
    console.error("GET /api/subscription-plans: Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription plans" },
      { status: 500 }
    );
  }
} 