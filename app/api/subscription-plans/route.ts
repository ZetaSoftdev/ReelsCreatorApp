import { NextResponse } from "next/server";
import { getPrismaClient } from '@/lib/railway-prisma';

// Specify nodejs runtime for Prisma to work properly
export const runtime = 'nodejs';

// GET - Fetch all active subscription plans for public viewing
export async function GET() {
  try {
    // Get PrismaClient instance from our Railway-specific implementation
    const prismaClient = getPrismaClient();
    
    try {
      // Use the prisma client to fetch subscription plans
      const subscriptionPlans = await prismaClient.subscriptionPlan.findMany({
        where: {
          isActive: true
        },
        orderBy: {
          monthlyPrice: 'asc'
        }
      });
      
      return NextResponse.json({ subscriptionPlans });
    } catch (dbError: any) {
      throw dbError;
    }
  } catch (error: any) {
    console.error("Error fetching subscription plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription plans", details: error.message },
      { status: 500 }
    );
  }
} 