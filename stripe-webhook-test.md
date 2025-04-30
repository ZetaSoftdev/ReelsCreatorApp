# Testing Stripe Webhooks with Stripe CLI

## Prerequisites
1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Have your Stripe account ready
3. Make sure your Next.js app is running

## Steps to Test Webhooks

### 1. Log in to Stripe CLI
```bash
stripe login
```

### 2. Forward Stripe Events to your local server
```bash
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```
This will show you a webhook signing secret. Copy this secret and add it to your `.env.local` file as `STRIPE_WEBHOOK_SECRET`.

### 3. Test specific events
In a new terminal window, trigger test events:

```bash
# Test checkout.session.completed event
stripe trigger checkout.session.completed

# Test invoice.payment_succeeded event
stripe trigger invoice.payment_succeeded

# Test customer.subscription.created event
stripe trigger customer.subscription.created
```

### 4. Check your terminal logs
Your Next.js app should log the received events and their processing.

## Common Issues

### 1. Signature Verification Failed
- Make sure you're using the correct webhook secret from the Stripe CLI
- Verify you're using `await req.text()` to get the raw body
- Check for any middleware that might modify the request body

### 2. Event Not Received
- Verify your webhook endpoint URL is correct
- Check that your app is running
- Make sure you have proper internet connectivity

### 3. Database Operations Failing
- Check that your database models match the fields you're trying to update
- Verify your database connections
- Look for any transaction errors

## Production Considerations
For production deployment:
1. Set up a real webhook endpoint in your Stripe Dashboard
2. Get a production webhook secret and add it to your environment variables
3. Consider implementing idempotency to avoid double-processing events
4. Add comprehensive error logging and monitoring 