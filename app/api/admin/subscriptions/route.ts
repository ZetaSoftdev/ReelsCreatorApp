import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/constants";

export async function GET(request: Request) {
  const session = await auth();
  const url = new URL(request.url);
  
  // Check if user is authenticated
  if (!session?.user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  
  // Check if user is an admin
  if (session.user.role !== Role.ADMIN) {
    return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
    });
  }
  
  try {
    // Parse query parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const search = url.searchParams.get('search') || '';
    const plan = url.searchParams.get('plan') || '';
    const status = url.searchParams.get('status') || '';
    const sortBy = url.searchParams.get('sortBy') || 'startDate';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    
    // Calculate pagination values
    const skip = (page - 1) * pageSize;
    
    // Build filters
    const filters: any = {};
    
    // Add search filter if provided (search in user name or email)
    if (search) {
      filters.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      };
    }
    
    // Add plan filter if provided
    if (plan) {
      filters.plan = plan;
    }
    
    // Add status filter if provided
    if (status) {
      filters.status = status;
    }
    
    // Count total subscriptions with filters
    const totalSubscriptions = await prisma.subscription.count({
      where: filters
    });
    
    // Calculate total pages
    const totalPages = Math.ceil(totalSubscriptions / pageSize);
    
    // Get subscriptions with pagination and sorting
    const subscriptions = await prisma.subscription.findMany({
      where: filters,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip,
      take: pageSize
    });
    
    // Get subscription counts by plan
    const subscriptionsByPlan = await prisma.subscription.groupBy({
      by: ['plan'],
      _count: {
        plan: true
      }
    });
    
    // Get subscription counts by status
    const subscriptionsByStatus = await prisma.subscription.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });
    
    // Get total revenue
    const revenuePipeline = await prisma.$queryRaw`
      SELECT SUM(CASE 
        WHEN "plan" = 'free' THEN 0
        WHEN "plan" = 'basic' THEN 9.99
        WHEN "plan" = 'pro' THEN 19.99
        WHEN "plan" = 'enterprise' THEN 49.99
        ELSE 0
      END) as total_revenue
      FROM "Subscription"
      WHERE "status" = 'active'
    `;
    
    // Get revenue by plan
    const revenueByPlan = await prisma.$queryRaw`
      SELECT "plan", COUNT(*) as count,
      SUM(CASE 
        WHEN "plan" = 'free' THEN 0
        WHEN "plan" = 'basic' THEN 9.99
        WHEN "plan" = 'pro' THEN 19.99
        WHEN "plan" = 'enterprise' THEN 49.99
        ELSE 0
      END) as revenue
      FROM "Subscription"
      WHERE "status" = 'active'
      GROUP BY "plan"
    `;
    
    return NextResponse.json({
      subscriptions,
      pagination: {
        total: totalSubscriptions,
        pageSize,
        currentPage: page,
        totalPages
      },
      metadata: {
        subscriptionsByPlan,
        subscriptionsByStatus,
        revenue: {
          total: (revenuePipeline as any)[0]?.total_revenue || 0,
          byPlan: revenueByPlan
        }
      }
    });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

// API route to create or update a subscription
export async function POST(request: Request) {
  const session = await auth();
  
  // Check if user is authenticated
  if (!session?.user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  
  // Check if user is an admin
  if (session.user.role !== Role.ADMIN) {
    return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
    });
  }
  
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.userId || !data.plan || !data.status) {
      return new NextResponse(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
      });
    }
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: data.userId }
    });
    
    if (!user) {
      return new NextResponse(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }
    
    // Check if subscription exists
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: data.userId }
    });
    
    // Prepare subscription data
    const subscriptionData = {
      plan: data.plan,
      status: data.status,
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      endDate: data.endDate ? new Date(data.endDate) : null,
      minutesAllowed: data.minutesAllowed || 0,
      minutesUsed: data.minutesUsed || 0,
      stripeCustomerId: data.stripeCustomerId || null,
      stripeSubscriptionId: data.stripeSubscriptionId || null
    };
    
    let subscription;
    
    if (existingSubscription) {
      // Update existing subscription
      subscription = await prisma.subscription.update({
        where: { userId: data.userId },
        data: subscriptionData,
        include: { user: true }
      });
    } else {
      // Create new subscription
      subscription = await prisma.subscription.create({
        data: {
          ...subscriptionData,
          userId: data.userId
        },
        include: { user: true }
      });
    }
    
    return NextResponse.json(subscription);
  } catch (error) {
    console.error("Error creating/updating subscription:", error);
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
} 