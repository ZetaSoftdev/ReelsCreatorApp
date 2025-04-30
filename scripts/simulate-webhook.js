/**
 * Simulate a Stripe webhook event directly
 * This script sends a simulated webhook event directly to your local webhook handler
 */

require('dotenv').config();
const fetch = require('node-fetch');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function simulateWebhook() {
  try {
    console.log('==== SIMULATING STRIPE WEBHOOK EVENT ====');
    
    // Find a user to use in the test
    const user = await prisma.user.findFirst();
    if (!user) {
      throw new Error('No user found in database');
    }
    
    // Find a subscription plan to use in the test
    const plan = await prisma.subscriptionPlan.findFirst();
    if (!plan) {
      throw new Error('No subscription plan found in database');
    }
    
    console.log(`Using user: ${user.id}`);
    console.log(`Using plan: ${plan.id} (${plan.name})`);
    
    // Create a mock checkout.session.completed event
    const mockEvent = {
      id: `evt_test_${Date.now()}`,
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: `cs_test_${Date.now()}`,
          object: 'checkout.session',
          customer: `cus_test_${Date.now()}`,
          subscription: `sub_test_${Date.now()}`,
          mode: 'subscription',
          metadata: {
            userId: user.id,
            planId: plan.id,
            planName: plan.name.toLowerCase().replace(/\s+/g, '_'),
            minutesAllowed: plan.minutesAllowed.toString(),
            billingCycle: 'monthly',
            source: 'simulate-webhook-script'
          }
        }
      }
    };
    
    // Create a mock subscription object that Stripe would return
    const mockSubscription = {
      id: mockEvent.data.object.subscription,
      status: 'active',
      customer: mockEvent.data.object.customer,
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      items: {
        data: [
          {
            price: {
              id: `price_test_${Date.now()}`
            }
          }
        ]
      }
    };
    
    // Send the event to your test webhook endpoint
    console.log('Sending webhook event to test endpoint...');
    
    // Call your test webhook endpoint that doesn't do signature verification
    const response = await fetch('http://localhost:3000/api/stripe/test-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockEvent)
    });
    
    if (response.ok) {
      console.log('Webhook test event sent successfully');
      const responseText = await response.text();
      console.log('Response:', responseText);
    } else {
      console.error('Failed to send webhook test event:', response.status);
      const errorText = await response.text();
      console.error('Error details:', errorText);
    }
    
    // Wait a bit to allow the webhook processing to complete
    console.log('Waiting for webhook processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Verify the database was updated
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        isSubscribed: true,
        stripeSubscriptionId: true,
      }
    });
    
    console.log('User subscription status:', updatedUser.isSubscribed);
    console.log('User subscription ID:', updatedUser.stripeSubscriptionId);
    
    const subscription = await prisma.subscription.findFirst({
      where: { userId: user.id },
      select: {
        id: true,
        plan: true,
        status: true,
        stripeSubscriptionId: true,
      }
    });
    
    console.log('Subscription record:', subscription);
    
    if (updatedUser.isSubscribed && updatedUser.stripeSubscriptionId === mockSubscription.id) {
      console.log('Database was updated successfully');
    } else {
      console.error('Database was not updated correctly');
    }
    
  } catch (error) {
    console.error('Error simulating webhook:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
simulateWebhook()
  .then(() => console.log('Test completed'))
  .catch(error => console.error('Test failed:', error)); 