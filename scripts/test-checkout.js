/**
 * Test script for simulating Stripe checkout session creation
 * 
 * This script tests the checkout functionality by simulating a request
 * to create a checkout session for a subscription plan.
 */

// Load environment variables
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');

// Create clients
const prisma = new PrismaClient();

// Check for stripe secret key
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Missing STRIPE_SECRET_KEY environment variable');
  process.exit(1);
}

// Create Stripe instance
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

async function testCheckout() {
  try {
    console.log('===== CHECKOUT TEST STARTING =====');
    
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
    console.log('Found plan:', plan.id, plan.name, plan.monthlyPrice);
    
    // Create a checkout session
    console.log('Creating checkout session...');
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
              description: `Subscription plan with ${plan.minutesAllowed} minutes of editing per month`,
            },
            unit_amount: Math.round(plan.monthlyPrice * 100), // Convert to cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: {
        userId: user.id,
        planId: plan.id,
      },
    });
    
    console.log('Checkout session created:', {
      id: session.id,
      url: session.url,
      metadata: session.metadata,
    });
    
    console.log('===== CHECKOUT TEST COMPLETED =====');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testCheckout()
  .then(() => console.log('Test script completed'))
  .catch((error) => console.error('Unhandled error:', error)); 