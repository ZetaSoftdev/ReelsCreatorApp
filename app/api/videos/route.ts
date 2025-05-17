import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { VideoWithExternalFields } from "@/types/database";

// POST request handler to create a new video record
export async function POST(req: NextRequest) {
  try {
    console.log("=== POST /api/videos - Saving new video ===");
    
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
      console.log("Received video data:", {
        title: data.title,
        fileSize: data.fileSize,
        duration: data.duration,
        status: data.status,
        externalJobId: data.externalJobId
      });
    } catch (parseError: any) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request body", details: parseError.message },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ['title', 'originalUrl', 'duration', 'fileSize', 'status', 'uploadPath'];
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

    // Verify that the user exists and get subscription information
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
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
    
    console.log("User found, subscription status:", user.subscription?.status || "no subscription");

    // Create the video record in the database using a transaction to ensure both operations complete
    let video;
    try {
      console.log("Starting database transaction to save video");
      video = await prisma.$transaction(async (tx) => {
        // Create video record
        console.log("Creating video record");
        const newVideo = await tx.video.create({
          data: {
            userId,
            title: data.title,
            description: data.description || "",
            originalUrl: data.originalUrl,
            duration: data.duration,
            fileSize: data.fileSize,
            status: data.status,
            uploadPath: data.uploadPath,
            // Add the external job ID if provided
            externalJobId: data.externalJobId as string | undefined,
            // Add the initial status check timestamp
            lastStatusCheck: new Date() as any
          }
        });
        console.log("Video record created successfully with ID:", newVideo.id);

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
      console.log("Database transaction completed successfully");
    } catch (txError: any) {
      console.error("Transaction error when saving video:", txError);
      return NextResponse.json(
        { error: "Database transaction failed", details: txError.message },
        { status: 500 }
      );
    }

    console.log("Video saved successfully, returning response");
    return NextResponse.json(
      { 
        success: true, 
        message: "Video saved to database", 
        video 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Unhandled error saving video:", error);
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
    const skipStatusCheck = url.searchParams.get("skipStatusCheck") === "true";
    const forceSkipExternalCheck = url.searchParams.get("forceSkipExternalCheck") === "true" || false;

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

    // Cast videos to our custom type for TypeScript compatibility
    const videosWithExternalFields = videos as unknown as VideoWithExternalFields[];

    // Check for processing videos and update status if needed
    if (!skipStatusCheck && !forceSkipExternalCheck) {
      try {
        const processingVideos = videosWithExternalFields.filter(
          (video) => video.status === "processing" && video.externalJobId
        );

        // If we have processing videos, check their status
        for (const video of processingVideos) {
          try {
            // Only check if not checked recently (last 30 seconds)
            const lastChecked = video.lastStatusCheck || new Date(0);
            if (Date.now() - lastChecked.getTime() < 30000) continue;

            // Update last check time first to prevent concurrent checks
            await prisma.video.update({
              where: { id: video.id },
              data: { 
                // Use any to bypass TypeScript error until prisma generate works
                lastStatusCheck: new Date() as any
              }
            });

            // Get API endpoint from environment or use default
            const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || 'https://api.editur.ai/api/v1';
            
            // Check job status
            const response = await fetch(`${API_ENDPOINT}/jobs/${video.externalJobId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'X-API-Key': process.env.API_KEY || 'test-key-123'
              },
              // Add timeout to prevent long waiting periods
              signal: AbortSignal.timeout(10000) // 10 second timeout
            });

            if (response.ok) {
              const statusData = await response.json();
              
              if (statusData.status === "completed") {
                // Get job details
                const detailsResponse = await fetch(`${API_ENDPOINT}/jobs/${video.externalJobId}/details`, {
                  method: 'GET',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': process.env.API_KEY || 'test-key-123'
                  },
                  // Add timeout to prevent long waiting periods
                  signal: AbortSignal.timeout(10000) // 10 second timeout
                });

                if (detailsResponse.ok) {
                  const detailsData = await detailsResponse.json();
                  
                  // Update video status
                  await prisma.video.update({
                    where: { id: video.id },
                    data: {
                      status: "completed",
                      processedAt: new Date()
                    }
                  });

                  // Save clips to database if there are results
                  if (detailsData.results && detailsData.results.length > 0) {
                    // Process video results
                    const videoResults = detailsData.results.filter(
                      (result: any) => result.result_type === "video"
                    );
                    
                    const subtitleResults = detailsData.results.filter(
                      (result: any) => result.result_type === "subtitles"
                    );
                    
                    const wordTimestampResults = detailsData.results.filter(
                      (result: any) => result.result_type === "word_timestamps"
                    );

                    // Group related items together
                    const processedClips = videoResults.map((videoResult: any) => {
                      const videoFilename = videoResult.metadata.filename;

                      // Find matching subtitle and word timestamp files
                      const subtitleResult = subtitleResults.find(
                        (s: any) => s.metadata.video_filename === videoFilename
                      );

                      const wordTimestampsResult = wordTimestampResults.find(
                        (w: any) => w.metadata.video_filename === videoFilename
                      );

                      return {
                        videoResult,
                        subtitleResult,
                        wordTimestampsResult
                      };
                    });

                    // Save clips
                    await prisma.$transaction(async (tx) => {
                      for (const clip of processedClips) {
                        if (clip.videoResult) {
                          await tx.clip.create({
                            data: {
                              videoId: video.id,
                              title: clip.videoResult.metadata.title || "Untitled Clip",
                              url: clip.videoResult.url,
                              startTime: clip.videoResult.metadata.start_time,
                              endTime: clip.videoResult.metadata.end_time,
                              duration: clip.videoResult.metadata.duration,
                              reason: clip.videoResult.metadata.reason,
                              filename: clip.videoResult.metadata.filename,
                              withCaptions: clip.videoResult.metadata.with_captions || false,
                              hasSrt: clip.videoResult.metadata.has_srt || false,
                              hasWordTimestamps: clip.videoResult.metadata.has_word_timestamps || false,
                              // Add subtitle info if available
                              subtitleUrl: clip.subtitleResult?.url,
                              subtitleId: clip.subtitleResult?.id,
                              subtitleFormat: clip.subtitleResult?.metadata.format,
                              // Add word timestamp info if available
                              wordTimestampUrl: clip.wordTimestampsResult?.url,
                              wordTimestampId: clip.wordTimestampsResult?.id,
                              wordTimestampFormat: clip.wordTimestampsResult?.metadata.format
                            }
                          });
                        }
                      }
                    });
                  }
                }
              } else if (statusData.status === "failed") {
                // Update video with error status
                await prisma.video.update({
                  where: { id: video.id },
                  data: {
                    status: "failed",
                    error: statusData.error || "Processing failed"
                  }
                });
              }
            }
          } catch (error: any) {
            console.error(`Error checking status for video ${video.id}:`, error);
            
            // If the error is about disk space or a timeout, mark all API checks as skipped
            if (error.message?.includes("No space left on device") || 
                error.message?.includes("timed out") ||
                error.name === "AbortError") {
              // Exit the loop and don't try to check more videos when the API is down
              console.error("External API appears to be down or unavailable - skipping further checks");
              // Don't update the status, just skip checking for now
              break;
            }
            // Don't update status on connection error - will try again next time
          }
        }

        // Refresh videos list if any processing videos were checked
        if (processingVideos.length > 0) {
          // Get fresh videos with updated status
          const refreshedVideos = await prisma.video.findMany({
            where,
            orderBy: {
              uploadedAt: "desc"
            },
            skip,
            take: limit
          });
          
          // Return refreshed videos
          return NextResponse.json({
            videos: refreshedVideos,
            pagination: {
              total,
              page,
              limit,
              totalPages: Math.ceil(total / limit)
            },
            externalApiStatus: "checked"
          });
        }
      } catch (apiCheckError: any) {
        console.error("Error during external API check:", apiCheckError);
        // Don't fail the entire request if the API check fails
        // Just return videos without checking external status
      }
    }

    // Return videos
    return NextResponse.json({
      videos: videosWithExternalFields,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      externalApiStatus: forceSkipExternalCheck ? "skipped" : "checked"
    });
  } catch (error: any) {
    console.error("Error fetching videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos", details: error.message },
      { status: 500 }
    );
  }
} 