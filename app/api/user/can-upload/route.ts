import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get the authenticated user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { allowed: false, message: 'Authentication required' }, 
        { status: 401 }
      );
    }
    
    // Log session info for debugging
    console.log("Session user info:", {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name
    });

    // Try to find user with fallbacks
    let user = null;
    
    // First try with id
    if (session.user.id) {
      console.log("Looking up user by id:", session.user.id);
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { subscription: true }
      });
    }
    
    // If not found and email exists, try with email
    if (!user && session.user.email) {
      console.log("Looking up user by email:", session.user.email);
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { subscription: true }
      });
      
      // If found by email but ID doesn't match, update the user record with correct ID
      if (user && session.user.id && user.id !== session.user.id) {
        console.log(`User found by email but ID mismatch. Updating from ${user.id} to ${session.user.id}`);
        try {
          user = await prisma.user.update({
            where: { email: session.user.email },
            data: { id: session.user.id },
            include: { subscription: true }
          });
          console.log("Successfully updated user ID to match session ID");
        } catch (updateError) {
          console.error("Error updating user ID:", updateError);
          
          // If we can't update the ID, we need to decide what to do:
          // Option 1: Continue with the existing user record anyway
          console.log("Continuing with existing user record despite ID mismatch");
          
          // Option 2 (Alternative): Try to create a new record with the session ID
          // This would be implemented here if you prefer this approach
        }
      }
    }
    
    // Create user if not found
    if (!user && session.user.email) {
      console.log("Creating new user record for:", session.user.email);
      user = await prisma.user.create({
        data: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name || "",
          profileImage: session.user.image || "",
          isSubscribed: false
        },
        include: { subscription: true }
      });
    }

    // Final check if user exists
    if (!user) {
      console.error("Failed to find or create user");
      return NextResponse.json(
        { allowed: false, message: 'User account not found. Please try logging out and back in.' }, 
        { status: 404 }
      );
    }

    // Count user's videos
    const videoCount = await prisma.video.count({
      where: { userId: user.id }
    });

    // Check if user is subscribed
    if (user.isSubscribed) {
      // Subscribed users - check subscription status and limits
      
      // Check if subscription is expired
      if (
        user.stripeCurrentPeriodEnd && 
        user.stripeCurrentPeriodEnd < new Date()
      ) {
        return NextResponse.json({
          allowed: false, 
          message: 'Your subscription has expired. Please renew to continue uploading.',
          code: 'subscription_expired',
          redirectTo: '/dashboard/pricing'
        });
      }

      // Check if user has exceeded their minutes allowance
      if (
        user.subscription && 
        user.subscription.minutesUsed >= user.subscription.minutesAllowed
      ) {
        return NextResponse.json({
          allowed: false, 
          message: `You've reached your ${user.subscription.minutesAllowed} minutes limit. Please upgrade your plan for more.`,
          code: 'usage_limit_reached',
          usedMinutes: user.subscription.minutesUsed,
          allowedMinutes: user.subscription.minutesAllowed,
          redirectTo: '/dashboard/pricing'
        });
      }

      // Subscribed user with valid subscription can upload
      return NextResponse.json({ 
        allowed: true,
        message: 'You can upload videos',
        subscription: {
          minutesUsed: user.subscription?.minutesUsed || 0,
          minutesAllowed: user.subscription?.minutesAllowed || 0,
          plan: user.subscription?.plan || 'Unknown'
        }
      });
    } else {
      // Non-subscribed users - check if they've used their free video
      if (videoCount < 5) {
        // Allow one free video
        return NextResponse.json({
          allowed: true,
          message: 'You can upload 5 videos for free',
          freeUpload: true,
          videoCount
        });
      } else {
        // Free video already used - need subscription
        return NextResponse.json({
          allowed: false,
          message: 'You have used your free video. Please subscribe to upload more videos.',
          code: 'subscription_required',
          videoCount,
          redirectTo: '/dashboard/pricing'
        });
      }
    }
    
  } catch (error: any) {
    console.error('Error checking upload permission:', error);
    
    return NextResponse.json(
      { 
        allowed: false, 
        message: 'Failed to check upload permission',
        error: error.message
      }, 
      { status: 500 }
    );
  }
} 