'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { FaYoutube, FaTiktok, FaInstagram, FaFacebook, FaTwitter, FaKey } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import HomeHeader from '@/components/HomeHeader';

interface SocialCredentials {
  clientId: string;
  clientSecret: string;
}

interface SocialCredentialsMap {
  youtube: SocialCredentials;
  tiktok: SocialCredentials;
  instagram: SocialCredentials;
  facebook: SocialCredentials;
  twitter: SocialCredentials;
}

export default function SocialSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [credentials, setCredentials] = useState<SocialCredentialsMap>({
    youtube: { clientId: '', clientSecret: '' },
    tiktok: { clientId: '', clientSecret: '' },
    instagram: { clientId: '', clientSecret: '' },
    facebook: { clientId: '', clientSecret: '' },
    twitter: { clientId: '', clientSecret: '' }
  });
  
  const fetchCredentials = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/social-credentials');
      
      if (response.ok) {
        const data = await response.json();
        setCredentials(data.socialCredentials);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load social media credentials',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching credentials:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCredentials();
  }, []);
  
  const handleInputChange = (platform: keyof SocialCredentialsMap, field: keyof SocialCredentials, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value
      }
    }));
  };
  
  const handleSave = async (platform: keyof SocialCredentialsMap) => {
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/admin/social-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platform: platform.toUpperCase(),
          clientId: credentials[platform].clientId,
          clientSecret: credentials[platform].clientSecret
        })
      });
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: `${platform.charAt(0).toUpperCase() + platform.slice(1)} credentials updated successfully`
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update credentials');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update credentials',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Platform-specific icons
  const platformIcons = {
    youtube: <FaYoutube size={24} className="text-red-600" />,
    tiktok: <FaTiktok size={24} className="text-gray-800" />,
    instagram: <FaInstagram size={24} className="text-pink-600" />,
    facebook: <FaFacebook size={24} className="text-blue-600" />,
    twitter: <FaTwitter size={24} className="text-blue-500" />
  };
  
  // URLs for developer portal registrations
  const developerPortalURLs = {
    youtube: 'https://console.cloud.google.com/apis/credentials',
    tiktok: 'https://developers.tiktok.com/doc/login-kit-web',
    instagram: 'https://developers.facebook.com/docs/instagram-basic-display-api/getting-started',
    facebook: 'https://developers.facebook.com/apps/',
    twitter: 'https://developer.twitter.com/en/portal/dashboard'
  };
  
  return (
    <>
      <HomeHeader pageName="Social Media Settings" />
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-3xl font-medium mb-2">Social Media API Credentials</h2>
          <p className="text-gray-500 mb-4">
            Configure OAuth credentials for each social media platform to enable account connections and video publishing.
          </p>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            <p className="ml-3">Loading credentials...</p>
          </div>
        ) : (
          <Tabs defaultValue="youtube" className="w-full">
            <TabsList className="grid grid-cols-5 mb-6">
              <TabsTrigger value="youtube" className="flex items-center gap-2">
                <FaYoutube /> YouTube
              </TabsTrigger>
              <TabsTrigger value="tiktok" className="flex items-center gap-2">
                <FaTiktok /> TikTok
              </TabsTrigger>
              <TabsTrigger value="instagram" className="flex items-center gap-2">
                <FaInstagram /> Instagram
              </TabsTrigger>
              <TabsTrigger value="facebook" className="flex items-center gap-2">
                <FaFacebook /> Facebook
              </TabsTrigger>
              <TabsTrigger value="twitter" className="flex items-center gap-2">
                <FaTwitter /> Twitter
              </TabsTrigger>
            </TabsList>
            
            {Object.entries(credentials).map(([platform, creds]) => (
              <TabsContent key={platform} value={platform} className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center space-x-3">
                    {platformIcons[platform as keyof SocialCredentialsMap]}
                    <div>
                      <CardTitle className="capitalize">{platform} API Credentials</CardTitle>
                      <CardDescription>
                        Configure OAuth client ID and secret for {platform}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`${platform}-client-id`}>Client ID</Label>
                      <Input 
                        id={`${platform}-client-id`} 
                        value={creds.clientId} 
                        onChange={(e) => handleInputChange(platform as keyof SocialCredentialsMap, 'clientId', e.target.value)}
                        placeholder={`Enter ${platform} client ID`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${platform}-client-secret`}>Client Secret</Label>
                      <div className="relative">
                        <Input 
                          id={`${platform}-client-secret`} 
                          type="password"
                          value={creds.clientSecret}
                          onChange={(e) => handleInputChange(platform as keyof SocialCredentialsMap, 'clientSecret', e.target.value)}
                          placeholder={creds.clientSecret === '•••••••••••••••••' ? 'Keep existing secret' : `Enter ${platform} client secret`}
                        />
                        <FaKey className="absolute right-3 top-3 text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-500">
                        {creds.clientSecret === '•••••••••••••••••' ? 
                          'Secret is stored securely. Leave blank to keep existing value.' : 
                          'Enter new client secret. This will be stored securely.'}
                      </p>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-md border border-purple-100 my-4">
                      <h4 className="text-sm font-medium text-purple-800 mb-1">Developer Portal Instructions</h4>
                      <p className="text-sm text-purple-700 mb-2">
                        To get {platform} API credentials, you need to register your application in the {platform} developer portal.
                      </p>
                      <p className="text-sm text-purple-700">
                        For the redirect URI, use: <code className="bg-white px-2 py-1 rounded">{typeof window !== 'undefined' ? `${window.location.origin}/api/auth/callback/${platform}` : `YOUR_SITE_URL/api/auth/callback/${platform}`}</code>
                      </p>
                      <a 
                        href={developerPortalURLs[platform as keyof typeof developerPortalURLs]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-purple-700 underline block mt-2"
                      >
                        Visit {platform.charAt(0).toUpperCase() + platform.slice(1)} Developer Portal
                      </a>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button onClick={() => handleSave(platform as keyof SocialCredentialsMap)} disabled={isSaving}>
                      {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Save {platform.charAt(0).toUpperCase() + platform.slice(1)} Credentials
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </>
  );
} 