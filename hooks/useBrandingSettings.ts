"use client";

import { useState, useEffect } from 'react';

export type BrandingSettings = {
  siteName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  accentColor: string;
  defaultFont: string;
};

const defaultSettings: BrandingSettings = {
  siteName: "Editur",
  logoUrl: "/branding/logo.png",
  faviconUrl: "/branding/favicon.png",
  primaryColor: "#8B5CF6",
  accentColor: "#F59E0B",
  defaultFont: "Poppins"
};

export function useBrandingSettings() {
  const [brandingSettings, setBrandingSettings] = useState<BrandingSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchBrandingSettings() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/branding');
        
        if (!response.ok) {
          throw new Error('Failed to fetch branding settings');
        }
        
        const data = await response.json();
        
        setBrandingSettings({
          siteName: data.siteName || defaultSettings.siteName,
          logoUrl: data.logoUrl || defaultSettings.logoUrl,
          faviconUrl: data.faviconUrl || defaultSettings.faviconUrl,
          primaryColor: data.primaryColor || defaultSettings.primaryColor,
          accentColor: data.accentColor || defaultSettings.accentColor,
          defaultFont: data.defaultFont || defaultSettings.defaultFont
        });
      } catch (err) {
        console.error('Error fetching branding settings:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    }

    fetchBrandingSettings();
  }, []);

  return { brandingSettings, loading, error };
} 