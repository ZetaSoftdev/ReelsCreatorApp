import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/constants";

// GET - Fetch all subscription plans
export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use prisma.$queryRaw to access the table directly since the model may not be properly generated yet
    const subscriptionPlans = await prisma.$queryRaw`
      SELECT * FROM "SubscriptionPlan" ORDER BY "monthlyPrice" ASC
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

    // Prepare data for proper types
    const name = data.name;
    const description = data.description;
    const monthlyPrice = parseFloat(data.monthlyPrice);
    const yearlyPrice = parseFloat(data.yearlyPrice);
    
    // Ensure features is an array and create a proper SQL array
    const featuresRaw = data.features || [];
    const features = Array.isArray(featuresRaw) ? featuresRaw : [featuresRaw];
    
    const minutesAllowed = parseInt(data.minutesAllowed);
    const maxFileSize = parseInt(data.maxFileSize);
    const maxConcurrentRequests = parseInt(data.maxConcurrentRequests);
    const storageDuration = parseInt(data.storageDuration);
    const isActive = data.isActive !== undefined ? data.isActive : true;
    
    // First create a simple record without the features array
    await prisma.$executeRaw`
      INSERT INTO "SubscriptionPlan" (
        id, name, description, "monthlyPrice", "yearlyPrice", 
        "minutesAllowed", "maxFileSize", "maxConcurrentRequests", 
        "storageDuration", "isActive", "createdAt", "updatedAt",
        features
      ) 
      VALUES (
        gen_random_uuid(), ${name}, ${description}, ${monthlyPrice}, ${yearlyPrice}, 
        ${minutesAllowed}, ${maxFileSize}, ${maxConcurrentRequests}, 
        ${storageDuration}, ${isActive}, now(), now(),
        ${features}::text[]
      )
    `;

    // Fetch the newly created subscription plan
    const newPlan = await prisma.$queryRaw`
      SELECT * FROM "SubscriptionPlan" 
      WHERE name = ${name} AND description = ${description}
      ORDER BY "createdAt" DESC LIMIT 1
    `;

    const subscriptionPlan = Array.isArray(newPlan) && newPlan.length > 0 ? newPlan[0] : null;

    return NextResponse.json({ subscriptionPlan }, { status: 201 });
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