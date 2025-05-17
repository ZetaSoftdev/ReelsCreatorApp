# Architecture Blueprint

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Directory Structure](#directory-structure)
4. [Core Components](#core-components)
5. [API Structure](#api-structure)
6. [Database Schema](#database-schema)
7. [Authentication](#authentication)
8. [Application Flows](#application-flows)
9. [Stripe Integration](#stripe-integration)
10. [Video Processing](#video-processing)
11. [Social Media Integration](#social-media-integration)
12. [Coding Conventions](#coding-conventions)
13. [Error Handling](#error-handling)

## Overview

This is an AI video editing application for content creators that simplifies the content creation process. The application follows a Next.js app router architecture with a focus on server components and API routes. It uses Prisma ORM to interact with a PostgreSQL database and integrates with Stripe for subscription management.

## Technology Stack

- **Frontend**: Next.js 14+, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Payment Processing**: Stripe
- **Video Processing**: FFMPEG
- **Styling**: Tailwind CSS with shadcn/ui components
- **Deployment**: Railway

## Directory Structure

```
project/
├── app/                      # Main Next.js app router directory
│   ├── (root)/               # Public-facing routes
│   ├── admin/                # Admin dashboard routes
│   ├── api/                  # API endpoints
│   ├── dashboard/            # User dashboard routes
│   └── components/           # App-specific components
├── components/               # Shared components
├── lib/                      # Utility functions and shared logic
│   └── stripe-helpers/       # Stripe integration helpers
├── middleware/               # Next.js middleware
├── prisma/                   # Prisma schema and migrations
├── hooks/                    # Custom React hooks
├── public/                   # Static assets
├── types/                    # TypeScript type definitions
├── utils/                    # Utility functions
└── scripts/                  # Maintenance and utility scripts
```

## Core Components

### Auth System
- Located in `/auth.ts`
- Uses NextAuth for authentication
- Provides user session management and protection for authenticated routes

### Database Access
- Prisma client configuration in `lib/prisma.ts`
- Database utilities in `lib/db.ts`
- Subscription verification in `lib/subscriptionCheck.ts`

### UI Components
- Reusable UI components in `/components`
- Dashboard-specific components in `/app/dashboard/components`
- Admin-specific components in `/app/admin/components`
- Uses shadcn/ui component system

### Stripe Integration
- Stripe configuration in `lib/stripe.ts`
- Subscription helpers in `lib/stripe-helpers/subscription.ts`
- Direct database operations in `lib/stripe-helpers/subscription-direct.ts`
- Webhook handler in `app/api/stripe/webhook/route.ts`
- Checkout flow in `app/api/stripe/checkout/route.ts`
- Customer portal in `app/api/stripe/customer-portal/route.ts`
- Session verification in `app/api/stripe/verify-session/route.ts`

## API Structure

```
app/api/
├── admin/                   # Admin-only APIs
│   ├── subscriptions/       # Manage user subscriptions
│   ├── stripe/              # Admin Stripe settings
│   └── ...
├── auth/                    # Authentication endpoints
├── stripe/                  # Stripe-related endpoints
│   ├── checkout/            # Create checkout sessions
│   ├── webhook/             # Handle Stripe webhooks
│   ├── customer-portal/     # Customer portal session creation
│   ├── verify-session/      # Verify and repair subscription sessions
│   └── test-webhook/        # Test webhook endpoint
├── user/                    # User-related endpoints
│   └── subscription/        # Get user subscription details
├── videos/                  # Video management endpoints
├── clips/                   # Clip management endpoints
├── burn-captions/           # Caption burning endpoints
└── subscription-plans/      # Subscription plan management
```

## Database Schema

Key models include:

- **User**: User account information with authentication details
- **Subscription**: User subscription details
- **SubscriptionPlan**: Available subscription plans
- **Video**: Video assets
- **Clip**: Video clip segments
- **Settings**: Application settings including Stripe configuration

## Authentication

Authentication is managed through NextAuth.js with the following providers:
- Email/Password
- OAuth providers (configured in auth.ts)

Authentication flow is enforced through middleware that checks user sessions and redirects unauthenticated users.

## Application Flows

### User Registration and Authentication
1. User accesses the application
2. Authentication is handled through NextAuth.js
3. On successful authentication, user is redirected to dashboard
4. User session is managed through NextAuth session management

### Subscription Flow
1. User selects a subscription plan at `/dashboard/pricing`
2. Frontend makes a request to `/api/stripe/checkout` with plan details
3. Backend creates a Stripe checkout session and returns the session URL
4. User is redirected to Stripe for payment
5. On successful payment, Stripe redirects to `/dashboard/subscription/success`
6. Success page verifies subscription status with `/api/user/subscription`
7. If verification fails, it attempts to repair subscription with `/api/stripe/verify-session`
8. User is redirected to `/dashboard/subscription` after confirmation

### Webhook Processing Flow
1. Stripe sends webhook events to `/api/stripe/webhook/route.ts`
2. Webhook handler verifies the signature using the webhook secret
3. Based on event type, appropriate actions are taken:
   - `checkout.session.completed`: Create/update user subscription
   - `invoice.payment_succeeded`: Extend subscription period
   - `customer.subscription.updated`: Update subscription status
   - `customer.subscription.deleted`: Mark subscription as canceled

### Video Processing Flow
1. User uploads a video through the dashboard
2. Video is processed with FFMPEG for transcoding
3. Processed video is stored and made available for editing
4. Editing operations are performed through API endpoints

## Stripe Integration

### Configuration
- Stripe credentials are stored in the database Settings table
- Configuration is loaded through `lib/stripe.ts`
- Environment variables provide fallback values

### Key Files
- `lib/stripe.ts`: Core configuration and client initialization
- `lib/stripe-helpers/subscription.ts`: Subscription management helpers
- `lib/stripe-helpers/subscription-direct.ts`: Direct database operations for subscriptions
- `app/api/stripe/webhook/route.ts`: Webhook handler for Stripe events
- `app/api/stripe/checkout/route.ts`: Create checkout sessions
- `app/api/stripe/customer-portal/route.ts`: Create customer portal sessions
- `app/api/stripe/verify-session/route.ts`: Verify and repair subscription sessions

### Subscription Verification and Repair
If a subscription is not properly recorded after payment:
1. Success page at `/dashboard/subscription/success` verifies subscription status
2. If verification fails, it attempts to repair using `/api/stripe/verify-session`
3. Repair process directly queries Stripe for session data and updates database records

## Video Processing

Video processing uses FFMPEG for:
- Transcoding
- Clip extraction
- Caption burning
- Format conversion

## Social Media Integration

The application supports publishing videos to various social media platforms:

### OAuth Authentication
- OAuth 2.0 flow with PKCE for secure authentication
- Token storage with encryption for security
- Automatic token refresh when expired

### Supported Platforms
1. **YouTube**
   - Video uploads with title, description, and tags
   - Uses YouTube Data API v3
   - Implementation in `lib/social/api-clients/youtube.ts`

2. **TikTok**
   - Video uploads with title, description, and hashtags
   - Uses TikTok API v2 for authentication and uploads
   - Implementation in `lib/social/api-clients/tiktok.ts`
   - Three-step upload process: initialize, upload binary, publish

3. **Instagram, Facebook, Twitter**
   - Placeholders for future implementation
   - Current implementation simulates success

### Key Components
- **OAuth Service**: `lib/social/oauth-service.ts` - Handles authentication flow
- **API Clients**: Platform-specific API implementations in `lib/social/api-clients/`
- **Configuration**: Platform settings in `lib/social/config.ts`
- **Authorization Routes**: `/app/api/auth/authorize/[platform]/route.ts`
- **Callback Routes**: `/app/api/auth/callback/[platform]/route.ts`
- **Publishing Route**: `/app/api/social/publish/route.ts`

### Publishing Flow
1. User selects a video and target social account
2. System verifies user owns both the video and the social account
3. Platform-specific API client handles the upload
4. Results are stored in the database for tracking

## Coding Conventions

- **File Naming**: PascalCase for components, camelCase for utilities
- **TypeScript**: Strong typing throughout the application
- **CSS**: Tailwind CSS with shadcn/ui component system
- **API Responses**: Consistent JSON structure with status codes
- **Error Handling**: Try/catch patterns with proper error responses

## Error Handling

- API routes use try/catch blocks and return proper HTTP status codes
- Client components handle errors with toast notifications
- Server-side errors are logged for debugging
- Stripe webhook errors are handled gracefully to prevent webhook failures 