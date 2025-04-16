import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// DELETE request handler
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the user session
    const session = await auth();

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Unauthorized access" },
        { status: 401 }
      );
    }

    const videoId = params.id;
    
    // Check if video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      return NextResponse.json(
        { message: "Video not found" },
        { status: 404 }
      );
    }

    // Check if user owns the video or is an admin
    if (video.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "You don't have permission to delete this video" },
        { status: 403 }
      );
    }

    // Delete the video
    await prisma.video.delete({
      where: { id: videoId },
    });

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