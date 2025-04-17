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
    if (process.env.NEXT_PHASE === 'build') {
      console.log('Skipping branding API call during build phase');
      // Return default values directly instead of making API call
      return {
        siteName: 'Reels Creator',
        faviconUrl: '/branding/favicon.png',
        primaryColor: '#8B5CF6',
        accentColor: '#F59E0B',
        defaultFont: 'Poppins'
      };
    }
    
    // Add a cache-busting timestamp to ensure we get fresh data
    const timestamp = Date.now();
    const response = await fetch(`/api/branding?t=${timestamp}`, { 
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch branding: ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error("Error in getBrandingSettings:", error);
    return {
      siteName: 'Reels Creator',
      faviconUrl: '/branding/favicon.png'
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
