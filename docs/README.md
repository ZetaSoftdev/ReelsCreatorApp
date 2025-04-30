# Stripe Subscription Integration for Reels Creator

This implementation adds subscription functionality to the Reels Creator application. Users can subscribe to different plans that provide minutes of video processing time per month.

## Components Implemented

1. **Stripe Configuration**: 
   - `lib/stripe.ts` - Core Stripe configuration
   - Environment variables for API keys and webhook secrets

2. **API Routes**:
   - `/api/stripe/checkout` - Creates checkout sessions
   - `/api/stripe/webhook` - Handles events from Stripe

3. **Helper Functions**:
   - `lib/stripe-helpers/subscription.ts` - Helper functions for updating subscription records
   - `lib/stripe-helpers/subscription-direct.ts` - Direct database operations for more reliability

4. **Middleware**:
   - `middleware/subscription.ts` - Enforces subscription limits and access control

5. **Example Usage**:
   - `app/api/video/process/route.ts` - Sample API route that validates subscription status

6. **Testing**:
   - `scripts/test-checkout.js` - Test script for checkout session creation
   - `scripts/test-webhook.js` - Test script for simulating webhook events

## Features

- Monthly and yearly subscription billing
- Different plans with varying minutes of processing time
- Automatic renewal handling
- Enforced usage limits based on minutes allowed
- Middleware for protecting premium routes
- Proper error handling and logging

## Stripe Events Handled

- `checkout.session.completed` - When a user completes checkout
- `invoice.payment_succeeded` - When a subscription renews

## Database Updates

The integration updates the following database tables:
- `User` - Stripe customer and subscription IDs, subscription status
- `Subscription` - Detailed subscription info and usage tracking
- `SubscriptionPlan` - Available plans with pricing and features

## Getting Started

1. Add required environment variables to `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_your_test_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
   ```

2. To test the checkout flow:
   ```
   node scripts/test-checkout.js
   ```

3. To simulate a webhook event:
   ```
   node scripts/test-webhook.js
   ```

## Future Improvements

- Add handling for more webhook events (cancellations, disputes, etc.)
- Implement customer portal for self-service subscription management
- Add admin dashboard for subscription analytics
- Improve error recovery mechanisms 