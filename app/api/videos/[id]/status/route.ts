import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the authenticated user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }

    // Get video ID from params
    const videoId = params.id;
    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' }, 
        { status: 400 }
      );
    }

    // Find the video and check ownership
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: { user: { include: { subscription: true } } }
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' }, 
        { status: 404 }
      );
    }

    // Check if video belongs to the authenticated user
    if (video.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this video' }, 
        { status: 403 }
      );
    }

    // Get the user with subscription
    const user = video.user;

    // Get new status and additional data from request body
    const { status, processedAt, finalDuration, errorMessage } = await req.json();

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' }, 
        { status: 400 }
      );
    }

    // Use transaction to update both video status and subscription minutes if needed
    const result = await prisma.$transaction(async (tx) => {
      // Update the video status
      const updatedVideo = await tx.video.update({
        where: { id: videoId },
        data: {
          status,
          // Set processedAt if status is 'completed' and it's not already set
          ...(status === "completed" && !video.processedAt ? { 
            processedAt: processedAt ? new Date(processedAt) : new Date() 
          } : {}),
          // Update duration if final duration is provided and different
          ...(finalDuration && finalDuration !== video.duration ? {
            duration: finalDuration
          } : {}),
          // Add error message if status is 'failed'
          ...(status === "failed" && errorMessage ? { 
            error: errorMessage 
          } : {})
        }
      });

      // If status is completed and user has an active subscription, update minutes used
      // This handles cases where final duration differs from initial estimate
      if (status === "completed" && user.subscription && finalDuration) {
        // Get the difference in duration (if any)
        const initialDuration = video.duration;
        const durationDiff = finalDuration - initialDuration;
        
        // Only update if there's a significant difference (more than 1 second)
        if (Math.abs(durationDiff) > 1) {
          // Convert seconds to minutes (rounded up)
          const minutesDiff = Math.ceil(durationDiff / 60);
          
          console.log(`===== UPDATING SUBSCRIPTION MINUTES USED (STATUS UPDATE) =====`);
          console.log(`User ID: ${user.id}`);
          console.log(`Video ID: ${videoId}`);
          console.log(`Initial duration: ${initialDuration} seconds`);
          console.log(`Final duration: ${finalDuration} seconds`);
          console.log(`Duration difference: ${durationDiff} seconds`);
          console.log(`Minutes to add/subtract: ${minutesDiff}`);
          
          if (minutesDiff !== 0) {
            // Update subscription record with adjusted minutes
            await tx.subscription.update({
              where: { id: user.subscription.id },
              data: {
                minutesUsed: {
                  increment: minutesDiff
                }
              }
            });
            
            console.log(`✅ Updated subscription minutes used with adjustment: ${minutesDiff}`);
          }
        }
      }
      
      return { updatedVideo };
    });

    return NextResponse.json({
      success: true,
      message: `Video status updated to ${status}`,
      video: result.updatedVideo
    });
  } catch (error: any) {
    console.error('Error updating video status:', error);
    
    return NextResponse.json(
      { error: 'Failed to update video status', details: error.message }, 
      { status: 500 }
    );
  }
} 