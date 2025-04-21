import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/constants";

// Force this route to be treated as a server-side route, not Edge
export const runtime = 'nodejs';

// POST - Create a new subscription plan with special handling for form data
export async function POST(req: NextRequest) {
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
    
    // Parse feature lines
    let features = [];
    if (typeof data.features === 'string') {
      // Split by newlines, trim spaces, and filter empty lines
      features = data.features
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0);
    } else if (Array.isArray(data.features)) {
      features = data.features;
    }
    
    // Validate and prepare data
    const name = data.name?.trim() || '';
    const description = data.description?.trim() || '';
    const monthlyPrice = parseFloat(data.monthlyPrice || 0);
    const yearlyPrice = parseFloat(data.yearlyPrice || 0);
    const minutesAllowed = parseInt(data.minutesAllowed || 60);
    const maxFileSize = parseInt(data.maxFileSize || 100);
    const maxConcurrentRequests = parseInt(data.maxConcurrentRequests || 2); 
    const storageDuration = parseInt(data.storageDuration || 7);
    const isActive = data.isActive === undefined ? true : !!data.isActive;
    
    // Validate data
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    
    if (!description) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }
    
    if (features.length === 0) {
      return NextResponse.json({ error: "At least one feature is required" }, { status: 400 });
    }
    
    // Insert the new plan using Prisma model API instead of raw SQL
    try {
      // Create a new subscription plan
      const newPlan = await prisma.subscriptionPlan.create({
        data: {
          name,
          description,
          monthlyPrice,
          yearlyPrice,
          features,
          minutesAllowed,
          maxFileSize,
          maxConcurrentRequests,
          storageDuration,
          isActive,
        }
      });
      
      // Return success with created plan
      return NextResponse.json({
        success: true,
        message: "Subscription plan created successfully",
        subscriptionPlan: newPlan
      }, { status: 201 });
    } catch (dbError: any) {
      console.error("Database error creating plan:", dbError);
      return NextResponse.json({
        error: "Database error creating plan",
        details: dbError.message
      }, { status: 500 });
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