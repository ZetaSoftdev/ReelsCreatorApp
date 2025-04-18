import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from '@/lib/railway-prisma';

// Specify nodejs runtime for Prisma to work properly
export const runtime = 'nodejs';

// DELETE request handler
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("DELETE /api/videos/[id]: Starting request");
    
    // Get the user session
    const session = await auth();

    // Check if user is authenticated
    if (!session || !session.user) {
      console.log("DELETE /api/videos/[id]: Unauthorized access");
      return NextResponse.json(
        { message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const videoId = params.id;
    console.log(`DELETE /api/videos/[id]: Processing delete for video ID: ${videoId}`);
    
    // Check if video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      console.log(`DELETE /api/videos/[id]: Video not found: ${videoId}`);
      return NextResponse.json(
        { message: "Video not found" },
        { status: 404 }
      );
    }

    // Check if user owns the video or is an admin
    if (video.userId !== session.user.id && session.user.role !== "ADMIN") {
      console.log(`DELETE /api/videos/[id]: Permission denied for user: ${session.user.id}`);
      return NextResponse.json(
        { message: "You don't have permission to delete this video" },
        { status: 403 }
      );
    }

    // Delete the video
    await prisma.video.delete({
      where: { id: videoId },
    });

    console.log(`DELETE /api/videos/[id]: Video successfully deleted: ${videoId}`);
    return NextResponse.json(
      { message: "Video deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting video:", error);
    return NextResponse.json(
      { message: "An error occurred while deleting the video" },
      { status: 500 }
    );
  }
} 