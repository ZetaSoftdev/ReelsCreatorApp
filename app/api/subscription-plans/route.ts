import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';

// Specify nodejs runtime for Prisma to work properly
export const runtime = 'nodejs';

// GET - Fetch all active subscription plans for public viewing
export async function GET() {
  try {
    // Create PrismaClient instance inside the function to avoid initialization during build
    const prismaClient = new PrismaClient();
    
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
      
      // Disconnect client after use
      await prismaClient.$disconnect();
      
      return NextResponse.json({ subscriptionPlans });
    } catch (dbError: any) {
      // Make sure to disconnect even if there's an error
      await prismaClient.$disconnect();
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