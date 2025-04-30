# Stripe Integration for Reels Creator

This document outlines the Stripe integration for handling subscriptions in the Reels Creator application.

## Overview

The integration uses Stripe Checkout for subscription management and webhooks to handle events like successful payments, subscription updates, and cancellations.

## Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Add the following environment variables to your `.env` file:
   ```
   STRIPE_SECRET_KEY=sk_test_your_test_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
   ```
3. To get the webhook secret, use the Stripe CLI or create a webhook endpoint in the Stripe Dashboard

## API Routes

### Checkout Session API (`/api/stripe/checkout`)

This endpoint creates a Stripe checkout session for a subscription plan:

- **Method**: POST
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "planId": "plan_id_from_database",
    "billingCycle": "monthly" // or "yearly"
  }
  ```
- **Response**: JSON with checkout URL
  ```json
  {
    "url": "https://checkout.stripe.com/..."
  }
  ```

### Webhook Handler (`/api/stripe/webhook`)

This endpoint handles Stripe webhook events:

- **Method**: POST
- **Authentication**: None (verified using Stripe signature)
- **Events Handled**:
  - `checkout.session.completed`: When a user completes checkout
  - `invoice.payment_succeeded`: When a subscription renews
  - And more in the future

## Database Models

The integration uses the following models:

1. **User**: Contains Stripe customer ID, subscription ID, and subscription status
2. **Subscription**: Detailed subscription information including plan, status, and usage
3. **SubscriptionPlan**: Available plans with pricing and features

## Helper Functions

Helper functions in `lib/stripe-helpers` handle database operations:

- `updateSubscriptionRecords`: Updates user and subscription records after checkout
- `updateSubscriptionFromInvoice`: Updates records when a subscription renews
- Direct versions avoid abstraction layers for more reliable operations

## Testing

Two test scripts are provided:

1. `scripts/test-checkout.js`: Tests the checkout session creation
2. `scripts/test-webhook.js`: Simulates a webhook event for testing

Run the test scripts with:
```
node scripts/test-checkout.js
node scripts/test-webhook.js
```

## Middleware

A middleware checks subscription status for protected routes and enforces usage limits.

## Troubleshooting

Common issues:

1. **Webhook verification fails**: Check that the webhook secret is correct
2. **Invalid parameter errors**: Make sure all required parameters are passed
3. **Database errors**: Ensure transaction atomicity and error handling 