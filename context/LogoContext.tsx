"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type BrandingSettings = {
  siteName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  accentColor: string;
  defaultFont: string;
};

type LogoContextType = {
  branding: BrandingSettings;
  updateLogo: (url: string) => void;
  updateBranding: (settings: Partial<BrandingSettings>) => void;
  refreshBranding: () => Promise<void>;
};

const defaultBranding: BrandingSettings = {
  siteName: 'Editur',
  logoUrl: '/branding/logo.png',
  faviconUrl: '/branding/favicon.png',
  primaryColor: "#8B5CF6",
  accentColor: "#F59E0B",
  defaultFont: "Poppins"
};

const defaultLogoContext: LogoContextType = {
  branding: defaultBranding,
  updateLogo: () => {},
  updateBranding: () => {},
  refreshBranding: async () => {},
};

const LogoContext = createContext<LogoContextType>(defaultLogoContext);

export const useLogoContext = () => useContext(LogoContext);

export function LogoProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<BrandingSettings>(defaultBranding);

  // Create a function to fetch branding settings
  const fetchBrandingSettings = async () => {
    try {
      console.log('LogoContext: Fetching branding settings');
      
      // Add a cache-busting parameter to ensure fresh data
      const timestamp = Date.now();
      
      const response = await fetch(`/api/branding?t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        next: { revalidate: 3600 }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('LogoContext: Received branding data:', data);
        setBranding({
          siteName: data.siteName || defaultBranding.siteName,
          logoUrl: data.logoUrl || defaultBranding.logoUrl,
          faviconUrl: data.faviconUrl || defaultBranding.faviconUrl,
          primaryColor: data.primaryColor || defaultBranding.primaryColor,
          accentColor: data.accentColor || defaultBranding.accentColor,
          defaultFont: data.defaultFont || defaultBranding.defaultFont,
        });
      } else {
        console.error('LogoContext: Failed to fetch branding settings:', response.status, response.statusText);
        // Fallback to localStorage
        const savedLogo = localStorage.getItem('app_logo');
        if (savedLogo) {
          setBranding(prev => ({ ...prev, logoUrl: savedLogo }));
        }
      }
    } catch (error) {
      console.error('LogoContext: Error fetching branding settings:', error);
      // Fallback to localStorage
      const savedLogo = localStorage.getItem('app_logo');
      if (savedLogo) {
        setBranding(prev => ({ ...prev, logoUrl: savedLogo }));
      }
    }
  };

  // Fetch branding settings when component mounts
  useEffect(() => {
    fetchBrandingSettings();
    
    // Add an event listener to refresh branding on window focus
    // This helps ensure branding is updated when user returns to the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('LogoContext: Document visible, refreshing branding');
        fetchBrandingSettings();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up event listener on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const updateLogo = (url: string) => {
    setBranding(prev => ({ ...prev, logoUrl: url }));
    // Legacy support
    localStorage.setItem('app_logo', url);
  };

  const updateBranding = (settings: Partial<BrandingSettings>) => {
    setBranding(prev => ({ ...prev, ...settings }));
  };
  
  // Function to refresh branding data from the API
  const refreshBranding = async () => {
    await fetchBrandingSettings();
  };

  return (
    <LogoContext.Provider value={{ branding, updateLogo, updateBranding, refreshBranding }}>
      {children}
    </LogoContext.Provider>
  );
} 