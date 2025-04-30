import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { updateSubscriptionRecordsDirect } from '@/lib/stripe-helpers/subscription-direct';

// Force this route to be treated as a server-side route, not Edge
export const runtime = 'nodejs';

export async function POST(req: Request) {
  let body: string;
  try {
    body = await req.text();
    console.log('========== TEST WEBHOOK RECEIVED ==========');
    console.log('Request body length:', body.length);
    
    const data = JSON.parse(body);
    console.log('Event type:', data.type);
    console.log('Event ID:', data.id);
    
    // If this is a checkout session completed event
    if (data.type === 'checkout.session.completed') {
      const session = data.data.object;
      console.log('Session details:', {
        id: session.id,
        metadata: session.metadata,
        mode: session.mode,
        subscription: session.subscription,
        customer: session.customer
      });
      
      // If metadata and user ID are present, try to update subscription
      if (session.metadata && session.metadata.userId && session.subscription) {
        const subscriptionId = typeof session.subscription === 'string' 
          ? session.subscription 
          : session.subscription.id;
          
        console.log('Attempting database update with:', {
          userId: session.metadata.userId,
          subscriptionId,
          customerId: session.customer,
          planId: session.metadata.planId
        });
        
        try {
          // Using a 30-day default period for testing
          const periodEnd = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
          
          // Set default values for missing fields
          const priceId = 'price_test_default';
          const planId = session.metadata.planId || 'default';
          const status = 'active';
          const minutesAllowed = session.metadata.minutesAllowed 
            ? parseInt(session.metadata.minutesAllowed) 
            : 100;
          
          const result = await updateSubscriptionRecordsDirect(
            session.metadata.userId,
            subscriptionId,
            session.customer,
            priceId,
            periodEnd,
            planId,
            status,
            minutesAllowed
          );
          
          console.log('Database update successful:', {
            userId: result.user.id,
            subscriptionId: result.subscription.id,
            isNew: result.isNew
          });
        } catch (error) {
          console.error('Database update failed:', error);
        }
      } else {
        console.log('Missing required data for subscription update');
      }
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 });
  }
} 