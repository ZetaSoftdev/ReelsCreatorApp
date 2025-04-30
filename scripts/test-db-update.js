/**
 * Test script for database update operations
 * Tests the direct database update functions for subscriptions
 */

// Load environment variables
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// Create a Prisma client
const prisma = new PrismaClient();

/**
 * Direct test of subscription database updates
 */
async function updateSubscriptionRecord(userId, subscriptionId, customerId, priceId, periodEnd, planId, status, minutesAllowed = 100) {
  console.log('==== DIRECT DATABASE UPDATE TEST ====');
  console.log(`UserId: ${userId}, SubscriptionId: ${subscriptionId}, PlanId: ${planId}`);
  
  try {
    // Use a transaction to ensure both operations succeed or fail together
    return await prisma.$transaction(async (tx) => {
      // 1. Update the user record
      console.log('Updating user subscription data');
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId: customerId,
          stripePriceId: priceId,
          stripeCurrentPeriodEnd: new Date(periodEnd * 1000),
          isSubscribed: true,
        }
      });
      
      console.log(`User subscription updated successfully: ${user.id}`);
      
      // 2. Check if a subscription already exists for this user
      const existingSubscription = await tx.subscription.findFirst({
        where: { userId: userId }
      });
      
      let subscription;
      
      if (existingSubscription) {
        console.log(`Updating existing subscription: ${existingSubscription.id}`);
        
        // Update the existing subscription
        subscription = await tx.subscription.update({
          where: { id: existingSubscription.id },
          data: {
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: customerId,
            stripePriceId: priceId,
            stripeCurrentPeriodEnd: new Date(periodEnd * 1000),
            planId: planId,
            status: status,
          }
        });
        
        console.log(`Subscription updated: ${subscription.id}`);
      } else {
        console.log(`Creating new subscription for user: ${userId}`);
        
        // Create a new subscription record
        subscription = await tx.subscription.create({
          data: {
            userId: userId,
            plan: planId, // Use planId as the plan name if no plan name is available
            status: status,
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: customerId,
            stripePriceId: priceId,
            stripeCurrentPeriodEnd: new Date(periodEnd * 1000),
            minutesAllowed: minutesAllowed,
            minutesUsed: 0,
            startDate: new Date(),
            planId: planId,
          }
        });
        
        console.log(`New subscription created: ${subscription.id}`);
      }
      
      return { user, subscription, isNew: !existingSubscription };
    });
  } catch (error) {
    console.error('==== TRANSACTION FAILED ====');
    console.error('Error details:', error);
    throw error;
  }
}

async function runTest() {
  try {
    console.log('===== DATABASE UPDATE TEST STARTING =====');
    
    // Find a user
    const user = await prisma.user.findFirst();
    if (!user) {
      console.error('No user found');
      return;
    }
    
    // Find a subscription plan
    const plan = await prisma.subscriptionPlan.findFirst();
    if (!plan) {
      console.error('No subscription plan found');
      return;
    }
    
    console.log('Found user:', user.id);
    console.log('Found plan:', plan.id);
    
    // Create test data
    const mockData = {
      userId: user.id,
      subscriptionId: `sub_test_${Date.now()}`,
      customerId: `cus_test_${Date.now()}`,
      priceId: `price_test_${Date.now()}`,
      periodEnd: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days from now
      planId: plan.id,
      status: 'active',
      minutesAllowed: plan.minutesAllowed
    };
    
    console.log('Mock data:', mockData);
    
    // Directly update the database
    const result = await updateSubscriptionRecord(
      mockData.userId,
      mockData.subscriptionId,
      mockData.customerId,
      mockData.priceId,
      mockData.periodEnd,
      mockData.planId,
      mockData.status,
      mockData.minutesAllowed
    );
    
    console.log('Update result:', {
      userId: result.user.id,
      isSubscribed: result.user.isSubscribed,
      subscriptionId: result.subscription.id,
      isNew: result.isNew
    });
    
    // Verify the changes
    const verifyUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        isSubscribed: true,
        stripeSubscriptionId: true,
        stripeCustomerId: true,
        stripePriceId: true,
        stripeCurrentPeriodEnd: true
      }
    });
    
    console.log('Verified user data:', verifyUser);
    
    const verifySubscription = await prisma.subscription.findFirst({
      where: { userId: user.id },
      select: {
        id: true,
        status: true,
        stripeSubscriptionId: true,
        planId: true,
        minutesAllowed: true
      }
    });
    
    console.log('Verified subscription data:', verifySubscription);
    
    console.log('===== DATABASE UPDATE TEST COMPLETED =====');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
runTest()
  .then(() => console.log('Test completed'))
  .catch((error) => console.error('Unhandled error:', error)); 