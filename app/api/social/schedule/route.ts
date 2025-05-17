import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PostStatus } from "@prisma/client";
import path from "path";
import fs from "fs";

/**
 * POST: Schedule a video to be published to a social media platform at a future time
 */
export async function POST(req: NextRequest) {
  try {
    // Get the user session
    const session = await auth();

    // Check if user is authenticated
    if (!session?.user?.id) {
      console.error("Unauthorized attempt to schedule social media post");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Parse request body
    const data = await req.json();
    const { socialAccountId, videoId, caption, hashtags = [], scheduledFor } = data;
    
    // Validate required fields
    if (!socialAccountId || !videoId || !scheduledFor) {
      console.error("Missing required fields for scheduling social media post");
      return NextResponse.json(
        { error: "Missing required fields: socialAccountId, videoId, and scheduledFor are required" },
        { status: 400 }
      );
    }
    
    // Validate that scheduled time is in the future
    const scheduledTime = new Date(scheduledFor);
    if (scheduledTime <= new Date()) {
      console.error("Scheduled time must be in the future");
      return NextResponse.json(
        { error: "Scheduled time must be in the future" },
        { status: 400 }
      );
    }
    
    console.log(`Processing social media schedule request for video: ${videoId} to account: ${socialAccountId} at ${scheduledFor}`);
    
    // Verify the social account belongs to the user and is active
    const account = await prisma.socialMediaAccount.findUnique({
      where: {
        id: socialAccountId,
        userId: session.user.id,
        isActive: true
      }
    });
    
    if (!account) {
      console.error(`Social account not found or inactive: ${socialAccountId}`);
      return NextResponse.json(
        { error: "Social account not found or inactive" },
        { status: 404 }
      );
    }
    
    // Verify the video belongs to the user
    const video = await prisma.editedVideo.findUnique({
      where: {
        id: videoId,
        userId: session.user.id
      }
    });
    
    if (!video) {
      console.error(`Video not found: ${videoId}`);
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }
    
    // Verify the video file exists
    const filePath = path.join(process.cwd(), 'public', video.filePath.replace(/^\//, ''));
    if (!fs.existsSync(filePath)) {
      console.error(`Video file not found at: ${filePath}`);
      return NextResponse.json(
        { error: "Video file not found" },
        { status: 404 }
      );
    }
    
    // Create a scheduled post record
    const scheduledPost = await prisma.scheduledPost.create({
      data: {
        userId: session.user.id,
        socialAccountId,
        videoId,
        caption: caption || video.title,
        hashtags,
        scheduledFor: scheduledTime,
        status: PostStatus.SCHEDULED
      }
    });
    
    console.log(`Created scheduled post record: ${scheduledPost.id} for ${scheduledTime.toISOString()}`);
    
    return NextResponse.json({
      success: true,
      message: `Video successfully scheduled to be published on ${account.platform} at ${scheduledTime.toISOString()}`,
      scheduledPost: {
        id: scheduledPost.id,
        platform: account.platform,
        scheduledFor: scheduledPost.scheduledFor,
        status: scheduledPost.status
      }
    });
    
  } catch (error: any) {
    console.error("Error scheduling social media post:", error);
    return NextResponse.json(
      { error: "Failed to schedule post", details: error.message },
      { status: 500 }
    );
  }
} 

/**
 * GET: Retrieve all scheduled posts for the current user
 */
export async function GET(req: NextRequest) {
  try {
    // Get the user session
    const session = await auth();

    // Check if user is authenticated
    if (!session?.user?.id) {
      console.error("Unauthorized access attempt to scheduled posts API");
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {
      userId: session.user.id
    };
    
    // Filter by status if provided
    if (status) {
      where.status = status;
    }
    
    // Count total posts matching criteria
    const totalPosts = await prisma.scheduledPost.count({ where });
    
    // Fetch posts with pagination
    const scheduledPosts = await prisma.scheduledPost.findMany({
      where,
      include: {
        socialAccount: {
          select: {
            platform: true,
            accountName: true
          }
        },
        video: {
          select: {
            title: true,
            filePath: true,
            duration: true
          }
        }
      },
      orderBy: {
        scheduledFor: 'asc'
      },
      skip,
      take: limit
    });
    
    console.log(`Found ${scheduledPosts.length} scheduled posts for user ${session.user.id}`);
    
    return NextResponse.json({
      scheduledPosts,
      pagination: {
        total: totalPosts,
        page,
        limit,
        totalPages: Math.ceil(totalPosts / limit)
      }
    });
    
  } catch (error: any) {
    console.error("Error fetching scheduled posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch scheduled posts", details: error.message },
      { status: 500 }
    );
  }
} 