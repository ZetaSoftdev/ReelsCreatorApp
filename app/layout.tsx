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

// Add a function to fetch branding settings
async function getBrandingSettings() {
  try {
    // Skip API calls during build time to avoid ECONNREFUSED and timeouts
    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PHASE === 'build') {
      console.log('Skipping branding API call during build phase');
      // Return default values directly instead of making API call
      return {
        siteName: 'Reels Creator',
        faviconUrl: '/favicon.ico',
        primaryColor: '#8B5CF6',
        accentColor: '#F59E0B',
        defaultFont: 'Poppins'
      };
    }
    
    // Only make API calls in development when not building
    try {
      const response = await fetch('/api/branding', { 
        cache: 'force-cache'  // Use force-cache instead of no-store
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch branding: ${response.status}`);
      }
      
      return await response.json();
    } catch (fetchError) {
      console.error("Error fetching branding:", fetchError);
      // Fall back to defaults on error
      return {
        siteName: 'Reels Creator',
        faviconUrl: '/favicon.ico'
      };
    }
  } catch (error) {
    console.error("Error in getBrandingSettings:", error);
    return {
      siteName: 'Reels Creator',
      faviconUrl: '/favicon.ico'
    };
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetch branding settings
  const brandingSettings = await getBrandingSettings();
  const siteName = brandingSettings?.siteName || 'Reels Creator';
  const faviconUrl = brandingSettings?.faviconUrl || '/favicon.ico';
  
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
