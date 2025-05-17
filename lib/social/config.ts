import { SocialPlatform } from "@prisma/client";

export interface SocialPlatformConfig {
  name: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
  additionalParams?: Record<string, string>;
  apiVersion?: string;
}

export const socialPlatformConfigs: Record<SocialPlatform, SocialPlatformConfig> = {
  YOUTUBE: {
    name: "YouTube",
    authorizationUrl: "https://accounts.google.com/o/oauth2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube"
    ],
    additionalParams: {
      access_type: "offline",
      prompt: "consent"
    }
  },
  TIKTOK: {
    name: "TikTok",
    authorizationUrl: "https://www.tiktok.com/v2/auth/authorize/",
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
    scopes: [
      "user.info.basic",
      "video.publish",
      "video.upload"
    ]
  },
  INSTAGRAM: {
    name: "Instagram",
    authorizationUrl: "https://api.instagram.com/oauth/authorize",
    tokenUrl: "https://api.instagram.com/oauth/access_token",
    scopes: [
      "instagram_basic",
      "instagram_content_publish"
    ]
  },
  FACEBOOK: {
    name: "Facebook",
    authorizationUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    scopes: [
      "pages_show_list",
      "pages_read_engagement",
      "pages_manage_posts",
      "publish_video"
    ],
    apiVersion: "v18.0"
  },
  TWITTER: {
    name: "Twitter",
    authorizationUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
    scopes: [
      "tweet.read",
      "tweet.write",
      "users.read",
      "offline.access"
    ]
  }
};

/**
 * Generate an authorization URL for the specified social platform
 */
export function getAuthorizationUrl(
  platform: SocialPlatform,
  clientId: string,
  redirectUri: string,
  state: string
): string {
  const config = socialPlatformConfigs[platform];
  const scopeString = config.scopes.join(" ");
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopeString,
    response_type: "code",
    state
  });
  
  // Add additional params if specified
  if (config.additionalParams) {
    Object.entries(config.additionalParams).forEach(([key, value]) => {
      params.append(key, value);
    });
  }
  
  return `${config.authorizationUrl}?${params.toString()}`;
} 