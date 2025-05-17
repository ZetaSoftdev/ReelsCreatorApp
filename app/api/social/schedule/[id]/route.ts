import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * DELETE: Remove a scheduled post by ID
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;
    
    if (!postId) {
      console.error("No post ID provided");
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }
    
    // Get the user session
    const session = await auth();

    // Check if user is authenticated
    if (!session?.user?.id) {
      console.error("Unauthorized attempt to delete scheduled post");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    console.log(`Attempting to delete scheduled post: ${postId}`);
    
    // Verify the post exists and belongs to the user
    const post = await prisma.scheduledPost.findUnique({
      where: {
        id: postId
      },
      select: {
        userId: true,
        status: true
      }
    });
    
    if (!post) {
      console.error(`Scheduled post not found: ${postId}`);
      return NextResponse.json(
        { error: "Scheduled post not found" },
        { status: 404 }
      );
    }
    
    if (post.userId !== session.user.id) {
      console.error(`Unauthorized deletion attempt for post: ${postId}`);
      return NextResponse.json(
        { error: "Access denied - you don't own this post" },
        { status: 403 }
      );
    }
    
    // Only allow deletion of scheduled posts, not ones that are already processing, published, or failed
    if (post.status !== 'SCHEDULED') {
      console.error(`Cannot delete post with status ${post.status}: ${postId}`);
      return NextResponse.json(
        { error: `Cannot delete a post that is already ${post.status.toLowerCase()}` },
        { status: 400 }
      );
    }
    
    // Delete the post
    await prisma.scheduledPost.delete({
      where: {
        id: postId
      }
    });
    
    console.log(`Successfully deleted scheduled post: ${postId}`);
    
    return NextResponse.json({
      success: true,
      message: "Scheduled post deleted successfully"
    });
    
  } catch (error: any) {
    console.error("Error deleting scheduled post:", error);
    return NextResponse.json(
      { error: "Failed to delete scheduled post", details: error.message },
      { status: 500 }
    );
  }
} 