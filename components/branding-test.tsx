"use client";

import { useLogoContext } from "@/context/LogoContext";
import Image from "next/image";

export default function BrandingTest() {
  const { branding } = useLogoContext();
  
  return (
    <div className="p-4 border rounded-md">
      <h2 className="text-xl font-semibold mb-4">Current Branding Settings</h2>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-500">Site Name:</p>
          <p className="font-medium">{branding.siteName}</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500">Logo:</p>
          {branding.logoUrl ? (
            <div className="mt-1">
              <Image 
                src={branding.logoUrl} 
                alt={branding.siteName || 'Logo'} 
                width={150} 
                height={40} 
                className="object-contain h-10"
              />
            </div>
          ) : (
            <p>No logo set</p>
          )}
        </div>
        
        <div>
          <p className="text-sm text-gray-500">Favicon:</p>
          {branding.faviconUrl ? (
            <div className="mt-1">
              <Image 
                src={branding.faviconUrl} 
                alt="Favicon" 
                width={32} 
                height={32} 
                className="object-contain"
              />
            </div>
          ) : (
            <p>No favicon set</p>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Primary Color:</p>
            <div className="flex items-center gap-2 mt-1">
              <div 
                className="w-6 h-6 rounded-full border" 
                style={{ backgroundColor: branding.primaryColor }}
              />
              <span>{branding.primaryColor}</span>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Accent Color:</p>
            <div className="flex items-center gap-2 mt-1">
              <div 
                className="w-6 h-6 rounded-full border" 
                style={{ backgroundColor: branding.accentColor }}
              />
              <span>{branding.accentColor}</span>
            </div>
          </div>
        </div>
        
        <div>
          <p className="text-sm text-gray-500">Default Font:</p>
          <p className="font-medium">{branding.defaultFont}</p>
        </div>
      </div>
    </div>
  );
} 