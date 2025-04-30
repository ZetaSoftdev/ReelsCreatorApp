import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { stripe, initializeStripe } from '@/lib/stripe';

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

    console.log('==== STRIPE CHECKOUT STARTING ====');
    console.log('Authenticated user:', session.user.id);

    // Get the plan ID from the request body
    const { planId, billingCycle } = await req.json();
    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    console.log('Creating checkout session for plan:', planId, 'billing cycle:', billingCycle);

    // Get the subscription plan from your database
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    console.log('Found plan:', plan.name, 'with', plan.minutesAllowed, 'minutes allowed');

    // Add a better plan name for the subscription record
    const planName = plan.name.toLowerCase().replace(/\s+/g, '_');

    // Create Stripe checkout session with enhanced metadata
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
              description: plan.description
            },
            unit_amount: Math.round((billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice) * 100), // Convert to cents
            recurring: {
              interval: billingCycle === 'monthly' ? 'month' : 'year'
            }
          },
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}`,      
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/dashboard/pricing`,
      metadata: {
        userId: session.user.id,
        userName: session.user.name || '',
        userEmail: session.user.email || '',
        planId: plan.id,
        planName: planName,
        minutesAllowed: plan.minutesAllowed.toString(),
        billingCycle: billingCycle,
        source: 'checkout-api'
      },
      customer_email: session.user.email || undefined,
    });

    console.log('Checkout session created:', checkoutSession.id);
    console.log('Metadata attached to session:', checkoutSession.metadata);
    
    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error.message },
      { status: 500 }
    );
  }
}