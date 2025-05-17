// Define Role enum to match Prisma schema
export enum Role {
  USER = "USER",
  ADMIN = "ADMIN",
}

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  PROFILE: "/dashboard/profile",
  ADMIN: "/dashboard/admin",
  SOCIAL_ACCOUNTS: "/dashboard/social-accounts",
  SOCIAL_SETTINGS: "/dashboard/admin/social-settings",
  
  // API routes
  API: {
    AUTH: {
      AUTHORIZE: {
        YOUTUBE: "/api/auth/authorize/youtube",
        TIKTOK: "/api/auth/authorize/tiktok",
        INSTAGRAM: "/api/auth/authorize/instagram",
        FACEBOOK: "/api/auth/authorize/facebook",
        TWITTER: "/api/auth/authorize/twitter"
      },
      CALLBACK: {
        YOUTUBE: "/api/auth/callback/youtube",
        TIKTOK: "/api/auth/callback/tiktok",
        INSTAGRAM: "/api/auth/callback/instagram",
        FACEBOOK: "/api/auth/callback/facebook",
        TWITTER: "/api/auth/callback/twitter"
      }
    },
    SOCIAL: {
      ACCOUNTS: "/api/social/accounts",
      PUBLISH: "/api/social/publish"
    },
    ADMIN: {
      SOCIAL_CREDENTIALS: "/api/admin/social-credentials"
    }
  }
}; 