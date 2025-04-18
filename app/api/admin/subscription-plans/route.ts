import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from '@prisma/client';
import { Role } from "@/lib/constants";

// Specify nodejs runtime for Prisma to work properly
export const runtime = 'nodejs';

// GET - Fetch all subscription plans
export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create PrismaClient instance inside the function
    const prismaClient = new PrismaClient();
    
    try {
      // Use Prisma client model queries instead of raw SQL
      const subscriptionPlans = await prismaClient.subscriptionPlan.findMany({
        orderBy: {
          monthlyPrice: 'asc'
        }
      });
      
      // Disconnect client after use
      await prismaClient.$disconnect();

      return NextResponse.json({ subscriptionPlans });
    } catch (dbError) {
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

// POST - Create a new subscription plan
export async function POST(req: Request) {
  try {
    // Check authentication and authorization
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Only administrators can create subscription plans" },
        { status: 403 }
      );
    }

    // Get data from request
    const data = await req.json();
    
    // Validate required fields
    const requiredFields = [
      "name", 
      "description", 
      "monthlyPrice", 
      "yearlyPrice", 
      "features", 
      "minutesAllowed", 
      "maxFileSize", 
      "maxConcurrentRequests", 
      "storageDuration"
    ];
    
    for (const field of requiredFields) {
      if (data[field] === undefined) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Prepare data
    const features = Array.isArray(data.features) ? data.features : [data.features];
    
    // Create PrismaClient instance inside the function
    const prismaClient = new PrismaClient();
    
    try {
      // Create subscription plan using Prisma client
      const subscriptionPlan = await prismaClient.subscriptionPlan.create({
        data: {
          name: data.name,
          description: data.description,
          monthlyPrice: parseFloat(data.monthlyPrice),
          yearlyPrice: parseFloat(data.yearlyPrice),
          features: features,
          minutesAllowed: parseInt(data.minutesAllowed),
          maxFileSize: parseInt(data.maxFileSize),
          maxConcurrentRequests: parseInt(data.maxConcurrentRequests),
          storageDuration: parseInt(data.storageDuration),
          isActive: data.isActive !== undefined ? data.isActive : true
        }
      });
      
      // Disconnect client after use
      await prismaClient.$disconnect();

      return NextResponse.json({ subscriptionPlan }, { status: 201 });
    } catch (dbError) {
      // Make sure to disconnect even if there's an error
      await prismaClient.$disconnect();
      throw dbError;
    }
  } catch (error: any) {
    console.error("Error creating subscription plan:", error);
    return NextResponse.json(
      { 
        error: "Failed to create subscription plan", 
        details: error.message || "Unknown error occurred"
      },
      { status: 500 }
    );
  }
} 