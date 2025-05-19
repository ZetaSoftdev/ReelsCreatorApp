import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateState, getCredentials, generateCodeVerifier, generateCodeChallenge } from "@/lib/social/oauth-service";

export async function GET(req: NextRequest) {
  try {
    console.log("Starting TikTok authorization process");
    
    const session = await auth();
    if (!session?.user?.id) {
      console.error("Unauthorized: No user session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { clientId } = await getCredentials('TIKTOK');
    
    if (!clientId) {
      console.error("TikTok client ID not configured");
      return NextResponse.json(
        { error: "TikTok client ID not configured" }, 
        { status: 500 }
      );
    }
    
    console.log("TikTok Client ID:", clientId);
    
    // Generate state parameter to prevent CSRF
    const state = generateState(session.user.id, 'TIKTOK');
    
    // Generate PKCE code verifier and challenge
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    
    console.log("Code Verifier:", codeVerifier);
    console.log("Code Challenge:", codeChallenge);
    
    // Build the redirect URI using process.env.NEXT_PUBLIC_APP_URL
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/tiktok`;
    console.log("Using redirect URI:", redirectUri);
    
    // Build TikTok authorization URL with correct scope parameter format
    const authUrlParams = new URLSearchParams();
    authUrlParams.append("client_key", clientId); // Use client_key instead of client_id
    authUrlParams.append("redirect_uri", redirectUri);
    
    // TikTok can be very picky about scope format
    // Based on TikTok documentation and API version, try the most compatible format
    const scopeString = "user.info.basic,video.upload,video.publish";
    console.log("Using scope string:", scopeString);
    
    // Add a custom prompt to ensure user understands permissions needed
    authUrlParams.append("scope", scopeString);
    authUrlParams.append("response_type", "code");
    authUrlParams.append("state", state);
    authUrlParams.append("code_challenge", codeChallenge);
    authUrlParams.append("code_challenge_method", "S256");
    
    // Force reauthorization to ensure all scopes are granted
    authUrlParams.append("force_reauthorize", "true");
    // Add a timestamp to ensure unique authorization requests
    authUrlParams.append("nonce", Date.now().toString());
    // Ensure we're requesting a fresh prompt
    authUrlParams.append("prompt", "consent");
    
    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?${authUrlParams.toString()}`;
    
    console.log("Authorization URL params:", authUrlParams.toString());
    console.log("Full Authorization URL:", authUrl);
    
    // Create cookies to store the state and code verifier
    const response = NextResponse.redirect(authUrl);
    response.cookies.set("oauth_state", state, { 
      httpOnly: true, 
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 10 // 10 minutes
    });
    
    // Store code verifier in a cookie for the token exchange step
    response.cookies.set("oauth_code_verifier", codeVerifier, { 
      httpOnly: true, 
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 10 // 10 minutes
    });
    
    // Also store the exact redirect URI for later use in the callback
    response.cookies.set("oauth_redirect_uri", redirectUri, { 
      httpOnly: true, 
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 10 // 10 minutes
    });
    
    console.log("Redirecting to TikTok authorization page");
    return response;
  } catch (error: any) {
    console.error("Error initiating TikTok OAuth flow:", error);
    return NextResponse.json(
      { error: "Failed to start authorization", details: error.message },
      { status: 500 }
    );
  }
} 