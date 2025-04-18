import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PrismaClient } from '@prisma/client';

// Specify nodejs runtime for Prisma to work properly
export const runtime = 'nodejs';

// Fallback to a new PrismaClient if the shared instance fails
const getPrismaClient = () => {
  try {
    return prisma;
  } catch (error) {
    console.warn('Falling back to new PrismaClient instance');
    return new PrismaClient();
  }
};

// GET - Fetch all active subscription plans for public viewing
export async function GET() {
  try {
    const prismaClient = getPrismaClient();
    
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