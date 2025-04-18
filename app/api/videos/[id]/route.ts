import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from '@prisma/client';

// Specify nodejs runtime for Prisma to work properly
export const runtime = 'nodejs';

// Create a global variable for PrismaClient to enable connection reuse
let prisma: PrismaClient;

// Initialize PrismaClient lazily to avoid multiple instances in development
function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

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
    
    // Get PrismaClient instance
    const prismaClient = getPrismaClient();
    
    // Check if video exists
    const video = await prismaClient.video.findUnique({
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
    await prismaClient.video.delete({
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