import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { updateMinutesUsedMiddleware } from '@/middleware/subscription';

// Force this route to be treated as server-side
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }

    // Parse request body
    const { videoId, duration } = await req.json();
    
    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' }, 
        { status: 400 }
      );
    }

    // Get user with subscription data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      );
    }

    // Check if user has an active subscription
    if (!user.isSubscribed) {
      return NextResponse.json(
        { error: 'Subscription required', code: 'subscription_required' }, 
        { status: 403 }
      );
    }

    // Check if subscription is expired
    if (
      user.stripeCurrentPeriodEnd && 
      user.stripeCurrentPeriodEnd < new Date()
    ) {
      return NextResponse.json(
        { error: 'Subscription expired', code: 'subscription_expired' }, 
        { status: 403 }
      );
    }

    // Check if user has exceeded their minutes allowance
    if (
      user.subscription && 
      user.subscription.minutesUsed >= user.subscription.minutesAllowed
    ) {
      return NextResponse.json(
        { 
          error: 'Usage limit reached', 
          code: 'usage_limit_reached',
          used: user.subscription.minutesUsed,
          allowed: user.subscription.minutesAllowed
        }, 
        { status: 403 }
      );
    }

    // Find the video
    const video = await prisma.video.findUnique({
      where: {
        id: videoId,
        userId: user.id // Ensure the video belongs to the user
      }
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' }, 
        { status: 404 }
      );
    }

    // Update minutes used
    const durationInSeconds = duration || video.duration || 0;
    await updateMinutesUsedMiddleware(user.id, durationInSeconds);

    // Update video status to processing
    await prisma.video.update({
      where: { id: videoId },
      data: { status: 'processing' }
    });

    // Here we would normally start the actual video processing
    // This is just a placeholder for the actual implementation

    return NextResponse.json({ 
      success: true, 
      message: 'Video processing started' 
    });
  } catch (error: any) {
    console.error('Error processing video:', error);
    
    return NextResponse.json(
      { error: 'Failed to process video', details: error.message }, 
      { status: 500 }
    );
  }
} 