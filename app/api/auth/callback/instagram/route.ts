import { NextRequest, NextResponse } from "next/server";
import { parseState, exchangeCodeForToken, saveUserToken } from "@/lib/social/oauth-service";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateParam = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    
    // Get state from cookie for validation
    const stateCookie = req.cookies.get("oauth_state")?.value;
    
    if (error) {
      console.error("Instagram OAuth error:", error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social-accounts?error=${error}`);
    }
    
    if (!code || !stateParam || !stateCookie || stateParam !== stateCookie) {
      console.error("Invalid OAuth callback parameters or state mismatch");
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social-accounts?error=invalid_request`);
    }
    
    // Parse state to get user ID and platform
    const stateData = parseState(stateParam);
    if (!stateData) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social-accounts?error=invalid_state`);
    }
    
    const { userId, platform } = stateData;
    
    // Verify this is actually an Instagram callback
    if (platform !== 'INSTAGRAM') {
      console.error(`Platform mismatch in callback: expected INSTAGRAM, got ${platform}`);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social-accounts?error=platform_mismatch`);
    }
    
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/instagram`;
    
    // Exchange authorization code for tokens
    const tokenResponse = await exchangeCodeForToken(platform, code, redirectUri);
    // Cast to any to handle Instagram's response format
    const tokenData = tokenResponse as any;
    
    // Instagram API response structure
    const accessToken = tokenData.access_token;
    // Instagram doesn't usually provide refresh tokens in basic flow
    const refreshToken = undefined;
    const expiresIn = tokenData.expires_in;
    
    // Get the user's Instagram info from the token exchange response
    let accountName = "Instagram Account";
    
    // If user ID is available
    if (tokenData.user_id) {
      try {
        // Try to get account username using additional API call
        const userInfoResponse = await fetch(`https://graph.instagram.com/v18.0/${tokenData.user_id}?fields=username,name&access_token=${accessToken}`);
        
        if (userInfoResponse.ok) {
          const userData = await userInfoResponse.json();
          accountName = userData.username || userData.name || accountName;
        } else {
          // Use user ID if we can't get username
          accountName = `Instagram User ${tokenData.user_id}`;
        }
      } catch (userInfoError) {
        console.error("Error fetching Instagram user info:", userInfoError);
      }
    }
    
    // Save the tokens in the database
    await saveUserToken(
      userId,
      platform,
      accountName,
      accessToken,
      refreshToken,
      expiresIn
    );
    
    // Clear the state cookie
    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social-accounts?connected=instagram`);
    response.cookies.delete("oauth_state");
    
    return response;
  } catch (error: any) {
    console.error("Error processing Instagram OAuth callback:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social-accounts?error=${encodeURIComponent(error.message)}`
    );
  }
} 