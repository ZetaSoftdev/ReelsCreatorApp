import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';

// Specify nodejs runtime for Prisma to work properly
export const runtime = 'nodejs';

// Create a fresh Prisma client instance
const prismaClient = new PrismaClient();

// GET - Fetch all active subscription plans for public viewing
export async function GET() {
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
  } catch (error: any) {
    console.error("Error fetching subscription plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription plans", details: error.message },
      { status: 500 }
    );
  }
} 