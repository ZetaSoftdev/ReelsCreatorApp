import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * Middleware to check subscription status and enforce usage limits
 * Used for protected routes that require an active subscription
 */
export async function subscriptionMiddleware(
  req: NextRequest,
  res: NextResponse
) {
  try {
    // Get authenticated user
    const session = await auth();
    
    // If no user, redirect to login
    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    
    // Get user with subscription data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true }
    });
    
    // If no user found in database (shouldn't happen)
    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    
    // If user is not subscribed, redirect to pricing page
    if (!user.isSubscribed) {
      return NextResponse.redirect(new URL('/pricing', req.url));
    }
    
    // If subscription period has ended, redirect to pricing page
    if (user.stripeCurrentPeriodEnd && user.stripeCurrentPeriodEnd < new Date()) {
      return NextResponse.redirect(new URL('/pricing?expired=true', req.url));
    }
    
    // If subscription status is not active, redirect to pricing page
    if (user.subscription && user.subscription.status !== 'active') {
      return NextResponse.redirect(new URL('/pricing?inactive=true', req.url));
    }
    
    // If user has used all their minutes, redirect to usage limit page
    if (
      user.subscription && 
      user.subscription.minutesUsed >= user.subscription.minutesAllowed
    ) {
      return NextResponse.redirect(new URL('/dashboard/limit-reached', req.url));
    }
    
    // Attach subscription data to request for use in API routes
    const requestWithSubscription = req.clone();
    // @ts-ignore - Adding custom property
    requestWithSubscription.subscription = user.subscription;
    
    // All checks passed, continue to route handler
    return NextResponse.next({
      request: requestWithSubscription
    });
    
  } catch (error) {
    console.error('Subscription middleware error:', error);
    
    // On error, allow request but log the issue
    return NextResponse.next();
  }
}

/**
 * Middleware to update minutes used when processing video
 * Should be called at the start of video processing
 */
export async function updateMinutesUsedMiddleware(
  userId: string,
  durationInSeconds: number
) {
  try {
    // Convert seconds to minutes, rounding up
    const minutes = Math.ceil(durationInSeconds / 60);
    
    // Update the subscription record
    await prisma.subscription.updateMany({
      where: { userId },
      data: {
        minutesUsed: {
          increment: minutes
        }
      }
    });
    
    return { success: true, minutesUsed: minutes };
  } catch (error) {
    console.error('Failed to update minutes used:', error);
    return { success: false, error };
  }
}

/**
 * Check if a user has a valid subscription
 * Returns true if subscription is active, false otherwise
 */
export async function checkSubscription(userId: string) {
  try {
    const users = await prisma.$queryRaw<Array<{
      isSubscribed: boolean;
      stripeCurrentPeriodEnd: Date | null;
    }>>`
      SELECT "isSubscribed", "stripeCurrentPeriodEnd"
      FROM "User"
      WHERE "id" = ${userId}
      LIMIT 1
    `;

    if (users.length === 0) {
      return false;
    }

    const user = users[0];
    
    return (
      user.isSubscribed && 
      user.stripeCurrentPeriodEnd && 
      new Date(user.stripeCurrentPeriodEnd) > new Date()
    );
  } catch (error) {
    console.error("Error checking subscription:", error);
    return false;
  }
} 