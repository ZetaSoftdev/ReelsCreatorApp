import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/constants";

// Force this route to be treated as a server-side route, not Edge
export const runtime = 'nodejs';

// GET - Fetch a specific subscription plan by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = params.id;

    // Use Prisma model API instead of raw SQL
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
  request: NextRequest,
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

    const id = params.id;
    const data = await request.json();

    // Check if the subscription plan exists
    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { id }
    });

    if (!existingPlan) {
      return NextResponse.json(
        { error: "Subscription plan not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    // Only include fields that were provided in the request
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.monthlyPrice !== undefined) updateData.monthlyPrice = parseFloat(data.monthlyPrice);
    if (data.yearlyPrice !== undefined) updateData.yearlyPrice = parseFloat(data.yearlyPrice);
    if (data.features !== undefined) {
      const featuresArray = Array.isArray(data.features) ? data.features : [data.features];
      updateData.features = featuresArray;
    }
    if (data.minutesAllowed !== undefined) updateData.minutesAllowed = parseInt(data.minutesAllowed);
    if (data.maxFileSize !== undefined) updateData.maxFileSize = parseInt(data.maxFileSize);
    if (data.maxConcurrentRequests !== undefined) updateData.maxConcurrentRequests = parseInt(data.maxConcurrentRequests);
    if (data.storageDuration !== undefined) updateData.storageDuration = parseInt(data.storageDuration);
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    
    // Update the subscription plan using Prisma model API
    const updatedPlan = await prisma.subscriptionPlan.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ subscriptionPlan: updatedPlan });
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
  request: NextRequest,
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

    const id = params.id;

    // Check if the subscription plan has active subscriptions
    const activeSubscriptionsCount = await prisma.subscription.count({
      where: {
        planId: id,
        status: 'active'
      }
    });

    if (activeSubscriptionsCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete a subscription plan with active subscriptions" },
        { status: 400 }
      );
    }

    // Delete the subscription plan
    await prisma.subscriptionPlan.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: "Subscription plan deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting subscription plan:", error);
    return NextResponse.json(
      { error: "Failed to delete subscription plan", details: error.message },
      { status: 500 }
    );
  }
} 