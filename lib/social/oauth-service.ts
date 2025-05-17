import { SocialPlatform, SocialMediaAccount } from "@prisma/client";
import { socialPlatformConfigs } from "./config";
import { encrypt, decrypt } from "@/lib/encryption";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

/**
 * Get credentials for a social platform from database or environment variables
 */
export async function getCredentials(platform: SocialPlatform) {
  try {
    // Try to fetch from app settings in database first
    const settings = await prisma.appSettings.findFirst();
    
    // Platform-specific credential keys
    const platformKey = platform.toLowerCase();
    const clientIdKey = `${platformKey}ClientId`;
    const clientSecretKey = `${platformKey}ClientSecret`;
    
    // First try database, then env vars
    const clientId = (settings as any)?.[clientIdKey] || process.env[`${platform}_CLIENT_ID`];
    const clientSecret = (settings as any)?.[clientSecretKey] || process.env[`${platform}_CLIENT_SECRET`];
    
    // Create sample entry in AppSettings if we're in development mode and credentials aren't set
    if ((!clientId || !clientSecret) && process.env.NODE_ENV === 'development') {
      console.log(`Development mode: No ${platform} credentials found. You should set up OAuth credentials.`);
      
      // Check if we're in development only
      if (!settings) {
        try {
          // Try to create initial AppSettings
          const initialSettings = await prisma.appSettings.create({
            data: {
              userRegistration: true,
              maxUploadSize: 500,
              defaultVideoQuality: '720p',
              defaultLanguage: 'en',
              enableEmailNotifications: true,
              maintenanceMode: false,
              fromEmail: 'noreply@reelscreator.com',
              enableSMTP: false,
              trialPeriod: 14,
              defaultPlan: 'basic',
              enableRecurring: true,
              gracePeriod: 3,
              allowCancellation: true,
              stripeLiveMode: false,
              dataRetentionDays: 90,
              allowDataExport: true,
              storageProvider: 'local',
              maxStorageGB: 50,
              // Additional fields for social media
              [`${platformKey}ClientId`]: 'DEMO_CLIENT_ID_FOR_DEV',
              [`${platformKey}ClientSecret`]: 'DEMO_CLIENT_SECRET_FOR_DEV'
            }
          });
          
          console.log(`Created initial app settings with demo ${platform} credentials`);
        } catch (createError) {
          console.error(`Failed to create initial app settings:`, createError);
        }
      }
    }
    
    return { clientId, clientSecret };
  } catch (error) {
    console.error(`Error fetching credentials for ${platform}:`, error);
    
    // Fallback to environment variables
    return { 
      clientId: process.env[`${platform}_CLIENT_ID`],
      clientSecret: process.env[`${platform}_CLIENT_SECRET`]
    };
  }
}

/**
 * Generate a secure state parameter for OAuth flow
 */
export function generateState(userId: string, platform: SocialPlatform): string {
  // Generate a random state value to prevent CSRF
  const randomState = crypto.randomBytes(20).toString('hex');
  
  // Combine user ID and platform with random state
  return `${userId}:${platform}:${randomState}`;
}

/**
 * Parse state parameter from OAuth callback
 */
export function parseState(state: string): { userId: string, platform: SocialPlatform, randomState: string } | null {
  try {
    const [userId, platform, randomState] = state.split(':');
    return { 
      userId, 
      platform: platform as SocialPlatform,
      randomState
    };
  } catch {
    return null;
  }
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  platform: SocialPlatform,
  code: string,
  redirectUri: string,
  codeVerifier?: string
): Promise<TokenResponse> {
  const { clientId, clientSecret } = await getCredentials(platform);
  const config = socialPlatformConfigs[platform];
  
  console.log(`Exchanging code for token for ${platform}`);
  console.log(`Using token URL: ${config.tokenUrl}`);
  console.log(`Redirect URI: ${redirectUri}`);
  
  // Different parameter names for TikTok vs other platforms
  const params = new URLSearchParams();
  
  if (platform === 'TIKTOK') {
    params.append('client_key', clientId);
    params.append('client_secret', clientSecret);
    params.append('code', code);
    params.append('redirect_uri', redirectUri);
    params.append('grant_type', 'authorization_code');
    
    // Add code_verifier for PKCE if provided
    if (codeVerifier) {
      params.append('code_verifier', codeVerifier);
    }
    
    console.log(`TikTok token exchange parameters: ${params.toString()}`);
  } else {
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('code', code);
    params.append('redirect_uri', redirectUri);
    params.append('grant_type', 'authorization_code');
  }
  
  try {
    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });
    
    const responseText = await response.text();
    console.log(`Token exchange response status: ${response.status}`);
    console.log(`Token exchange response headers: ${JSON.stringify(Object.fromEntries(response.headers))}`);
    
    if (!response.ok) {
      console.error(`Token exchange error (${response.status}): ${responseText}`);
      throw new Error(`Failed to exchange code for token: ${response.status} - ${responseText}`);
    }
    
    // Parse JSON response
    try {
      const jsonResponse = JSON.parse(responseText);
      
      if (platform === 'TIKTOK' && jsonResponse.error_code !== undefined) {
        // TikTok returns error details in a different format
        throw new Error(`TikTok API error: ${jsonResponse.error_code} - ${jsonResponse.message || 'Unknown error'}`);
      }
      
      return jsonResponse;
    } catch (jsonError) {
      console.error("Failed to parse token response as JSON:", jsonError);
      throw new Error(`Invalid response format: ${responseText.substring(0, 100)}...`);
    }
  } catch (error) {
    console.error(`Error during token exchange for ${platform}:`, error);
    throw error;
  }
}

/**
 * Save user's OAuth tokens to database
 */
export async function saveUserToken(
  userId: string,
  platform: SocialPlatform,
  accountName: string,
  accessToken: string,
  refreshToken?: string,
  expiresIn?: number
) {
  const tokenExpiry = expiresIn ? new Date(Date.now() + expiresIn * 1000) : undefined;
  
  // Check if account already exists
  const existingAccount = await prisma.socialMediaAccount.findFirst({
    where: {
      userId,
      platform,
      accountName
    }
  });
  
  if (existingAccount) {
    // Update existing account
    return prisma.socialMediaAccount.update({
      where: { id: existingAccount.id },
      data: {
        accessToken: encrypt(accessToken),
        refreshToken: refreshToken ? encrypt(refreshToken) : null,
        tokenExpiry,
        isActive: true,
        updatedAt: new Date()
      }
    });
  } else {
    // Create new account
    return prisma.socialMediaAccount.create({
      data: {
        userId,
        platform,
        accountName,
        accessToken: encrypt(accessToken),
        refreshToken: refreshToken ? encrypt(refreshToken) : null,
        tokenExpiry,
        isActive: true
      }
    });
  }
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(account: SocialMediaAccount) {
  // Only refresh if we have a refresh token and the token is expired
  if (
    !account.refreshToken || 
    (account.tokenExpiry && new Date(account.tokenExpiry) > new Date())
  ) {
    return account;
  }
  
  try {
    console.log(`Refreshing access token for ${account.platform} account ${account.id}`);
    const refreshToken = decrypt(account.refreshToken);
    const { clientId, clientSecret } = await getCredentials(account.platform);
    const config = socialPlatformConfigs[account.platform];
    
    // Different parameter formats for different platforms
    const params = new URLSearchParams();
    
    if (account.platform === 'TIKTOK') {
      params.append('client_key', clientId);
      params.append('client_secret', clientSecret);
      params.append('refresh_token', refreshToken);
      params.append('grant_type', 'refresh_token');
    } else {
      params.append('client_id', clientId);
      params.append('client_secret', clientSecret);
      params.append('refresh_token', refreshToken);
      params.append('grant_type', 'refresh_token');
    }
    
    console.log(`Making token refresh request to: ${config.tokenUrl}`);
    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Token refresh failed with status ${response.status}: ${errorText}`);
      throw new Error(`Failed to refresh token: ${response.status} - ${errorText}`);
    }
    
    const responseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse refresh token response:", parseError);
      throw new Error(`Invalid refresh token response: ${responseText.substring(0, 100)}...`);
    }
    
    console.log(`Token refresh successful for ${account.platform}`);
    
    const newAccessToken = data.access_token;
    // Some providers return a new refresh token, others don't
    const newRefreshToken = data.refresh_token || refreshToken; 
    const expiresIn = data.expires_in || 3600; // Default to 1 hour
    
    console.log(`New token expires in ${expiresIn} seconds`);
    
    // Update account with new tokens
    const updatedAccount = await prisma.socialMediaAccount.update({
      where: { id: account.id },
      data: {
        accessToken: encrypt(newAccessToken),
        refreshToken: encrypt(newRefreshToken),
        tokenExpiry: new Date(Date.now() + expiresIn * 1000),
        updatedAt: new Date()
      }
    });
    
    return updatedAccount;
  } catch (error) {
    console.error(`Error refreshing access token for account ${account.id}:`, error);
    
    // Handle expired refresh token by marking account as inactive
    await prisma.socialMediaAccount.update({
      where: { id: account.id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });
    
    throw error;
  }
}

/**
 * Generate a code verifier for PKCE
 */
export function generateCodeVerifier(): string {
  const verifier = crypto.randomBytes(32)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  console.log("Generated Code Verifier:", verifier);
  return verifier;
}

/**
 * Generate a code challenge from verifier for PKCE
 */
export function generateCodeChallenge(verifier: string): string {
  // TikTok specifically requires hex encoding of SHA256 hash
  console.log("Generating code challenge for verifier:", verifier);
  
  const hash = crypto.createHash('sha256')
    .update(verifier)
    .digest('hex');
  
  console.log("Generated code challenge (hex):", hash);
  return hash;
} 