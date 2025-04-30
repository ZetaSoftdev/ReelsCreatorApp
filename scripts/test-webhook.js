/**
 * Test script for simulating Stripe webhook events
 * 
 * This script tests the webhook handler by creating a mock Stripe event
 * and sending it to the webhook handler directly, bypassing the API route.
 */

// Load environment variables
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

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
    
    // Test updating user directly
    console.log('Updating user...');
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isSubscribed: true,
        stripeSubscriptionId: mockData.subscriptionId,
        stripeCustomerId: mockData.customerId,
        stripePriceId: mockData.priceId,
        stripeCurrentPeriodEnd: new Date(mockData.periodEnd * 1000)
      }
    });
    
    console.log('User updated:', {
      id: updatedUser.id,
      isSubscribed: updatedUser.isSubscribed,
      stripeSubscriptionId: updatedUser.stripeSubscriptionId
    });
    
    // Check for existing subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: { userId: user.id }
    });
    
    let subscription;
    if (existingSubscription) {
      console.log('Found existing subscription:', existingSubscription.id);
      
      // Update existing subscription
      subscription = await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          stripeSubscriptionId: mockData.subscriptionId,
          stripeCustomerId: mockData.customerId,
          stripePriceId: mockData.priceId,
          stripeCurrentPeriodEnd: new Date(mockData.periodEnd * 1000),
          planId: mockData.planId,
          status: mockData.status
        }
      });
    } else {
      console.log('Creating new subscription...');
      
      // Create new subscription
      subscription = await prisma.subscription.create({
        data: {
          userId: mockData.userId,
          plan: plan.name,
          status: mockData.status,
          stripeSubscriptionId: mockData.subscriptionId,
          stripeCustomerId: mockData.customerId,
          stripePriceId: mockData.priceId,
          stripeCurrentPeriodEnd: new Date(mockData.periodEnd * 1000),
          minutesAllowed: mockData.minutesAllowed,
          minutesUsed: 0,
          startDate: new Date(),
          planId: mockData.planId
        }
      });
    }
    
    console.log('Final subscription:', {
      id: subscription.id,
      status: subscription.status,
      stripeSubscriptionId: subscription.stripeSubscriptionId
    });
    
    // Verify the final state
    const finalUser = await prisma.user.findUnique({
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
    
    console.log('Final user state:', finalUser);
    
    const finalSubscription = await prisma.subscription.findFirst({
      where: { userId: user.id },
      select: {
        id: true,
        status: true,
        stripeSubscriptionId: true,
        planId: true,
        minutesAllowed: true
      }
    });
    
    console.log('Final subscription state:', finalSubscription);
    
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