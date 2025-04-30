import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST request handler to create a new video record
export async function POST(req: NextRequest) {
  try {
    // Get the user session
    const session = await auth();

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    // Get video data from request body
    const data = await req.json();

    // Validate required fields
    const requiredFields = ['title', 'originalUrl', 'duration', 'fileSize', 'status', 'uploadPath'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Use the userId from the data or fallback to the session user id
    const userId = data.userId || session.user.id;

    // Verify that the user exists and get subscription information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Create the video record in the database using a transaction to ensure both operations complete
    const video = await prisma.$transaction(async (tx) => {
      // Create video record
      const newVideo = await tx.video.create({
        data: {
          userId,
          title: data.title,
          description: data.description || "",
          originalUrl: data.originalUrl,
          duration: data.duration,
          fileSize: data.fileSize,
          status: data.status,
          uploadPath: data.uploadPath
        }
      });

      // Update user's subscription minutes used if they have an active subscription
      if (user.subscription && user.subscription.status === 'active') {
        // Convert seconds to minutes (rounded up)
        const minutesUsed = Math.ceil(data.duration / 60);
        
        console.log(`===== UPDATING SUBSCRIPTION MINUTES USED =====`);
        console.log(`User ID: ${userId}`);
        console.log(`Video duration: ${data.duration} seconds`);
        console.log(`Minutes to add: ${minutesUsed}`);
        console.log(`Current minutes used: ${user.subscription.minutesUsed}`);
        console.log(`New minutes used will be: ${user.subscription.minutesUsed + minutesUsed}`);
        console.log(`Minutes allowed in plan: ${user.subscription.minutesAllowed}`);
        
        // Update subscription record with minutes used
        await tx.subscription.update({
          where: { id: user.subscription.id },
          data: {
            minutesUsed: {
              increment: minutesUsed
            }
          }
        });
        
        console.log(`✅ Successfully updated subscription minutes used`);
      }
      
      return newVideo;
    });

    return NextResponse.json(
      { 
        success: true, 
        message: "Video saved to database", 
        video 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error saving video:", error);
    return NextResponse.json(
      { error: "Failed to save video", details: error.message },
      { status: 500 }
    );
  }
}

// GET request handler to list videos for the current user
export async function GET(req: NextRequest) {
  try {
    // Get the user session
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
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const status = url.searchParams.get("status");

    // Calculate pagination values
    const skip = (page - 1) * limit;

    // Build the where clause
    const where = {
      userId: session.user.id,
      ...(status ? { status } : {})
    };

    // Count total videos
    const total = await prisma.video.count({ where });

    // Get videos with pagination
    const videos = await prisma.video.findMany({
      where,
      orderBy: {
        uploadedAt: "desc"
      },
      skip,
      take: limit
    });

    return NextResponse.json({
      videos,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error("Error fetching videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos", details: error.message },
      { status: 500 }
    );
  }
} 