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

// Default branding settings used at build time
const defaultBranding = {
  siteName: 'Reels Creator',
  faviconUrl: '/branding/favicon.png',
  primaryColor: '#8B5CF6',
  accentColor: '#F59E0B',
  defaultFont: 'Poppins'
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Always use default branding settings for build
  // This avoids any API calls during build time that cause errors
  // Logo context will handle runtime branding updates for clients
  const siteName = defaultBranding.siteName;
  const faviconUrl = defaultBranding.faviconUrl;
  
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
