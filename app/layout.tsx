import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/toaster";
import { LogoProvider } from "@/context/LogoContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Editur",
  description: "Video editing web application",
};

// Default branding settings to use during build or when API call fails
const defaultBrandingSettings = {
  siteName: 'Editur',
  faviconUrl: '/branding/favicon.png',
  logoUrl: '/trod.png',
  primaryColor: '#8B5CF6',
  accentColor: '#F59E0B',
  defaultFont: 'Poppins'
};

// Add a function to fetch branding settings
async function getBrandingSettings() {
  try {
    // More robust build-time detection
    const isBuildTime = process.env.NODE_ENV === 'production' && typeof window === 'undefined' && process.env.NEXT_PHASE === 'build';
    
    // Skip API calls during build time to avoid ECONNREFUSED and timeouts
    if (isBuildTime) {
      console.log('Skipping branding API call during build phase');
      // Return default values directly instead of making API call
      return defaultBrandingSettings;
    }
    
    // Only attempt API call in a try/catch with short timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    try {
      // Create a proper absolute URL for the API endpoint
      const apiUrl = new URL(
        `/api/branding`,
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      ).toString();
      
      const response = await fetch(apiUrl, { 
        next: { revalidate: 3600 }, // Revalidate every hour
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch branding: ${response.status}`);
      }
      
      return await response.json();
    } catch (fetchError: any) {
      console.log('Error fetching branding, using defaults:', fetchError.message);
      return defaultBrandingSettings;
    }
  } catch (error) {
    console.error("Error in getBrandingSettings:", error);
    return defaultBrandingSettings;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetch branding settings
  const brandingSettings = await getBrandingSettings();
  const siteName = brandingSettings?.siteName || defaultBrandingSettings.siteName;
  const faviconUrl = brandingSettings?.faviconUrl || defaultBrandingSettings.faviconUrl;
  
  return (
    <html lang="en">
      <head>
        <link rel="icon" href={faviconUrl} />
        <title>{siteName}</title>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <LogoProvider>
            {children}
            <Toaster />
          </LogoProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
