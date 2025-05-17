import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PostStatus } from "@prisma/client";
import path from "path";
import fs from "fs";
import { uploadVideo as uploadToYouTube } from "@/lib/social/api-clients/youtube";
import { uploadVideo as uploadToTikTok } from "@/lib/social/api-clients/tiktok";

/**
 * POST: Retry publishing a failed post
 */
export async function POST(
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
      console.error("Unauthorized attempt to retry post");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    console.log(`Attempting to retry failed post: ${postId}`);
    
    // Verify the post exists and belongs to the user
    const post = await prisma.scheduledPost.findUnique({
      where: {
        id: postId
      },
      include: {
        socialAccount: true,
        video: true
      }
    });
    
    if (!post) {
      console.error(`Post not found: ${postId}`);
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }
    
    if (post.userId !== session.user.id) {
      console.error(`Unauthorized retry attempt for post: ${postId}`);
      return NextResponse.json(
        { error: "Access denied - you don't own this post" },
        { status: 403 }
      );
    }
    
    // Only allow retrying failed posts
    if (post.status !== 'FAILED') {
      console.error(`Cannot retry post with status ${post.status}: ${postId}`);
      return NextResponse.json(
        { error: `Can only retry failed posts` },
        { status: 400 }
      );
    }
    
    // Set post to PROCESSING status
    await prisma.scheduledPost.update({
      where: {
        id: postId
      },
      data: {
        status: PostStatus.PROCESSING,
        failureReason: null
      }
    });
    
    console.log(`Post ${postId} set to PROCESSING status`);
    
    // Start an asynchronous process to retry the publishing
    // We don't await this so we can return to the client quickly
    retryPublishing(post, session.user.id).catch(error => {
      console.error(`Background publish retry failed for post ${postId}:`, error);
    });
    
    return NextResponse.json({
      success: true,
      message: "Publishing retry initiated"
    });
    
  } catch (error: any) {
    console.error("Error retrying post:", error);
    return NextResponse.json(
      { error: "Failed to retry post", details: error.message },
      { status: 500 }
    );
  }
}

async function retryPublishing(post: any, userId: string) {
  try {
    console.log(`Starting background publishing for post ${post.id}`);
    
    // Check if file exists
    const filePath = path.join(process.cwd(), 'public', post.video.filePath.replace(/^\//, ''));
    if (!fs.existsSync(filePath)) {
      throw new Error('Video file not found');
    }
    
    // Prepare variables for publishing result
    let postUrl = '';
    let externalId = '';
    let status: PostStatus = PostStatus.PUBLISHED;
    let failureReason = null;
    
    // Call platform-specific upload function
    try {
      switch (post.socialAccount.platform) {
        case 'YOUTUBE':
          console.log('Retrying YouTube publish...');
          const youtubeResult = await uploadToYouTube(
            post.socialAccount,
            filePath,
            post.caption || post.video.title,
            `${post.caption || post.video.title}\n\n${post.hashtags.map((tag: string) => `#${tag}`).join(' ')}`,
            post.hashtags
          );
          postUrl = youtubeResult.url;
          externalId = youtubeResult.id;
          break;
          
        case 'TIKTOK':
          console.log('Retrying TikTok publish...');
          const tiktokResult = await uploadToTikTok(
            post.socialAccount,
            filePath,
            post.caption || post.video.title,
            post.caption || post.video.title,
            post.hashtags
          );
          postUrl = tiktokResult.url;
          externalId = tiktokResult.id;
          break;
          
        case 'INSTAGRAM':
        case 'FACEBOOK':
        case 'TWITTER':
          // Simulate success for platforms we haven't implemented yet
          console.log(`Simulating publish to ${post.socialAccount.platform}`);
          postUrl = `https://example.com/${post.socialAccount.platform.toLowerCase()}/post/${Date.now()}`;
          externalId = `sim-${Date.now()}`;
          break;
          
        default:
          throw new Error(`Unsupported platform: ${post.socialAccount.platform}`);
      }
    } catch (error: any) {
      console.error(`Error during retry for ${post.socialAccount.platform}:`, error);
      status = PostStatus.FAILED;
      failureReason = error.message || 'Unknown error during publishing retry';
    }
    
    // Update the post with the result
    await prisma.scheduledPost.update({
      where: {
        id: post.id
      },
      data: {
        status,
        failureReason,
        postUrl: status === PostStatus.PUBLISHED ? postUrl : undefined,
      }
    });
    
    console.log(`Retry completed for post ${post.id} with status ${status}`);
    
  } catch (error: any) {
    console.error('Error in retryPublishing:', error);
    
    // Update post status to FAILED
    await prisma.scheduledPost.update({
      where: {
        id: post.id
      },
      data: {
        status: PostStatus.FAILED,
        failureReason: error.message || 'Unknown error during publishing retry'
      }
    });
  }
} 