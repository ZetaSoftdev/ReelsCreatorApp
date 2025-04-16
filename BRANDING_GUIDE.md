# Dynamic Branding System Guide

This document explains how to use and update the dynamic branding system that has been implemented across the application.

## Overview

The application now uses a dynamic branding system that fetches branding settings (site name, logo, colors, etc.) from an API and applies them consistently across all pages. This allows for easy rebranding without changing code files.

## Components Updated

The following components and pages have been updated to use the dynamic branding system:

1. **Core UI Components**:
   - `components/Navbar.tsx`
   - `components/Hero.tsx`
   - `components/Footer.tsx`
   - `components/app-sidebar.tsx`

2. **App/(root) Pages**:
   - `app/(root)/login/page.tsx`
   - `app/(root)/sign-up/page.tsx`
   - `app/(root)/pricing/page.tsx`
   - `app/(root)/features/page.tsx`
   - `app/(root)/guides/page.tsx`

## How It Works

1. The branding settings are stored in `data/branding-settings.json` and exposed via an API endpoint.
2. The app fetches these settings through `context/LogoContext.tsx` which provides a context for all components.
3. The `useLogoContext()` hook is used in components to access branding information.

## Default Branding Values

If the API fails to load, the system falls back to these defaults:

```js
{
  siteName: 'Reels Creator',
  logoUrl: '/logo.png',
  faviconUrl: '/favicon.ico',
  primaryColor: "#8B5CF6",
  accentColor: "#F59E0B",
  defaultFont: "Poppins"
}
```

## How to Update Branding

### Method 1: Using the Admin Interface

1. Navigate to `/admin/settings`
2. Use the Branding tab to update site name, logo, favicon, and colors
3. Changes will apply immediately after saving

### Method 2: Directly Editing JSON (Development Only)

For development or quick changes, you can edit the `data/branding-settings.json` file directly:

```json
{
  "siteName": "Your Brand Name",
  "primaryColor": "#8B5CF6",
  "accentColor": "#F59E0B",
  "defaultFont": "Poppins",
  "logoUrl": "/your-logo.png",
  "logoPath": "C:\\path\\to\\public\\branding\\your-logo.png",
  "faviconUrl": "/your-favicon.ico",
  "faviconPath": "C:\\path\\to\\public\\branding\\your-favicon.ico"
}
```

## Implementation Notes

- The branding context is initialized in `LogoProvider` which wraps the application in `app/layout.tsx`
- Server-side rendering fetches initial branding in `app/layout.tsx` for SEO purposes
- Client-side updates happen through the `LogoContext` to enable real-time updates

## Adding to New Components

To add dynamic branding to a new component:

1. Import the context:
   ```jsx
   import { useLogoContext } from "@/context/LogoContext";
   ```

2. Use the hook inside your component:
   ```jsx
   const { branding } = useLogoContext();
   ```

3. Reference branding properties:
   ```jsx
   <h1>{branding.siteName}</h1>
   <div style={{ color: branding.primaryColor }}>...</div>
   <Image src={branding.logoUrl} alt={branding.siteName} />
   ```

## Testing Changes

After changing branding settings, test across multiple device sizes and pages to ensure consistency. 