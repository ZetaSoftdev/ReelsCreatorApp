import { db } from '@/lib/db';
import Stripe from 'stripe';

/**
 * Helper functions to safely update subscription information in the database
 * These functions provide error handling and ensure all required fields are present
 */

/**
 * Updates user and subscription records for a completed checkout session
 */
export async function updateSubscriptionRecords(
  userId: string,
  subscriptionId: string,
  customerId: string,
  priceId: string,
  periodEnd: number,
  planId: string,
  status: string,
  minutesAllowed: number = 100
) {
  console.log('Starting database update with subscription helpers...');
  console.log(`UserId: ${userId}, SubscriptionId: ${subscriptionId}`);
  
  try {
    // First, update the user record
    await updateUserSubscription(
      userId, 
      subscriptionId, 
      customerId, 
      priceId, 
      periodEnd
    );
    
    // Then update or create the subscription record
    await upsertSubscriptionRecord(
      userId,
      subscriptionId,
      customerId,
      priceId,
      periodEnd,
      planId,
      status,
      minutesAllowed
    );
    
    console.log('Subscription records updated successfully');
    return true;
  } catch (error) {
    console.error('Error in updateSubscriptionRecords:', error);
    return false;
  }
}

/**
 * Updates the user's subscription information
 */
async function updateUserSubscription(
  userId: string,
  subscriptionId: string,
  customerId: string,
  priceId: string,
  periodEnd: number
) {
  try {
    console.log(`Updating user subscription data for userId: ${userId}`);
    
    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId }
    });
    
    if (!existingUser) {
      console.log(`User with ID ${userId} not found, creating basic user record`);
      try {
        // Create a basic user record
        await db.user.create({
          data: {
            id: userId,
            email: `user_${userId.substring(0, 8)}@example.com`, // Placeholder email
            name: "New User",
            role: "USER",
            createdAt: new Date(),
            updatedAt: new Date(),
            isSubscribed: false // Will be updated below
          }
        });
        console.log(`Created basic user record for ID: ${userId}`);
      } catch (createError) {
        console.error(`Failed to create user record: ${createError}`);
        throw createError;
      }
    }
    
    const result = await db.user.update({
      where: { id: userId },
      data: {
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: customerId,
        stripePriceId: priceId,
        stripeCurrentPeriodEnd: new Date(periodEnd * 1000),
        isSubscribed: true,
      }
    });
    
    console.log(`User subscription updated successfully: ${result.id}`);
    return result;
  } catch (error) {
    console.error('Failed to update user subscription:', error);
    throw error;
  }
}

/**
 * Creates or updates a subscription record
 */
async function upsertSubscriptionRecord(
  userId: string,
  subscriptionId: string,
  customerId: string,
  priceId: string,
  periodEnd: number,
  planId: string,
  status: string,
  minutesAllowed: number
) {
  try {
    console.log(`Checking for existing subscription for userId: ${userId}`);
    
    // Get subscription plan details to get the proper name
    let planName = planId;
    let actualMinutesAllowed = minutesAllowed;
    
    try {
      if (planId) {
        const plan = await db.subscriptionPlan.findUnique({
          where: { id: planId }
        });
        
        if (plan) {
          planName = plan.name; // Use the actual plan name from the database
          console.log(`Found plan name: ${planName} for plan ID: ${planId}`);
          
          // Use the plan's minutes allowed if not explicitly provided
          if (!minutesAllowed || minutesAllowed === 100) {
            actualMinutesAllowed = plan.minutesAllowed;
            console.log(`Using minutes allowed from plan: ${actualMinutesAllowed}`);
          }
        }
      }
    } catch (planError) {
      console.error(`Error getting plan details:`, planError);
    }
    
    // Check if subscription exists
    const existingSubscription = await db.subscription.findFirst({
      where: { userId: userId }
    });
    
    if (existingSubscription) {
      console.log(`Found existing subscription: ${existingSubscription.id}`);
      
      // Update existing subscription
      const updated = await db.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId: customerId,
          stripePriceId: priceId,
          stripeCurrentPeriodEnd: new Date(periodEnd * 1000),
          endDate: new Date(periodEnd * 1000), // Set endDate based on periodEnd
          planId: planId,
          plan: planName, // Use the human-readable plan name
          status: status,
          minutesAllowed: actualMinutesAllowed, // Use the correct minutes allowed
        }
      });
      
      console.log(`Updated subscription: ${updated.id} with plan: ${updated.plan}`);
      return updated;
    } else {
      console.log(`No existing subscription found. Creating new subscription for userId: ${userId}`);
      
      // Create new subscription with all required fields
      const created = await db.subscription.create({
        data: {
          userId: userId,
          plan: planName, // Use the human-readable plan name
          status: status,
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId: customerId,
          stripePriceId: priceId,
          stripeCurrentPeriodEnd: new Date(periodEnd * 1000),
          endDate: new Date(periodEnd * 1000), // Set endDate based on periodEnd
          planId: planId, // Save the planId for the relation
          minutesAllowed: actualMinutesAllowed,
          minutesUsed: 0,
          startDate: new Date(),
        }
      });
      
      console.log(`Created new subscription: ${created.id} with plan: ${created.plan}`);
      return created;
    }
  } catch (error) {
    console.error('Failed to upsert subscription record:', error);
    throw error;
  }
}

/**
 * Updates subscription records based on invoice payment
 */
export async function updateSubscriptionFromInvoice(
  subscriptionId: string,
  priceId: string,
  periodEnd: number,
  status: string
) {
  try {
    console.log(`Updating records for invoice payment on subscription: ${subscriptionId}`);
    
    // Update user record
    const userUpdate = await db.user.updateMany({
      where: { stripeSubscriptionId: subscriptionId },
      data: {
        stripePriceId: priceId,
        stripeCurrentPeriodEnd: new Date(periodEnd * 1000),
      }
    });
    
    // Update subscription record
    const subscriptionUpdate = await db.subscription.updateMany({
      where: { stripeSubscriptionId: subscriptionId },
      data: {
        stripePriceId: priceId,
        stripeCurrentPeriodEnd: new Date(periodEnd * 1000),
        endDate: new Date(periodEnd * 1000), // Set endDate based on periodEnd
        status: status,
      }
    });
    
    console.log(`Updated user records: ${userUpdate.count}, subscription records: ${subscriptionUpdate.count}`);
    return true;
  } catch (error) {
    console.error('Failed to update subscription from invoice:', error);
    return false;
  }
} 