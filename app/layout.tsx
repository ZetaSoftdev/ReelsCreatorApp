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
  title: "Reels Creator",
  description: "Video editing web application",
};

// Default branding settings used during build
const defaultBranding = {
  siteName: 'Reels Creator',
  faviconUrl: '/branding/favicon.png',
  primaryColor: '#8B5CF6',
  accentColor: '#F59E0B',
  defaultFont: 'Poppins'
};

// Add a function to fetch branding settings
async function getBrandingSettings() {
  // During build time, always return default values without fetching
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'build') {
    return defaultBranding;
  }
  
  try {
    // For runtime/client-side, only run in browser environment
    if (typeof window === 'undefined') {
      return defaultBranding;
    }
    
    // Get the origin for the absolute URL
    const origin = window.location.origin;
    const url = `${origin}/api/branding`;
    
    const response = await fetch(url, { 
      cache: 'force-cache',
      next: { revalidate: 60 } // Revalidate every minute
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch branding: ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error("Error in getBrandingSettings:", error);
    return defaultBranding;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // In build/SSG context, use default branding
  const brandingSettings = process.env.NEXT_PHASE === 'build' 
    ? defaultBranding 
    : await getBrandingSettings();
  
  const siteName = brandingSettings?.siteName || defaultBranding.siteName;
  const faviconUrl = brandingSettings?.faviconUrl || defaultBranding.faviconUrl;
  
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
