import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from '@prisma/client';
import { Role } from "@/lib/constants";

// Specify nodejs runtime for Prisma to work properly
export const runtime = 'nodejs';

// Create a fresh Prisma client instance
const prismaClient = new PrismaClient();

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

    // Use Prisma client instead of raw queries for better compatibility
    const subscriptionPlan = await prismaClient.subscriptionPlan.findUnique({
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
    const existingPlan = await prismaClient.subscriptionPlan.findUnique({
      where: { id }
    });

    if (!existingPlan) {
      return NextResponse.json(
        { error: "Subscription plan not found" },
        { status: 404 }
      );
    }

    // Update all fields in a single operation using Prisma client
    const updatedPlan = await prismaClient.subscriptionPlan.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.monthlyPrice !== undefined && { monthlyPrice: parseFloat(data.monthlyPrice) }),
        ...(data.yearlyPrice !== undefined && { yearlyPrice: parseFloat(data.yearlyPrice) }),
        ...(data.features !== undefined && { 
          features: Array.isArray(data.features) ? data.features : [data.features] 
        }),
        ...(data.minutesAllowed !== undefined && { minutesAllowed: parseInt(data.minutesAllowed) }),
        ...(data.maxFileSize !== undefined && { maxFileSize: parseInt(data.maxFileSize) }),
        ...(data.maxConcurrentRequests !== undefined && { 
          maxConcurrentRequests: parseInt(data.maxConcurrentRequests) 
        }),
        ...(data.storageDuration !== undefined && { storageDuration: parseInt(data.storageDuration) }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        updatedAt: new Date()
      }
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
    const activeSubscriptionsCount = await prismaClient.subscription.count({
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

    // Delete the subscription plan using Prisma client
    await prismaClient.subscriptionPlan.delete({
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