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
      console.error("YouTube OAuth error:", error);
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
    
    // Verify this is actually a YouTube callback
    if (platform !== 'YOUTUBE') {
      console.error(`Platform mismatch in callback: expected YOUTUBE, got ${platform}`);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social-accounts?error=platform_mismatch`);
    }
    
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/youtube`;
    
    // Exchange authorization code for tokens
    const tokenData = await exchangeCodeForToken(platform, code, redirectUri);
    
    // Make an additional API call to get the YouTube channel name
    const userInfoResponse = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`
      }
    });
    
    let accountName = "YouTube Channel";
    
    // Try to get the channel name
    if (userInfoResponse.ok) {
      const userData = await userInfoResponse.json();
      if (userData.items && userData.items.length > 0) {
        accountName = userData.items[0].snippet.title || accountName;
      }
    }
    
    // Save the tokens in the database
    await saveUserToken(
      userId,
      platform,
      accountName,
      tokenData.access_token,
      tokenData.refresh_token,
      tokenData.expires_in
    );
    
    // Clear the state cookie
    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social-accounts?connected=youtube`);
    response.cookies.delete("oauth_state");
    
    return response;
  } catch (error: any) {
    console.error("Error processing YouTube OAuth callback:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social-accounts?error=${encodeURIComponent(error.message)}`
    );
  }
} 