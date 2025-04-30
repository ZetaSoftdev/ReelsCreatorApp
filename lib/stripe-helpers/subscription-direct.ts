/**
 * Direct database operations for subscription management
 * This file avoids layers of abstraction for more reliable database operations
 */

import { PrismaClient } from '@prisma/client';

// Create a dedicated Prisma client for subscription operations
const prisma = new PrismaClient();

/**
 * Updates user and subscription records using direct database operations
 * This bypasses layers of abstraction for more reliable updates
 */
export async function updateSubscriptionRecordsDirect(
  userId: string,
  subscriptionId: string,
  customerId: string,
  priceId: string,
  periodEnd: number,
  planId: string,
  status: string,
  minutesAllowed: number = 100,
  planName?: string
) {
  console.log('==== DIRECT DATABASE UPDATE STARTING ====');
  console.log(`User ID: ${userId}, Subscription: ${subscriptionId}, Plan: ${planId}`);
  console.log(`Status: ${status}, Period End: ${new Date(periodEnd * 1000).toISOString()}`);

  try {
    return await prisma.$transaction(async (tx) => {
      // 0. Check if user exists first
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
      });

      if (!user) {
        console.error(`User not found: ${userId}`);
        throw new Error(`User not found: ${userId}`);
      }

      console.log(`User found: ${user.id}, Email: ${user.email}`);

      // 1. Get SubscriptionPlan details to use the human-readable name
      let subscriptionPlanName = planName || 'Unknown Plan';
      
      try {
        const plan = await tx.subscriptionPlan.findUnique({
          where: { id: planId }
        });
        
        if (plan) {
          subscriptionPlanName = plan.name;
          console.log(`Found plan: ${plan.id}, Name: ${plan.name}`);
        } else {
          console.warn(`Subscription plan not found with ID: ${planId}, using provided name: ${subscriptionPlanName}`);
        }
      } catch (planError) {
        console.warn(`Error fetching subscription plan: ${planError}`);
        // Continue with the process using the provided name
      }

      // 2. Update the user record
      await tx.user.update({
        where: { id: userId },
        data: {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          stripePriceId: priceId,
          stripeCurrentPeriodEnd: new Date(periodEnd * 1000),
          isSubscribed: true, // Always set this to true for active subscriptions
        }
      });

      console.log(`Updated user: ${userId}`);

      // 3. Find existing subscription for this user
      const existingSubscription = user.subscription || await tx.subscription.findFirst({
        where: { userId }
      });
      
      if (existingSubscription) {
        console.log(`Updating existing subscription: ${existingSubscription.id}`);
        
        // Update the existing subscription
        const updated = await tx.subscription.update({
          where: { id: existingSubscription.id },
          data: {
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: customerId,
            stripePriceId: priceId,
            stripeCurrentPeriodEnd: new Date(periodEnd * 1000),
            endDate: new Date(periodEnd * 1000),
            planId: planId,
            plan: subscriptionPlanName, // Use the human-readable plan name
            status: status,
            minutesAllowed: minutesAllowed, // Update minutes allowed
          }
        });
        
        console.log(`Subscription updated: ${updated.id} with plan: ${updated.plan}`);
        return { user, subscription: updated, isNew: false };
      } else {
        console.log(`Creating new subscription for user: ${userId}`);
        
        // Create a new subscription record
        const created = await tx.subscription.create({
          data: {
            userId: userId,
            plan: subscriptionPlanName, // Use the human-readable plan name
            status: status,
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: customerId,
            stripePriceId: priceId,
            stripeCurrentPeriodEnd: new Date(periodEnd * 1000),
            endDate: new Date(periodEnd * 1000),
            planId: planId, // Make sure we also save the planId for the relation
            minutesAllowed: minutesAllowed,
            minutesUsed: 0,
            startDate: new Date(),
          }
        });
        
        console.log(`New subscription created: ${created.id} with plan: ${created.plan}`);
        return { user, subscription: created, isNew: true };
      }
    });
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
}

/**
 * Updates subscription records based on invoice payment using direct database operations
 */
export async function updateSubscriptionFromInvoiceDirect(
  subscriptionId: string,
  priceId: string,
  periodEnd: number,
  status: string
) {
  console.log(`==== DIRECT DATABASE UPDATE for INVOICE: ${subscriptionId} ====`);
  
  try {
    // Update user record
    const userUpdate = await prisma.user.updateMany({
      where: { 
        stripeSubscriptionId: subscriptionId 
      },
      data: {
        stripePriceId: priceId,
        stripeCurrentPeriodEnd: new Date(periodEnd * 1000),
        isSubscribed: true, // Ensure this is set to true
      }
    });
    
    console.log(`Updated ${userUpdate.count} user records`);
    
    // Update subscription record
    const subscriptionUpdate = await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscriptionId },
      data: {
        stripePriceId: priceId,
        stripeCurrentPeriodEnd: new Date(periodEnd * 1000),
        endDate: new Date(periodEnd * 1000), // Set endDate based on periodEnd
        status: status,
      }
    });
    
    console.log(`Updated ${subscriptionUpdate.count} subscription records`);
    return { userCount: userUpdate.count, subscriptionCount: subscriptionUpdate.count };
  } catch (error) {
    console.error('Failed to update subscription from invoice:', error);
    throw error;
  }
} 