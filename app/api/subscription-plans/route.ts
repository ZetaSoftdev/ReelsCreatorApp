import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch all active subscription plans for public viewing
export async function GET() {
  try {
    // Fetch all active subscription plans using raw SQL
    const subscriptionPlans = await prisma.$queryRaw`
      SELECT * FROM "SubscriptionPlan" 
      WHERE "isActive" = true
      ORDER BY "monthlyPrice" ASC
    `;

    return NextResponse.json({ subscriptionPlans });
  } catch (error: any) {
    console.error("Error fetching subscription plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription plans", details: error.message },
      { status: 500 }
    );
  }
} 