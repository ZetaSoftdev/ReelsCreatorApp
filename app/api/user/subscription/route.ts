import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get the authenticated user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      );
    }
    
    // Get user with subscription data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { 
        subscription: {
          include: {
            subscriptionPlan: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      );
    }

    // If user has no subscription, return empty subscription data
    if (!user.subscription) {
      return NextResponse.json({
        hasSubscription: false,
        isSubscribed: !!user.isSubscribed,
        subscription: null
      });
    }

    // Format dates for easier consumption by the frontend
    const formattedSubscription = {
      ...user.subscription,
      startDate: user.subscription.startDate?.toISOString(),
      endDate: user.subscription.endDate?.toISOString(),
      stripeCurrentPeriodEnd: user.subscription.stripeCurrentPeriodEnd?.toISOString(),
    };

    // Return user's subscription data
    return NextResponse.json({
      hasSubscription: true,
      isSubscribed: !!user.isSubscribed,
      subscription: formattedSubscription
    });
  } catch (error: any) {
    console.error('Error fetching user subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription information', details: error.message },
      { status: 500 }
    );
  }
} 