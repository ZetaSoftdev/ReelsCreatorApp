import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateState } from "@/lib/social/oauth-service";
import { getAuthorizationUrl } from "@/lib/social/config";
import { getCredentials } from "@/lib/social/oauth-service";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { clientId } = await getCredentials('FACEBOOK');
    if (!clientId) {
      return NextResponse.json(
        { error: "Facebook client ID not configured" }, 
        { status: 500 }
      );
    }
    
    // Generate state parameter to prevent CSRF
    const state = generateState(session.user.id, 'FACEBOOK');
    
    // Get the redirect URI
    const redirectUri = `${req.nextUrl.origin}/api/auth/callback/facebook`;
    const authUrl = getAuthorizationUrl('FACEBOOK', clientId, redirectUri, state);
    
    // Create a cookie to store the state
    const response = NextResponse.redirect(authUrl);
    response.cookies.set("oauth_state", state, { 
      httpOnly: true, 
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 10 // 10 minutes
    });
    
    return response;
  } catch (error: any) {
    console.error("Error initiating Facebook OAuth flow:", error);
    return NextResponse.json(
      { error: "Failed to start authorization", details: error.message },
      { status: 500 }
    );
  }
} 