// app/api/stripe/webhook/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { stripe as stripeClient, webhookSecret, initializeStripe } from '@/lib/stripe';
import { updateSubscriptionRecords, updateSubscriptionFromInvoice } from '@/lib/stripe-helpers/subscription';
import { updateSubscriptionRecordsDirect, updateSubscriptionFromInvoiceDirect } from '@/lib/stripe-helpers/subscription-direct';
import { Role } from '@/lib/constants';

// Force this route to be treated as a server-side route, not Edge
export const runtime = 'nodejs';

// Initialize Stripe with the client we already created
const stripe = stripeClient;

export async function POST(req: Request) {
  console.log('==== STRIPE WEBHOOK HANDLER STARTED ====');
  try {
    // Initialize Stripe with latest settings from database
    await initializeStripe();
    
    const body = await req.text();
    console.log('Webhook body length:', body.length);
    
    // Get the signature directly from request headers
    const signature = req.headers.get('stripe-signature');
    
    console.log('-------- WEBHOOK REQUEST RECEIVED --------');
    
    if (!signature) {
      console.error('No Stripe signature found in headers');
      // Log all headers for debugging
      req.headers.forEach((value, key) => {
        console.log(`Header ${key}: ${value}`);
      });
      return new NextResponse('No Stripe signature found', { status: 400 });
    }

    console.log('Stripe signature found:', signature.substring(0, 20) + '...');
    console.log('Webhook secret available:', !!webhookSecret);

    let event: Stripe.Event;

    try {
      // Verify the event with Stripe
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log('Webhook signature verified successfully');
    } catch (error: any) {
      console.error('Webhook signature verification failed:', error.message);
      return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    console.log(`Webhook received: ${event.type}`);
    console.log('Event ID:', event.id);

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          try {
            const session = event.data.object as Stripe.Checkout.Session;
            
            console.log('-------- SESSION DETAILS --------');
            console.log('Session ID:', session.id);
            console.log('Session metadata:', session.metadata);
            console.log('Session mode:', session.mode);
            console.log('Session subscription:', session.subscription);
            console.log('Session customer:', session.customer);
            
            // If no metadata at all
            if (!session.metadata || !session.metadata.userId) {
              console.error('No userId found in session metadata - your checkout session creation must include metadata.userId');
              if (session.metadata) console.error('Available metadata fields:', Object.keys(session.metadata));
              // Acknowledge receipt but log the error - don't fail the webhook
              return new NextResponse(null, { status: 200 });
            }

            console.log('User ID from metadata:', session.metadata.userId);
            
            // Check if user exists in database
            let user = null;
            try {
              // First try by ID
              user = await db.user.findUnique({
                where: { id: session.metadata.userId },
              });
              
              // If not found by ID, try by email
              if (!user && session.metadata.userEmail) {
                console.log(`User with ID ${session.metadata.userId} not found, trying lookup by email: ${session.metadata.userEmail}`);
                
                user = await db.user.findUnique({
                  where: { email: session.metadata.userEmail }
                });
                
                // If found by email, update the user record with the session ID
                if (user) {
                  console.log(`Found user by email ${session.metadata.userEmail}, updating ID from ${user.id} to ${session.metadata.userId}`);
                  try {
                    user = await db.user.update({
                      where: { id: user.id },
                      data: { id: session.metadata.userId }
                    });
                    console.log(`Successfully updated user ID to match session ID`);
                  } catch (updateError) {
                    console.error(`Failed to update user ID: ${updateError}`);
                  }
                }
              }
              
              if (!user) {
                console.error(`User not found by ID or email. Creating new user record...`);
                
                // Get user email from customer or session
                let userEmail = session.customer_email;
                
                // First try to get email from metadata
                if (!userEmail && session.metadata.userEmail) {
                  userEmail = session.metadata.userEmail;
                }
                
                // If still no email, try to get from the customer object
                if (!userEmail && typeof session.customer === 'string') {
                  try {
                    const customer = await stripe.customers.retrieve(session.customer);
                    if (customer && !customer.deleted && customer.email) {
                      userEmail = customer.email;
                    }
                  } catch (customerErr) {
                    console.error("Error retrieving customer:", customerErr);
                  }
                }
                
                if (!userEmail) {
                  console.error("Cannot create user without an email address");
                  return new NextResponse(null, { status: 200 });
                }
                
                // Create the user record
                try {
                  user = await db.user.create({
                    data: {
                      id: session.metadata.userId,
                      email: userEmail,
                      name: session.metadata.userName || userEmail.split('@')[0] || "User",
                      role: Role.USER,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                      isSubscribed: false // This will be updated in subscription logic below
                    }
                  });
                  
                  console.log(`Successfully created user record: ${user.id} (${user.email})`);
                } catch (createError) {
                  console.error("Failed to create user record:", createError);
                  // Don't fail the webhook - just log the error and continue
                  return new NextResponse(null, { status: 200 });
                }
              } else {
                console.log('User found in database:', user.id);
              }
            } catch (userLookupError: any) {
              console.error('Error looking up user:', userLookupError.message);
              // Don't fail the webhook - just log the error
              return new NextResponse(null, { status: 200 });
            }

            // Only proceed if subscription exists
            if (session.subscription) {
              // Use type cast to handle the subscription ID
              const subscriptionId = typeof session.subscription === 'string' 
                ? session.subscription 
                : (session.subscription as any).id;
              
              if (!subscriptionId) {
                console.error('No subscription ID found in session');
                // Don't fail the webhook
                return new NextResponse(null, { status: 200 });
              }
              
              console.log('Subscription ID:', subscriptionId);
              
              // Retrieve subscription with proper error handling
              try {
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                console.log('Retrieved subscription:', subscription.id);
                console.log('Subscription status:', subscription.status);
                
                // Access properties safely with type declarations
                const periodEnd = (subscription as any).current_period_end || Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
                console.log('Subscription period end:', new Date(periodEnd * 1000).toISOString());
                console.log('Subscription items:', subscription.items.data.length);
                
                if (subscription.items.data.length === 0) {
                  console.error('Subscription has no items');
                  // Don't fail the webhook
                  return new NextResponse(null, { status: 200 });
                }
                
                // Get customer and price data
                const customer_id = typeof subscription.customer === 'string' 
                  ? subscription.customer 
                  : subscription.customer.id;
                const price_id = subscription.items.data[0]?.price.id;
                
                console.log('Customer ID:', customer_id);
                console.log('Price ID:', price_id);
                
                if (!periodEnd || !customer_id || !price_id) {
                  console.error('Missing required subscription data');
                  // Don't fail the webhook
                  return new NextResponse(null, { status: 200 });
                }
                
                // Get minutes allowed from plan metadata or from the subscription plan
                let minutesAllowed = 100; // Default
                let planId = session.metadata.planId || 'default';
                let planName = session.metadata.planName || undefined;
                
                if (session.metadata.minutesAllowed) {
                  minutesAllowed = parseInt(session.metadata.minutesAllowed);
                  console.log('Using minutes allowed from metadata:', minutesAllowed);
                } else if (session.metadata.planId) {
                  try {
                    const plan = await db.subscriptionPlan.findUnique({
                      where: { id: session.metadata.planId }
                    });
                    if (plan) {
                      minutesAllowed = plan.minutesAllowed;
                      console.log('Using minutes allowed from plan:', minutesAllowed);
                      if (!planName) {
                        planName = plan.name.toLowerCase().replace(/\s+/g, '_');
                        console.log('Using plan name from database:', planName);
                      }
                    } else {
                      console.log('Plan not found, using default minutes:', minutesAllowed);
                    }
                  } catch (planError) {
                    console.error('Error getting plan details:', planError);
                  }
                }
                
                console.log('==== ATTEMPTING DATABASE UPDATE ====');
                console.log('Update parameters:', {
                  userId: session.metadata.userId,
                  subscriptionId: subscription.id,
                  customerId: customer_id,
                  priceId: price_id,
                  periodEnd,
                  planId,
                  planName,
                  status: subscription.status,
                  minutesAllowed
                });
                
                // Try the new direct database operations first
                try {
                  console.log('Using direct database operations for reliability');
                  
                  const result = await updateSubscriptionRecordsDirect(
                    session.metadata.userId,
                    subscription.id,
                    customer_id,
                    price_id,
                    periodEnd,
                    planId,
                    subscription.status,
                    minutesAllowed,
                    planName
                  );
                  
                  console.log('Direct database operation successful:', {
                    userId: result.user.id,
                    subscriptionId: result.subscription.id,
                    isNew: result.isNew
                  });
                  
                  // If we got here, everything worked
                  return new NextResponse(null, { status: 200 });
                } catch (directError) {
                  console.error('Direct database operation failed, falling back to helper function:', directError);
                  
                  // Fall back to the original helper function
                  try {
                    const success = await updateSubscriptionRecords(
                      session.metadata.userId,
                      subscription.id,
                      customer_id,
                      price_id,
                      periodEnd,
                      planId,
                      subscription.status,
                      minutesAllowed
                    );
                    
                    if (success) {
                      console.log('Fallback helper function successful');
                      return new NextResponse(null, { status: 200 });
                    } else {
                      console.error('Fallback helper function failed');
                      // Try one more desperate approach: direct SQL update
                      try {
                        // Direct User table update
                        await db.$executeRaw`
                          UPDATE "User" 
                          SET 
                            "isSubscribed" = true, 
                            "stripeSubscriptionId" = ${subscription.id},
                            "stripeCustomerId" = ${customer_id},
                            "stripePriceId" = ${price_id},
                            "stripeCurrentPeriodEnd" = ${new Date(periodEnd * 1000)}
                          WHERE "id" = ${session.metadata.userId}
                        `;
                        
                        console.log('Direct SQL update for User successful');
                        
                        // Check if Subscription exists
                        const existingSub = await db.subscription.findFirst({
                          where: { userId: session.metadata.userId }
                        });
                        
                        if (existingSub) {
                          // Update existing subscription
                          await db.$executeRaw`
                            UPDATE "Subscription"
                            SET
                              "stripeSubscriptionId" = ${subscription.id},
                              "stripeCustomerId" = ${customer_id},
                              "stripePriceId" = ${price_id},
                              "stripeCurrentPeriodEnd" = ${new Date(periodEnd * 1000)},
                              "endDate" = ${new Date(periodEnd * 1000)},
                              "status" = ${subscription.status},
                              "planId" = ${planId}
                            WHERE "userId" = ${session.metadata.userId}
                          `;
                        } else {
                          // Create new subscription
                          await db.$executeRaw`
                            INSERT INTO "Subscription" (
                              "id", "userId", "plan", "status", "startDate", "endDate",
                              "minutesAllowed", "minutesUsed", "stripeSubscriptionId",
                              "stripeCustomerId", "stripePriceId", "stripeCurrentPeriodEnd", "planId"
                            ) VALUES (
                              ${require('crypto').randomUUID()}, 
                              ${session.metadata.userId}, 
                              ${planId}, 
                              ${subscription.status}, 
                              ${new Date()}, 
                              ${new Date(periodEnd * 1000)}, 
                              ${minutesAllowed}, 
                              0, 
                              ${subscription.id}, 
                              ${customer_id}, 
                              ${price_id}, 
                              ${new Date(periodEnd * 1000)}, 
                              ${planId}
                            )
                          `;
                        }
                        
                        console.log('Direct SQL update successful');
                      } catch (sqlError) {
                        console.error('Direct SQL update failed:', sqlError);
                      }
                    }
                  } catch (fallbackError) {
                    console.error('Both direct and fallback operations failed:', fallbackError);
                  }
                }
              } catch (stripeError: any) {
                console.error('Failed to retrieve subscription:', stripeError.message);
                // Don't fail the webhook
                return new NextResponse(null, { status: 200 });
              }
            } else {
              // One-time purchase handling logic (if needed)
              console.log('No subscription in session - handling as one-time purchase');
              
              // Simply acknowledge receipt without further processing
              return new NextResponse(null, { status: 200 });
            }
            
            // If we got here, everything worked
            return new NextResponse(null, { status: 200 });
          } catch (checkoutError: any) {
            console.error('Error processing checkout.session.completed:', checkoutError);
            console.error('Error stack:', checkoutError.stack);
            // Don't fail the webhook, even if we encountered errors
            return new NextResponse(null, { status: 200 });
          }
          break;
        }
        
        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as any; // Use any type temporarily to avoid TS errors
          // Check if subscription exists and is a string
          const subscriptionId = invoice.subscription ? String(invoice.subscription) : null;
          
          if (!subscriptionId) {
            console.log('No subscription ID in invoice, skipping');
            return new NextResponse(null, { status: 200 });
          }
          
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            console.log('Processing invoice payment for subscription:', subscription.id);
            
            const currentPeriodEnd = (subscription as any).current_period_end || Math.floor(Date.now() / 1000);
            const price_id = subscription.items.data[0]?.price.id;
            
            if (!currentPeriodEnd || !price_id) {
              throw new Error('Missing required subscription data');
            }
            
            // Try direct approach first
            try {
              const result = await updateSubscriptionFromInvoiceDirect(
                subscription.id,
                price_id,
                currentPeriodEnd,
                subscription.status
              );
              
              console.log('Direct invoice update successful:', result);
            } catch (directError) {
              console.error('Direct invoice update failed, falling back to helper:', directError);
              
              // Fall back to the original method
              const success = await updateSubscriptionFromInvoice(
                subscription.id,
                price_id,
                currentPeriodEnd,
                subscription.status
              );
              
              if (success) {
                console.log(`Updated subscription renewal for ID: ${subscription.id}`);
              } else {
                console.error(`Failed to update subscription renewal for ID: ${subscription.id}`);
              }
            }
            
          } catch (error: any) {
            console.error('Failed to process invoice.payment_succeeded:', error.message);
            console.error(error.stack);
            return new NextResponse(null, { status: 200 });
          }
          break;
        }

        case 'customer.subscription.updated': {
          try {
            const subscription = event.data.object as Stripe.Subscription;
            console.log('Processing subscription update:', subscription.id);
            console.log('Subscription status:', subscription.status);
            
            // Extract required data
            const subscriptionId = subscription.id;
            const currentPeriodEnd = (subscription as any).current_period_end;
            const price_id = subscription.items.data[0]?.price.id;
            const status = subscription.status;
            
            // Handle cancellation specifically
            const isCanceled = status === 'canceled' || subscription.cancel_at_period_end;
            
            if (isCanceled) {
              console.log(`Subscription ${subscriptionId} has been canceled or set to cancel`);
              
              // Update user record for cancellation
              await db.user.updateMany({
                where: { stripeSubscriptionId: subscriptionId },
                data: {
                  // Don't remove subscription ID or customer ID,
                  // but mark as canceled in our database while preserving access until period end
                  isSubscribed: false,
                  stripeCurrentPeriodEnd: new Date(currentPeriodEnd * 1000),
                }
              });
              
              // Update subscription record
              await db.subscription.updateMany({
                where: { stripeSubscriptionId: subscriptionId },
                data: {
                  status: subscription.cancel_at_period_end ? 'active-canceling' : 'canceled',
                  endDate: new Date(currentPeriodEnd * 1000),
                  stripeCurrentPeriodEnd: new Date(currentPeriodEnd * 1000),
                }
              });
              
              console.log(`Successfully updated cancellation status for subscription: ${subscriptionId}`);
            } else {
              // Regular subscription update (could be an upgrade/downgrade)
              if (!currentPeriodEnd || !price_id) {
                throw new Error('Missing required subscription data');
              }
              
              // Update the subscription details in our database
              await db.user.updateMany({
                where: { stripeSubscriptionId: subscriptionId },
                data: {
                  stripePriceId: price_id,
                  stripeCurrentPeriodEnd: new Date(currentPeriodEnd * 1000),
                  isSubscribed: status === 'active',
                }
              });
              
              // Update subscription record
              await db.subscription.updateMany({
                where: { stripeSubscriptionId: subscriptionId },
                data: {
                  stripePriceId: price_id,
                  stripeCurrentPeriodEnd: new Date(currentPeriodEnd * 1000),
                  endDate: new Date(currentPeriodEnd * 1000),
                  status: status,
                }
              });
              
              console.log(`Successfully updated subscription: ${subscriptionId} to status: ${status}`);
            }
          } catch (error: any) {
            console.error('Failed to process customer.subscription.updated:', error.message);
            console.error(error.stack);
          }
          return new NextResponse(null, { status: 200 });
        }
        
        case 'customer.subscription.deleted': {
          try {
            const subscription = event.data.object as Stripe.Subscription;
            console.log('Processing subscription deletion:', subscription.id);
            
            // Get the subscription ID
            const subscriptionId = subscription.id;
            
            // Update user record
            await db.user.updateMany({
              where: { stripeSubscriptionId: subscriptionId },
              data: {
                isSubscribed: false,
                // Keep the IDs for history, but mark as unsubscribed
              }
            });
            
            // Update subscription record
            await db.subscription.updateMany({
              where: { stripeSubscriptionId: subscriptionId },
              data: {
                status: 'canceled',
                // End date should already be set from the cancellation event
              }
            });
            
            console.log(`Successfully marked subscription ${subscriptionId} as canceled`);
          } catch (error: any) {
            console.error('Failed to process customer.subscription.deleted:', error.message);
            console.error(error.stack);
          }
          return new NextResponse(null, { status: 200 });
        }
      }

      return new NextResponse(null, { status: 200 });
    } catch (error: any) {
      console.error(`Error processing webhook event ${event.type}:`, error.message);
      console.error(error.stack);
      return new NextResponse(null, { status: 200 });
    }
  } catch (error: any) {
    console.error('Error processing webhook:', error.message);
    console.error(error.stack);
    return new NextResponse(`Webhook handler failed: ${error.message}`, { status: 500 });
  }
}