import { NextRequest, NextResponse } from "next/server";
import { parseState, exchangeCodeForToken, saveUserToken } from "@/lib/social/oauth-service";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateParam = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");
    const errorType = url.searchParams.get("error_type");
    const errCode = url.searchParams.get("errCode");
    const scopes = url.searchParams.get("scopes");
    
    console.log("TikTok Callback URL:", url.toString());
    console.log("TikTok Callback Code:", code);
    console.log("TikTok Callback State:", stateParam);
    console.log("TikTok Callback Scopes:", scopes);
    console.log("TikTok Error Type:", errorType);
    console.log("TikTok Error Code:", errCode);
    
    if (error) {
      console.error("TikTok OAuth error:", error);
      console.error("Error description:", errorDescription);
      console.error("Error type:", errorType);
      console.error("Error code:", errCode);
      
      // Handle specific error cases
      if (errorType === 'code_challenge' || error === 'param_error') {
        console.error("Code challenge error or parameter error - this typically means the code_challenge format or scope is incorrect");
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social-accounts?error=code_challenge_error&error_description=${encodeURIComponent(errorDescription || 'Invalid parameters')}`);
      }
      
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social-accounts?error=${error}&error_description=${encodeURIComponent(errorDescription || '')}`);
    }
    
    // Get state and code verifier from cookies for validation
    const stateCookie = req.cookies.get("oauth_state")?.value;
    const codeVerifier = req.cookies.get("oauth_code_verifier")?.value;
    const redirectUriCookie = req.cookies.get("oauth_redirect_uri")?.value;
    
    console.log("Cookie State:", stateCookie);
    console.log("Cookie Code Verifier:", codeVerifier);
    console.log("Cookie Redirect URI:", redirectUriCookie);
    
    if (!code || !stateParam || !stateCookie || stateParam !== stateCookie) {
      console.error("Invalid OAuth callback parameters or state mismatch");
      console.error("Code exists:", !!code);
      console.error("State param exists:", !!stateParam);
      console.error("State cookie exists:", !!stateCookie);
      console.error("State match:", stateParam === stateCookie);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social-accounts?error=invalid_request`);
    }
    
    // Parse state to get user ID and platform
    const stateData = parseState(stateParam);
    if (!stateData) {
      console.error("Could not parse state data");
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social-accounts?error=invalid_state`);
    }
    
    const { userId, platform } = stateData;
    console.log("Parsed User ID:", userId);
    console.log("Parsed Platform:", platform);
    
    // Verify this is actually a TikTok callback
    if (platform !== 'TIKTOK') {
      console.error(`Platform mismatch in callback: expected TIKTOK, got ${platform}`);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social-accounts?error=platform_mismatch`);
    }
    
    // Verify we have the code verifier
    if (!codeVerifier) {
      console.error("Missing code verifier for PKCE flow");
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social-accounts?error=missing_code_verifier`);
    }
    
    // Use the redirect URI from the cookie, or build it dynamically if not available
    let redirectUri = redirectUriCookie;
    if (!redirectUri) {
      redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/tiktok`;
      console.log("Built redirect URI using NEXT_PUBLIC_APP_URL:", redirectUri);
    }
    
    console.log("Using redirectUri:", redirectUri);
    console.log("Code:", code);
    console.log("Code Verifier:", codeVerifier);
    
    try {
      // Exchange authorization code for tokens with code verifier
      const tokenResponse = await exchangeCodeForToken(platform, code, redirectUri, codeVerifier);
      // Cast to any to handle TikTok's different response format
      const tokenData = tokenResponse as any;
      
      console.log("Token Response:", JSON.stringify(tokenData, null, 2));
      
      // TikTok API has a nested structure for token responses
      const accessToken = tokenData.access_token || 
                        (tokenData.data && tokenData.data.access_token);
      const refreshToken = tokenData.refresh_token || 
                          (tokenData.data && tokenData.data.refresh_token);
      const expiresIn = tokenData.expires_in || 
                      (tokenData.data && tokenData.data.expires_in);
      
      if (accessToken) {
        console.log("Access Token:", accessToken.substring(0, 10) + "...");
      } else {
        console.error("No access token found in token response");
        console.error("Full token response:", tokenData);
        throw new Error("No access token returned from TikTok");
      }
      
      if (refreshToken) {
        console.log("Refresh Token:", refreshToken.substring(0, 10) + "...");
      }
      console.log("Expires In:", expiresIn);
      
      // Get the user's TikTok info
      let accountName = "TikTok Account";
      let openId = tokenData.open_id || (tokenData.data && tokenData.data.open_id);
      
      console.log("Open ID:", openId);
      
      // Log the scope information if available
      const grantedScopes = tokenData.scope || (tokenData.data && tokenData.data.scope);
      if (grantedScopes) {
        console.log("Granted scopes:", grantedScopes);
        
        // Verify required scopes are present
        const requiredScopes = ['video.publish', 'video.upload', 'user.info.basic'];
        const scopeList = typeof grantedScopes === 'string' ? grantedScopes.split(',') : grantedScopes;
        
        // Log each granted scope for debugging
        if (Array.isArray(scopeList)) {
          scopeList.forEach(scope => console.log(`Granted scope: ${scope}`));
        }
        
        const missingScopes = requiredScopes.filter(scope => {
          // TikTok sometimes returns scope names with different formatting
          // Check for variations of the scope name
          return !scopeList.some((granted: string) => 
            granted === scope || 
            granted.replace(/\./g, '_') === scope.replace(/\./g, '_') ||
            granted.toLowerCase() === scope.toLowerCase()
          );
        });
        
        if (missingScopes.length > 0) {
          console.warn(`Missing required scopes: ${missingScopes.join(', ')}`);
          
          // Save the account anyway but with a special note
          await saveUserToken(
            userId,
            platform,
            `${accountName} (Limited Access)`,
            accessToken,
            refreshToken,
            expiresIn
          );
          
          // Redirect with scope warning
          const response = NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social-accounts?connected=tiktok&scope_warning=true&missing_scopes=${missingScopes.join(',')}`
          );
          response.cookies.delete("oauth_state");
          response.cookies.delete("oauth_code_verifier");
          response.cookies.delete("oauth_redirect_uri");
          
          return response;
        }
      } else {
        console.warn("No scope information in token response");
      }
      
      // If we have user info from the token response
      if (tokenData.data && tokenData.data.user_info) {
        accountName = tokenData.data.user_info.username || 
                    tokenData.data.user_info.display_name || 
                    accountName;
        console.log("Account Name from user_info:", accountName);
      } else if (accessToken && openId) {
        // Alternatively, we could make an API call to get user data
        // This is just a placeholder for demonstration purposes
        try {
          // In a real implementation, we would call the TikTok API for user info
          accountName = `TikTok User ${openId.substring(0, 6)}`;
          console.log("Generated Account Name:", accountName);
        } catch (userInfoError) {
          console.error("Error fetching TikTok user info:", userInfoError);
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
      
      console.log("Saved token for user:", userId);
      
      // Clear the cookies
      const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social-accounts?connected=tiktok`);
      response.cookies.delete("oauth_state");
      response.cookies.delete("oauth_code_verifier");
      response.cookies.delete("oauth_redirect_uri");
      
      return response;
    } catch (tokenError: any) {
      console.error("Token exchange error:", tokenError.message);
      console.error("Token exchange error details:", tokenError);
      console.error("Token exchange error stack:", tokenError.stack);
      
      // Log more details about the request
      console.error("Request URL:", req.url);
      console.error("Headers:", Object.fromEntries(req.headers));
      
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social-accounts?error=token_exchange&details=${encodeURIComponent(tokenError.message || "Unknown error during token exchange")}`
      );
    }
  } catch (error: any) {
    console.error("Error processing TikTok OAuth callback:", error);
    console.error("Error stack:", error.stack);
    
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/social-accounts?error=${encodeURIComponent(error.message || "Unknown error")}`
    );
  }
}