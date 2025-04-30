import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

// Make sure we have the right Stripe key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
if (!stripeSecretKey) {
  console.error("STRIPE_SECRET_KEY environment variable is not set");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16" as any,
});

export async function POST(req: NextRequest) {
  try {
    console.log("=== CUSTOMER PORTAL REQUEST STARTED ===");
    
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