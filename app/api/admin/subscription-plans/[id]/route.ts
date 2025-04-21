import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/constants";

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

    // Use raw query to fetch the subscription plan
    const plans = await prisma.$queryRaw`
      SELECT * FROM "SubscriptionPlan" WHERE id = ${id}
    `;
    
    const subscriptionPlan = plans && Array.isArray(plans) && plans.length > 0 ? plans[0] : null;

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
    const existingPlans = await prisma.$queryRaw`
      SELECT * FROM "SubscriptionPlan" WHERE id = ${id}
    `;
    
    const existingPlan = existingPlans && Array.isArray(existingPlans) && existingPlans.length > 0 ? existingPlans[0] : null;

    if (!existingPlan) {
      return NextResponse.json(
        { error: "Subscription plan not found" },
        { status: 404 }
      );
    }

    // Prepare individual update statements for each field
    if (data.name !== undefined) {
      await prisma.$executeRaw`
        UPDATE "SubscriptionPlan" SET name = ${data.name} WHERE id = ${id}
      `;
    }
    
    if (data.description !== undefined) {
      await prisma.$executeRaw`
        UPDATE "SubscriptionPlan" SET description = ${data.description} WHERE id = ${id}
      `;
    }
    
    if (data.monthlyPrice !== undefined) {
      await prisma.$executeRaw`
        UPDATE "SubscriptionPlan" SET "monthlyPrice" = ${parseFloat(data.monthlyPrice)} WHERE id = ${id}
      `;
    }
    
    if (data.yearlyPrice !== undefined) {
      await prisma.$executeRaw`
        UPDATE "SubscriptionPlan" SET "yearlyPrice" = ${parseFloat(data.yearlyPrice)} WHERE id = ${id}
      `;
    }
    
    if (data.features !== undefined) {
      const featuresArray = Array.isArray(data.features) ? data.features : [data.features];
      // Need special handling for arrays in Postgres
      const featuresString = JSON.stringify(featuresArray);
      await prisma.$executeRaw`
        UPDATE "SubscriptionPlan" SET features = ${featuresArray}::text[] WHERE id = ${id}
      `;
    }
    
    if (data.minutesAllowed !== undefined) {
      await prisma.$executeRaw`
        UPDATE "SubscriptionPlan" SET "minutesAllowed" = ${parseInt(data.minutesAllowed)} WHERE id = ${id}
      `;
    }
    
    if (data.maxFileSize !== undefined) {
      await prisma.$executeRaw`
        UPDATE "SubscriptionPlan" SET "maxFileSize" = ${parseInt(data.maxFileSize)} WHERE id = ${id}
      `;
    }
    
    if (data.maxConcurrentRequests !== undefined) {
      await prisma.$executeRaw`
        UPDATE "SubscriptionPlan" SET "maxConcurrentRequests" = ${parseInt(data.maxConcurrentRequests)} WHERE id = ${id}
      `;
    }
    
    if (data.storageDuration !== undefined) {
      await prisma.$executeRaw`
        UPDATE "SubscriptionPlan" SET "storageDuration" = ${parseInt(data.storageDuration)} WHERE id = ${id}
      `;
    }
    
    if (data.isActive !== undefined) {
      await prisma.$executeRaw`
        UPDATE "SubscriptionPlan" SET "isActive" = ${data.isActive} WHERE id = ${id}
      `;
    }
    
    // Update the updatedAt timestamp
    await prisma.$executeRaw`
      UPDATE "SubscriptionPlan" SET "updatedAt" = now() WHERE id = ${id}
    `;
    
    // Fetch the updated plan
    const updatedPlans = await prisma.$queryRaw`
      SELECT * FROM "SubscriptionPlan" WHERE id = ${id}
    `;
    
    const updatedPlan = updatedPlans && Array.isArray(updatedPlans) && updatedPlans.length > 0 ? updatedPlans[0] : null;

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
    const activeSubscriptionsResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "Subscription" 
      WHERE "planId" = ${id} AND status = 'active'
    `;
    
    // Type assertion for the activeSubscriptionsResult
    const activeSubscriptions = activeSubscriptionsResult as Array<{count: string | number}>;
    const count = activeSubscriptions[0]?.count || 0;
    const numCount = typeof count === 'string' ? parseInt(count) : count;

    if (numCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete a subscription plan with active subscriptions" },
        { status: 400 }
      );
    }

    // Delete the subscription plan
    await prisma.$executeRaw`
      DELETE FROM "SubscriptionPlan" WHERE id = ${id}
    `;

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