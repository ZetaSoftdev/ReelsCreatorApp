import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { stripe, initializeStripe } from '@/lib/stripe';
import { updateSubscriptionRecordsDirect } from '@/lib/stripe-helpers/subscription-direct';

// Force this route to be treated as a server-side route, not Edge
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize Stripe with latest settings from database
    await initializeStripe();

    // Get the session ID from the request body
    const { session_id } = await req.json();
    if (!session_id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    console.log('Verifying Stripe session:', session_id);
    console.log('For user:', session.user.id);

    // Retrieve the checkout session from Stripe
    try {
      const checkoutSession = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ['subscription', 'customer']
      });

      console.log('Retrieved checkout session:', checkoutSession.id);
      console.log('Session status:', checkoutSession.status);
      console.log('Session metadata:', checkoutSession.metadata);

      // If the session is not completed, return the current status
      if (checkoutSession.status !== 'complete') {
        return NextResponse.json({ 
          success: false, 
          status: checkoutSession.status,
          message: 'Checkout session is not complete'
        });
      }

      // Check if we have a subscription
      if (!checkoutSession.subscription) {
        return NextResponse.json({ 
          success: false, 
          message: 'No subscription found in checkout session'
        });
      }

      // Get the subscription object
      const subscription = typeof checkoutSession.subscription === 'string'
        ? await stripe.subscriptions.retrieve(checkoutSession.subscription)
        : checkoutSession.subscription;

      console.log('Subscription status:', subscription.status);

      // Extract user ID from metadata or fallback to current user
      const userId = checkoutSession.metadata?.userId || session.user.id;

      // Check if the subscription is already recorded for the user
      const userRecord = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
      });

      if (userRecord?.stripeSubscriptionId === subscription.id && userRecord.isSubscribed) {
        console.log('Subscription already recorded for user:', userId);
        return NextResponse.json({ 
          success: true, 
          status: 'recorded',
          message: 'Subscription is already properly recorded' 
        });
      }

      // If we got here, we need to repair the subscription records
      console.log('Attempting to repair subscription records for user:', userId);

      // Extract necessary data from subscription
      const customer_id = typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer.id;

      const price_id = subscription.items.data[0]?.price.id;
      const periodEnd = (subscription as any).current_period_end;
      
      // Get plan details from metadata
      let planId = checkoutSession.metadata?.planId || 'default';
      let minutesAllowed = 100; // Default
      
      if (checkoutSession.metadata?.minutesAllowed) {
        minutesAllowed = parseInt(checkoutSession.metadata.minutesAllowed);
      } else if (checkoutSession.metadata?.planId) {
        // Look up the plan
        const plan = await prisma.subscriptionPlan.findUnique({
          where: { id: checkoutSession.metadata.planId }
        });
        if (plan) {
          minutesAllowed = plan.minutesAllowed;
        }
      }

      // Get plan name
      const planName = checkoutSession.metadata?.planName;

      // Attempt to update subscription records
      const result = await updateSubscriptionRecordsDirect(
        userId,
        subscription.id,
        customer_id,
        price_id,
        periodEnd,
        planId,
        subscription.status,
        minutesAllowed,
        planName
      );

      return NextResponse.json({
        success: true,
        status: 'repaired',
        message: 'Subscription records have been repaired',
        userId: result.user.id,
        subscriptionId: result.subscription.id
      });

    } catch (error: any) {
      console.error('Error verifying checkout session:', error);
      return NextResponse.json(
        { error: 'Failed to verify checkout session', details: error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in verify-session API:', error);
    return NextResponse.json(
      { error: 'Failed to verify session', details: error.message },
      { status: 500 }
    );
  }
} 