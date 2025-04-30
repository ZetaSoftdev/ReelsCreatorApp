import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { Role } from '@/lib/constants';
import { stripe, webhookSecret } from '@/lib/stripe';

// Type assertion to avoid TypeScript errors with the new model
const prismaAny = prisma as any;
// Type assertion for Stripe
const stripeAny = stripe as any;

export async function GET() {
  try {
    // Check authentication and authorization
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Only administrators can access Stripe status" },
        { status: 403 }
      );
    }

    // Get app settings from database
    const settings = await prismaAny.appSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    // Check environment variables
    const envVars = {
      publishableKeyExists: !!process.env.STRIPE_PUBLISHABLE_KEY,
      secretKeyExists: !!process.env.STRIPE_SECRET_KEY,
      webhookSecretExists: !!process.env.STRIPE_WEBHOOK_SECRET
    };

    // Check database credentials
    const dbCreds = {
      publishableKeyExists: !!settings?.stripePublishableKey,
      secretKeyExists: !!settings?.stripeSecretKey,
      webhookSecretExists: !!settings?.stripeWebhookSecret,
      liveMode: !!settings?.stripeLiveMode
    };

    // Check active credentials (what's actually being used)
    const activeCreds = {
      publishableKeyExists: !!stripeAny.publishableKey,
      secretKeyExists: !!stripeAny.apiKey,
      webhookSecretExists: !!webhookSecret,
      liveMode: typeof stripeAny.apiKey === 'string' && stripeAny.apiKey.startsWith('sk_live_') || false
    };

    return NextResponse.json({
      success: true,
      status: {
        databaseCredentials: dbCreds,
        activeCredentials: activeCreds,
        environmentVariables: envVars
      }
    });

  } catch (error: any) {
    console.error("Error checking Stripe status:", error);
    return NextResponse.json(
      { 
        error: "Failed to check Stripe status", 
        details: error.message || "Unknown error" 
      },
      { status: 500 }
    );
  }
} 