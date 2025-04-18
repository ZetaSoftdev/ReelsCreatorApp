import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Specify nodejs runtime for Prisma to work properly
export const runtime = 'nodejs';

// GET - Fetch all active subscription plans for public viewing
export async function GET() {
  try {
    // Directly use the Prisma client model instead of raw SQL for better compatibility
    const subscriptionPlans = await prisma.subscriptionPlan.findMany({
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