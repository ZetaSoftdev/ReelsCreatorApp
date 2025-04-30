/**
 * Test script for simulating Stripe webhook events
 * 
 * This script tests the webhook handler by creating a mock Stripe event
 * and sending it to the webhook handler directly, bypassing the API route.
 */

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { updateSubscriptionRecordsDirect } from '../lib/stripe-helpers/subscription-direct';

// Load environment variables
config();

// Create a Prisma client
const prisma = new PrismaClient();

async function testWebhook() {
  try {
    console.log('===== WEBHOOK TEST STARTING =====');
    
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
    
    // Directly call the webhook handler function
    const result = await updateSubscriptionRecordsDirect(
      mockData.userId,
      mockData.subscriptionId,
      mockData.customerId,
      mockData.priceId,
      mockData.periodEnd,
      mockData.planId,
      mockData.status,
      mockData.minutesAllowed
    );
    
    console.log('Operation result:', {
      user: {
        id: result.user.id, 
        isSubscribed: result.user.isSubscribed,
        stripeSubscriptionId: result.user.stripeSubscriptionId
      },
      subscription: {
        id: result.subscription.id,
        status: result.subscription.status,
        isNew: result.isNew
      }
    });
    
    // Verify that the subscription was created/updated
    const updatedUser = await prisma.user.findUnique({
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
    
    console.log('Updated user:', updatedUser);
    
    const subscription = await prisma.subscription.findFirst({
      where: { userId: user.id },
      select: {
        id: true,
        status: true,
        stripeSubscriptionId: true,
        planId: true,
        minutesAllowed: true
      }
    });
    
    console.log('Subscription:', subscription);
    
    console.log('===== WEBHOOK TEST COMPLETED =====');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testWebhook()
  .then(() => console.log('Test script completed'))
  .catch((error) => console.error('Unhandled error:', error)); 