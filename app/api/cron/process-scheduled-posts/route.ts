import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SocialPlatform, PostStatus } from "@prisma/client";
import path from "path";
import fs from "fs";
import { uploadVideo as uploadToYouTube } from "@/lib/social/api-clients/youtube";

/**
 * Process scheduled posts that are due to be published
 * This would typically be called by a cron job
 */
export async function GET(req: NextRequest) {
  try {
    // Verify the request is authorized (simple API key check)
    const apiKey = req.headers.get('x-api-key');
    const validApiKey = process.env.CRON_API_KEY || 'default_cron_key';
    
    if (apiKey !== validApiKey) {
      console.error("Unauthorized cron job attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    console.log("Processing scheduled posts");
    
    // Get the current time
    const now = new Date();
    
    // Find all posts that are scheduled for now or in the past and are still in SCHEDULED status
    const scheduledPosts = await prisma.scheduledPost.findMany({
      where: {
        scheduledFor: {
          lte: now
        },
        status: PostStatus.SCHEDULED
      },
      include: {
        socialAccount: true,
        video: true
      }
    });
    
    console.log(`Found ${scheduledPosts.length} posts to process`);
    
    // Process each post
    const results = await Promise.allSettled(
      scheduledPosts.map(async (post) => {
        // Mark the post as processing
        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: { status: PostStatus.PROCESSING }
        });
        
        try {
          // Check if the video file exists
          const filePath = path.join(process.cwd(), 'public', post.video.filePath.replace(/^\//, ''));
          if (!fs.existsSync(filePath)) {
            throw new Error(`Video file not found at: ${filePath}`);
          }
          
          // Publish based on platform
          let publishResult;
          
          switch (post.socialAccount.platform) {
            case 'YOUTUBE':
              publishResult = await uploadToYouTube(
                post.socialAccount,
                filePath,
                post.caption || post.video.title,
                `${post.caption || post.video.title}\n\n${post.hashtags?.map((tag: string) => `#${tag}`).join(' ') || ''}`,
                post.hashtags || []
              );
              break;
              
            // For other platforms, we would implement similar functionality
            default:
              throw new Error(`Platform ${post.socialAccount.platform} publishing not implemented`);
          }
          
          // Mark the post as published
          await prisma.scheduledPost.update({
            where: { id: post.id },
            data: { 
              status: PostStatus.PUBLISHED,
              postUrl: publishResult.url,
              updatedAt: new Date()
            }
          });
          
          return {
            id: post.id,
            status: 'published',
            platform: post.socialAccount.platform,
            url: publishResult.url
          };
        } catch (error: any) {
          console.error(`Error publishing scheduled post ${post.id}:`, error);
          
          // Mark the post as failed
          await prisma.scheduledPost.update({
            where: { id: post.id },
            data: { 
              status: PostStatus.FAILED,
              failureReason: error.message || 'Unknown error',
              updatedAt: new Date()
            }
          });
          
          return {
            id: post.id,
            status: 'failed',
            error: error.message
          };
        }
      })
    );
    
    return NextResponse.json({ 
      processed: scheduledPosts.length,
      results
    });
  } catch (error: any) {
    console.error("Error processing scheduled posts:", error);
    return NextResponse.json(
      { error: "Failed to process scheduled posts", details: error.message },
      { status: 500 }
    );
  }
} 