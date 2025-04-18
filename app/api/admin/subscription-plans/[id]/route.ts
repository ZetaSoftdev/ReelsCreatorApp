import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from '@/lib/railway-prisma';
import { Role } from "@/lib/constants";

// Specify nodejs runtime for Prisma to work properly
export const runtime = 'nodejs';

// GET - Fetch a single subscription plan by ID
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    try {
      // Find subscription plan by ID using Prisma client
      const subscriptionPlan = await prisma.subscriptionPlan.findUnique({
        where: { id }
      });

      if (!subscriptionPlan) {
        return NextResponse.json(
          { error: "Subscription plan not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ subscriptionPlan });
    } catch (dbError) {
      throw dbError;
    }
  } catch (error: any) {
    console.error("Error fetching subscription plan:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription plan", details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update a subscription plan
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and authorization
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Only administrators can update subscription plans" },
        { status: 403 }
      );
    }

    const { id } = params;
    const data = await req.json();

    // Prepare features array if it exists in the request data
    const updateData: any = { ...data };
    if (data.features) {
      updateData.features = Array.isArray(data.features) 
        ? data.features 
        : [data.features];
    }

    // Convert numeric strings to numbers
    const numericFields = [
      'monthlyPrice', 'yearlyPrice', 'minutesAllowed', 
      'maxFileSize', 'maxConcurrentRequests', 'storageDuration'
    ];
    
    numericFields.forEach(field => {
      if (updateData[field] !== undefined) {
        if (field === 'monthlyPrice' || field === 'yearlyPrice') {
          updateData[field] = parseFloat(updateData[field]);
        } else {
          updateData[field] = parseInt(updateData[field]);
        }
      }
    });

    try {
      // Update subscription plan using Prisma client
      const updatedPlan = await prisma.subscriptionPlan.update({
        where: { id },
        data: updateData
      });

      return NextResponse.json({ subscriptionPlan: updatedPlan });
    } catch (dbError: any) {
      // Check if it's a record not found error
      if (dbError.code === 'P2025') {
        return NextResponse.json(
          { error: "Subscription plan not found" },
          { status: 404 }
        );
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error("Error updating subscription plan:", error);
    return NextResponse.json(
      { error: "Failed to update subscription plan", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a subscription plan
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and authorization
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Only administrators can delete subscription plans" },
        { status: 403 }
      );
    }

    const { id } = params;

    try {
      // Delete subscription plan using Prisma client
      await prisma.subscriptionPlan.delete({
        where: { id }
      });

      return NextResponse.json(
        { message: "Subscription plan deleted successfully" }
      );
    } catch (dbError: any) {
      // Check if it's a record not found error
      if (dbError.code === 'P2025') {
        return NextResponse.json(
          { error: "Subscription plan not found" },
          { status: 404 }
        );
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error("Error deleting subscription plan:", error);
    return NextResponse.json(
      { error: "Failed to delete subscription plan", details: error.message },
      { status: 500 }
    );
  }
} 