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
      console.error("Facebook OAuth error:", error);
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
    
    // Verify this is actually a Facebook callback
    if (platform !== 'FACEBOOK') {
      console.error(`Platform mismatch in callback: expected FACEBOOK, got ${platform}`);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social-accounts?error=platform_mismatch`);
    }
    
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/facebook`;
    
    // Exchange authorization code for tokens
    const tokenResponse = await exchangeCodeForToken(platform, code, redirectUri);
    // Cast to any to handle Facebook's response format
    const tokenData = tokenResponse as any;
    
    // Facebook API response structure
    const accessToken = tokenData.access_token;
    // Some Facebook flows provide long-lived tokens
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in;
    
    // Get the user's Facebook info
    let accountName = "Facebook Page";
    
    try {
      // Get user info from Facebook Graph API
      const userInfoResponse = await fetch(`https://graph.facebook.com/v18.0/me?fields=name,id&access_token=${accessToken}`);
      
      if (userInfoResponse.ok) {
        const userData = await userInfoResponse.json();
        accountName = userData.name || `Facebook User ${userData.id}`;
        
        // Try to get pages the user has access to (for publishing)
        const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`);
        
        if (pagesResponse.ok) {
          const pagesData = await pagesResponse.json();
          if (pagesData.data && pagesData.data.length > 0) {
            // If user has pages, use the first page as the account name
            accountName = pagesData.data[0].name || accountName;
          }
        }
      }
    } catch (userInfoError) {
      console.error("Error fetching Facebook user info:", userInfoError);
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
    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social-accounts?connected=facebook`);
    response.cookies.delete("oauth_state");
    
    return response;
  } catch (error: any) {
    console.error("Error processing Facebook OAuth callback:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social-accounts?error=${encodeURIComponent(error.message)}`
    );
  }
} 