import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Debug tool for development environment only
export async function GET(req: NextRequest) {
  // Only allow in development environment
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Debug endpoints are only available in development mode" },
      { status: 403 }
    );
  }

  try {
    // Get the user session (still require auth for security)
    const session = await auth();

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    
    // Debug actions
    if (action === "list_videos") {
      const videos = await prisma.video.findMany({
        orderBy: {
          uploadedAt: "desc"
        },
        take: 20
      });
      
      return NextResponse.json({ 
        videos,
        count: videos.length,
        prismaClientInstalled: true,
        environment: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? "Set (masked)" : "Not set"
      });
    } 
    else if (action === "check_user") {
      const userId = url.searchParams.get("userId") || session.user.id;
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { 
          subscription: true,
          videos: {
            orderBy: {
              uploadedAt: "desc"
            },
            take: 5
          }
        }
      });
      
      // Mask sensitive data before returning
      if (user) {
        return NextResponse.json({
          userId: user.id,
          email: user.email,
          name: user.name,
          videoCount: user.videos.length,
          recentVideos: user.videos.map(v => ({
            id: v.id,
            title: v.title,
            status: v.status,
            uploadedAt: v.uploadedAt,
            externalJobId: v.externalJobId
          })),
          subscription: user.subscription ? {
            status: user.subscription.status,
            plan: user.subscription.plan,
            minutesUsed: user.subscription.minutesUsed,
            minutesAllowed: user.subscription.minutesAllowed
          } : null
        });
      } else {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }
    else if (action === "check_prisma") {
      // Check if prisma can connect to the database
      try {
        const result = await prisma.$queryRaw`SELECT 1 as connected`;
        return NextResponse.json({ 
          prismaConnected: true,
          result
        });
      } catch (dbError: any) {
        return NextResponse.json({ 
          prismaConnected: false,
          error: dbError.message
        });
      }
    }
    else {
      return NextResponse.json({ 
        error: "Invalid action", 
        availableActions: [
          "list_videos", 
          "check_user", 
          "check_prisma"
        ]
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Debug API error:", error);
    return NextResponse.json(
      { error: "Debug API error", details: error.message },
      { status: 500 }
    );
  }
} 