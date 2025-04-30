import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    // Verify admin access
    const session = await auth();
    
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 403 }
      );
    }

    // Get the keys from the request
    const { publishableKey, secretKey, webhookSecret } = await req.json();
    
    // Validate required parameters
    if (!publishableKey || !secretKey) {
      return NextResponse.json(
        { error: 'Missing required API keys' },
        { status: 400 }
      );
    }

    // Test if the publishable key format is valid
    if (!publishableKey.startsWith('pk_test_') && !publishableKey.startsWith('pk_live_')) {
      return NextResponse.json(
        { error: 'Invalid publishable key format. Must start with pk_test_ or pk_live_' },
        { status: 400 }
      );
    }

    // Test if the secret key format is valid
    if (!secretKey.startsWith('sk_test_') && !secretKey.startsWith('sk_live_')) {
      return NextResponse.json(
        { error: 'Invalid secret key format. Must start with sk_test_ or sk_live_' },
        { status: 400 }
      );
    }

    // Test if the webhook secret format is valid (if provided)
    if (webhookSecret && !webhookSecret.startsWith('whsec_')) {
      return NextResponse.json(
        { error: 'Invalid webhook secret format. Must start with whsec_' },
        { status: 400 }
      );
    }

    // Initialize Stripe with the provided secret key
    const stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16' as any, // Use the latest supported API version
    });

    // Test the connection by making a simple API call
    const balance = await stripe.balance.retrieve();

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Stripe connection successful',
      balance: {
        available: balance.available.map(b => ({
          amount: b.amount,
          currency: b.currency
        })),
        pending: balance.pending.map(b => ({
          amount: b.amount,
          currency: b.currency
        }))
      }
    });
  } catch (error: any) {
    console.error('Error testing Stripe connection:', error);
    
    // Extract meaningful error message from Stripe
    let errorMessage = 'Failed to connect to Stripe';
    if (error.type === 'StripeAuthenticationError') {
      errorMessage = 'Invalid API key provided';
    } else if (error.type === 'StripeConnectionError') {
      errorMessage = 'Failed to connect to Stripe API';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 