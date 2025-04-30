import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

// Type assertion to avoid TypeScript errors with the new model
const prismaAny = prisma as any;

// Initialize with empty values, will be replaced with actual settings
// Using fallback value ensures we always have a non-empty string
let stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_fallback_for_build_only';
let stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_fallback_for_build_only';

// Log warning in development but not during build
if (process.env.NODE_ENV !== 'production') {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('⚠️ STRIPE_SECRET_KEY not set in environment variables!');
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn('⚠️ STRIPE_WEBHOOK_SECRET not set in environment variables!');
  }
}

// Create Stripe instance with default or environment values
export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
  typescript: true,
});

export let webhookSecret = stripeWebhookSecret;

// Function to initialize Stripe with database settings
export async function initializeStripe() {
  try {
    // Get the latest app settings
    const settings = await prismaAny.appSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (settings) {
      // Use database settings if available
      if (settings.stripeSecretKey) {
        stripeSecretKey = settings.stripeSecretKey;
        
        // Update the Stripe instance with the new key
        Object.assign(stripe, new Stripe(stripeSecretKey, {
          apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
          typescript: true,
        }));
        
        console.log('Stripe client initialized with database settings');
      }

      if (settings.stripeWebhookSecret) {
        webhookSecret = settings.stripeWebhookSecret;
        console.log('Stripe webhook secret initialized with database settings');
      }
    }
  } catch (error) {
    console.error('Failed to initialize Stripe with database settings:', error);
    console.log('Using environment variables as fallback for Stripe configuration');
  }
}

// Initialize Stripe on import
initializeStripe().catch(console.error); 