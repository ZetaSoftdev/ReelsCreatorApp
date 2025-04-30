import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe, initializeStripe } from "@/lib/stripe";

// Force this route to be treated as a server-side route, not Edge
export const runtime = 'nodejs';

// Add GET handler for build-time
export async function GET() {
  return NextResponse.json({ message: 'Stripe customer portal endpoint is available.' });
}

export async function POST(req: NextRequest) {
  try {
    console.log("=== CUSTOMER PORTAL REQUEST STARTED ===");
    
    // Initialize Stripe with latest settings from database
    await initializeStripe();
    
    // Check if this is the build environment with dummy keys
    if (process.env.NODE_ENV === 'production' && 
        (stripe as any)._api.auth.includes('fallback_for_build_only')) {
      console.log('Build environment detected with fallback Stripe key');
      return NextResponse.json(
        { 
          message: 'Stripe customer portal endpoint is available but not configured during build.',
          environment: process.env.NODE_ENV,
          error: 'Missing proper Stripe API configuration'
        }, 
        { status: 200 }
      );
    }
    
    // Get the authenticated user
    const session = await auth();
    if (!session?.user) {
      console.error("Authentication failed for customer portal request");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    console.log(`Authenticated user for customer portal: ${session.user.id}`);

    // Get the user with subscription data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      console.error(`User not found in database: ${session.user.id}`);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has a Stripe customer ID
    if (!user.stripeCustomerId) {
      console.error(`No Stripe customer ID found for user: ${user.id}`);
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 400 }
      );
    }
    
    console.log(`Creating portal session for Stripe customer: ${user.stripeCustomerId}`);

    try {
      // Create a customer portal session
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${req.nextUrl.origin}/dashboard/subscription?portal_action=returned`,
      });

      console.log(`Portal session created successfully: ${portalSession.id}`);
      
      // Return the session URL
      return NextResponse.json({ url: portalSession.url });
    } catch (stripeError: any) {
      console.error("Stripe API error:", stripeError);
      
      let errorMessage = "Failed to create customer portal session";
      if (stripeError.type === 'StripeAuthenticationError') {
        errorMessage = "Invalid Stripe API key";
      } else if (stripeError.type === 'StripeInvalidRequestError') {
        errorMessage = stripeError.message || "Invalid request to Stripe";
      }
      
      return NextResponse.json(
        { error: errorMessage, details: stripeError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error creating customer portal session:", error);
    return NextResponse.json(
      { error: "Failed to create customer portal session", details: error.message },
      { status: 500 }
    );
  }
} 