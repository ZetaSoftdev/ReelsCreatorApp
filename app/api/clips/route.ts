import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST request handler to create clip records
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

    // Get data from request body
    const data = await req.json();
    const { videoId, clips } = data;

    if (!videoId || !clips || !Array.isArray(clips)) {
      return NextResponse.json(
        { error: "Missing required fields: videoId and clips array" },
        { status: 400 }
      );
    }

    // Check if the video exists and belongs to this user
    const video = await prisma.video.findFirst({
      where: {
        id: videoId,
        userId: session.user.id
      }
    });

    if (!video) {
      return NextResponse.json(
        { error: "Video not found or you don't have permission to add clips to it" },
        { status: 404 }
      );
    }

    // Track total duration in seconds for updating minutes used
    let totalDurationSeconds = 0;

    // Process each clip and create records
    const savedClips = await Promise.all(
      clips.map(async (clip) => {
        const { videoResult, subtitleResult, wordTimestampsResult } = clip;
        
        // Skip if missing video result
        if (!videoResult) return null;

        // Add clip duration to total
        const clipDuration = videoResult.metadata.duration || 0;
        totalDurationSeconds += clipDuration;

        try {
          return await prisma.clip.create({
            data: {
              videoId,
              title: videoResult.metadata.reason || `Clip from ${video.title}`,
              url: videoResult.url,
              startTime: videoResult.metadata.start_time || 0,
              endTime: videoResult.metadata.end_time || 0,
              duration: clipDuration,
              reason: videoResult.metadata.reason,
              externalId: videoResult.id,
              externalCreatedAt: new Date(videoResult.created_at),
              filename: videoResult.metadata.filename,
              withCaptions: videoResult.metadata.with_captions || false,
              hasSrt: videoResult.metadata.has_srt || false,
              hasWordTimestamps: videoResult.metadata.has_word_timestamps || false,
              
              // Subtitle information if available
              subtitleUrl: subtitleResult?.url || null,
              subtitleId: subtitleResult?.id || null,
              subtitleFormat: subtitleResult?.metadata?.format || null,
              
              // Word timestamp information if available
              wordTimestampUrl: wordTimestampsResult?.url || null,
              wordTimestampId: wordTimestampsResult?.id || null,
              wordTimestampFormat: wordTimestampsResult?.metadata?.format || null
            }
          });
        } catch (clipError) {
          console.error("Error creating clip:", clipError, "Clip data:", clip);
          return null;
        }
      })
    );

    // Filter out any null results from failed clip creations
    const validClips = savedClips.filter(Boolean);

    // Convert seconds to minutes and update user's subscription minutesUsed
    if (totalDurationSeconds > 0) {
      try {
        // Find user's subscription
        const subscription = await prisma.subscription.findFirst({
          where: { userId: session.user.id }
        });

        if (subscription) {
          // HYBRID MODEL: Count 90% of input video duration + 10% of output clips duration
          
          // Get input video duration in seconds
          const inputVideoDurationSeconds = video.duration || 0;
          
          // Calculate weighted durations (90% input, 10% output)
          const inputWeightedSeconds = inputVideoDurationSeconds * 0.9;
          const outputWeightedSeconds = totalDurationSeconds * 0.1;
          
          // Total weighted duration in seconds
          const totalWeightedSeconds = inputWeightedSeconds + outputWeightedSeconds;
          
          // Convert seconds to minutes (rounded up to the nearest minute)
          const weightedMinutes = Math.ceil(totalWeightedSeconds / 60);
          
          console.log(`===== HYBRID MODEL MINUTES CALCULATION =====`);
          console.log(`User ID: ${session.user.id}`);
          console.log(`Video ID: ${videoId}`);
          console.log(`Input video duration: ${inputVideoDurationSeconds} seconds`);
          console.log(`Output clips total duration: ${totalDurationSeconds} seconds`);
          console.log(`Input weighted (90%): ${inputWeightedSeconds} seconds`);
          console.log(`Output weighted (10%): ${outputWeightedSeconds} seconds`);
          console.log(`Total weighted duration: ${totalWeightedSeconds} seconds`);
          console.log(`Final minutes (rounded up): ${weightedMinutes} minutes`);
          console.log(`Current minutes used: ${subscription.minutesUsed} minutes`);
          console.log(`New minutes used will be: ${subscription.minutesUsed + weightedMinutes} minutes`);
          console.log(`Minutes allowed in plan: ${subscription.minutesAllowed} minutes`);
          console.log(`=====================================`);
          
          // Update the minutesUsed field
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              minutesUsed: {
                increment: weightedMinutes
              }
            }
          });

          // Log the update confirmation
          console.log(`✅ Successfully updated minutes used for user ${session.user.id}`);
        }
      } catch (error) {
        console.error("Error updating subscription minutes:", error);
        // Don't fail the whole operation if updating minutes fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Saved ${validClips.length} of ${clips.length} clips`,
      clips: validClips
    });
  } catch (error: any) {
    console.error("Error saving clips:", error);
    return NextResponse.json(
      { error: "Failed to save clips", details: error.message },
      { status: 500 }
    );
  }
}

// GET request handler to fetch clips for the current user
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
    const limit = parseInt(url.searchParams.get("limit") || "6"); // Default to 6 to match UI
    const videoId = url.searchParams.get("videoId");

    // Calculate pagination values
    const skip = (page - 1) * limit;

    // Build the where clause to get clips for this user
    const where = {
      video: {
        userId: session.user.id
      },
      ...(videoId ? { videoId } : {})
    };

    // Count total clips
    const total = await prisma.clip.count({ 
      where 
    });

    console.log('Clips count query where clause:', where);
    console.log('Total clips count:', total);

    // Get clips with pagination
    const clips = await prisma.clip.findMany({
      where,
      orderBy: {
        createdAt: "desc"
      },
      include: {
        video: {
          select: {
            title: true,
            description: true
          }
        }
      },
      skip,
      take: limit
    });

    console.log('Found clips:', clips.length);
    console.log('Pagination details:', { total, page, limit, totalPages: Math.ceil(total / limit) });

    // Format clips to match the structure expected by the frontend
    const formattedClips = clips.map(clip => ({
      videoResult: {
        id: clip.externalId || clip.id,
        url: clip.url,
        result_type: "video",
        metadata: {
          filename: clip.filename || `clip_${clip.id}.mp4`,
          start_time: clip.startTime || 0,
          end_time: clip.endTime || 0,
          duration: clip.duration || 0,
          with_captions: clip.withCaptions || false,
          has_srt: clip.hasSrt || false,
          has_word_timestamps: clip.hasWordTimestamps || false,
          title: clip.title || `Clip from ${clip.video?.title || "video"}`,
          reason: clip.reason
        },
        created_at: clip.externalCreatedAt?.toISOString() || clip.createdAt.toISOString()
      },
      subtitleResult: clip.subtitleUrl ? {
        id: clip.subtitleId || `subtitle_${clip.id}`,
        url: clip.subtitleUrl,
        result_type: "subtitles",
        metadata: {
          format: clip.subtitleFormat || "srt",
          video_filename: clip.filename || `clip_${clip.id}.mp4`
        },
        created_at: clip.createdAt.toISOString()
      } : undefined,
      wordTimestampsResult: clip.wordTimestampUrl ? {
        id: clip.wordTimestampId || `word_timestamps_${clip.id}`,
        url: clip.wordTimestampUrl,
        result_type: "word_timestamps",
        metadata: {
          format: clip.wordTimestampFormat || "json",
          video_filename: clip.filename || `clip_${clip.id}.mp4`
        },
        created_at: clip.createdAt.toISOString()
      } : undefined
    }));

    const response = {
      clips: formattedClips,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };

    console.log('Sending response with pagination:', response.pagination);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error fetching clips:", error);
    return NextResponse.json(
      { error: "Failed to fetch clips", details: error.message },
      { status: 500 }
    );
  }
} 