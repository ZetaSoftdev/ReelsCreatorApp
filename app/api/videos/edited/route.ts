import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    console.log("=== POST /api/videos/edited - Saving edited video ===");
    
    // Get the user session
    const session = await auth();

    // Check if user is authenticated
    if (!session || !session.user) {
      console.error("Unauthorized access attempt - no valid session");
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }
    
    console.log("User authenticated:", session.user.id);

    // Get video data from request body
    let data;
    try {
      data = await req.json();
      console.log("Received edited video data:", {
        title: data.title,
        fileSize: data.fileSize,
        duration: data.duration,
        sourceType: data.sourceType,
        sourceId: data.sourceId
      });
    } catch (parseError: any) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request body", details: parseError.message },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ['title', 'sourceType', 'sourceId', 'fileSize', 'duration', 'filePath'];
    for (const field of requiredFields) {
      if (!data[field]) {
        console.error(`Missing required field: ${field}`);
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Use the userId from the data or fallback to the session user id
    const userId = data.userId || session.user.id;
    console.log("Using user ID:", userId);

    // Verify that the user exists
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: userId }
      });
    } catch (dbError: any) {
      console.error("Database error when finding user:", dbError);
      return NextResponse.json(
        { error: "Database error when finding user", details: dbError.message },
        { status: 500 }
      );
    }

    if (!user) {
      console.error("User not found:", userId);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    console.log("User found, creating edited video record");

    // Create the edited video record in the database
    let editedVideo;
    try {
      editedVideo = await prisma.editedVideo.create({
        data: {
          userId,
          title: data.title,
          sourceType: data.sourceType,
          sourceId: data.sourceId,
          fileSize: data.fileSize,
          duration: data.duration,
          filePath: data.filePath,
          captionStyle: data.captionStyle || null
        }
      });
      console.log("Edited video record created successfully with ID:", editedVideo.id);
    } catch (dbError: any) {
      console.error("Database error when creating edited video:", dbError);
      return NextResponse.json(
        { error: "Failed to create edited video record", details: dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: "Edited video saved to database", 
        editedVideo 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Unhandled error saving edited video:", error);
    return NextResponse.json(
      { error: "Failed to save edited video", details: error.message },
      { status: 500 }
    );
  }
}

// GET request handler to list edited videos for the current user
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
    const search = url.searchParams.get("search") || "";

    // Calculate pagination values
    const skip = (page - 1) * limit;

    // Build the where clause
    const where = {
      userId: session.user.id,
      ...(search ? {
        title: {
          contains: search,
          mode: Prisma.QueryMode.insensitive,
        }
      } : {}),
    };

    // Count total edited videos
    const total = await prisma.editedVideo.count({ where });

    // Get edited videos with pagination
    const editedVideos = await prisma.editedVideo.findMany({
      where,
      orderBy: {
        editedAt: "desc"
      },
      skip,
      take: limit
    });

    // Return edited videos
    return NextResponse.json({
      editedVideos,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error("Error fetching edited videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch edited videos", details: error.message },
      { status: 500 }
    );
  }
} 