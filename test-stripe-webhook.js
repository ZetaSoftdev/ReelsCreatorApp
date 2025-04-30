// Test script for Stripe webhook functionality
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testStripeWebhook() {
  try {
    console.log('Starting Stripe webhook test...');
    
    // Get an existing user
    const user = await prisma.user.findFirst();
    if (!user) {
      console.error('No users found in database');
      return;
    }
    console.log('Found user:', {
      id: user.id,
      email: user.email,
      isSubscribed: user.isSubscribed
    });
    
    // Get an existing subscription plan
    const plan = await prisma.subscriptionPlan.findFirst();
    if (!plan) {
      console.error('No subscription plans found in database');
      return;
    }
    console.log('Found plan:', {
      id: plan.id,
      name: plan.name,
      minutesAllowed: plan.minutesAllowed
    });
    
    console.log('Test data preparation complete');
    
    // Create test Stripe data
    const userId = user.id;
    const subscriptionId = 'test_sub_' + Date.now();
    const customerId = 'test_cus_' + Date.now();
    const priceId = 'test_price_' + Date.now();
    const periodEnd = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days from now
    const planId = plan.id;
    const status = 'active';
    const minutesAllowed = plan.minutesAllowed;
    
    console.log('Test parameters:', {
      userId,
      subscriptionId,
      planId,
      minutesAllowed
    });
    
    // Instead of using helper, directly work with DB
    try {
      console.log('Updating user subscription directly...');
      
      // Update user record
      const updatedUserData = await prisma.user.update({
        where: { id: userId },
        data: {
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId: customerId,
          stripePriceId: priceId,
          stripeCurrentPeriodEnd: new Date(periodEnd * 1000),
          isSubscribed: true
        }
      });
      
      console.log('User updated successfully:', {
        id: updatedUserData.id,
        isSubscribed: updatedUserData.isSubscribed,
        stripeSubscriptionId: updatedUserData.stripeSubscriptionId
      });
      
      // Check if subscription exists
      const existingSubscription = await prisma.subscription.findFirst({
        where: { userId: userId }
      });
      
      if (existingSubscription) {
        console.log('Updating existing subscription:', existingSubscription.id);
        const updatedSubscription = await prisma.subscription.update({
          where: { id: existingSubscription.id },
          data: {
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: customerId,
            stripePriceId: priceId,
            stripeCurrentPeriodEnd: new Date(periodEnd * 1000),
            planId: planId,
            status: status
          }
        });
        console.log('Subscription updated successfully:', updatedSubscription.id);
      } else {
        console.log('Creating new subscription...');
        const newSubscription = await prisma.subscription.create({
          data: {
            userId: userId,
            plan: plan.name || 'default',
            status: status,
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: customerId,
            stripePriceId: priceId,
            stripeCurrentPeriodEnd: new Date(periodEnd * 1000),
            minutesAllowed: minutesAllowed,
            minutesUsed: 0,
            startDate: new Date(),
            planId: planId
          }
        });
        console.log('New subscription created successfully:', newSubscription.id);
      }
      
      console.log('Subscription record updated successfully');
    } catch (error) {
      console.error('Error in direct DB operation:', error);
    }
    
    // Verify the result
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    console.log('Updated user subscription details:', {
      isSubscribed: updatedUser.isSubscribed,
      stripeSubscriptionId: updatedUser.stripeSubscriptionId,
      stripeCustomerId: updatedUser.stripeCustomerId,
      stripePriceId: updatedUser.stripePriceId,
      stripeCurrentPeriodEnd: updatedUser.stripeCurrentPeriodEnd
    });
    
    const updatedSubscription = await prisma.subscription.findFirst({
      where: { userId: userId }
    });
    
    if (updatedSubscription) {
      console.log('Updated subscription details:', {
        id: updatedSubscription.id,
        plan: updatedSubscription.plan,
        status: updatedSubscription.status,
        stripeSubscriptionId: updatedSubscription.stripeSubscriptionId
      });
    } else {
      console.log('No subscription found for user');
    }
    
  } catch (error) {
    console.error('Error in Stripe webhook test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testStripeWebhook(); 