'use client';

import { useState, useEffect } from 'react';
import HomeHeader from '@/components/HomeHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { FaYoutube, FaTiktok, FaInstagram, FaFacebook, FaSave } from 'react-icons/fa';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

interface ApiCredentials {
  platform: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  additionalFields?: Record<string, string>;
}

export default function SocialApiSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [credentials, setCredentials] = useState<ApiCredentials[]>([]);

  // Fetch existing credentials on page load
  useEffect(() => {
    const initializeCredentials = () => {
      setCredentials([
        {
          platform: 'YOUTUBE',
          clientId: '',
          clientSecret: '',
          redirectUri: `${window.location.origin}/api/auth/callback/youtube`,
          additionalFields: {
            apiKey: ''
          }
        },
        {
          platform: 'TIKTOK',
          clientId: '',
          clientSecret: '',
          redirectUri: `${window.location.origin}/api/auth/callback/tiktok`
        },
        {
          platform: 'INSTAGRAM',
          clientId: '',
          clientSecret: '',
          redirectUri: `${window.location.origin}/api/auth/callback/instagram`
        },
        {
          platform: 'FACEBOOK',
          clientId: '',
          clientSecret: '',
          redirectUri: `${window.location.origin}/api/auth/callback/facebook`
        }
      ]);
      
      // Simulate fetching saved credentials
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    };

    initializeCredentials();
  }, []);

  const handleInputChange = (platform: string, field: string, value: string) => {
    setCredentials(prev => 
      prev.map(cred => 
        cred.platform === platform 
          ? field.includes('.') 
            ? {
                ...cred,
                additionalFields: {
                  ...cred.additionalFields,
                  [field.split('.')[1]]: value
                }
              }
            : { ...cred, [field]: value }
          : cred
      )
    );
  };

  const handleSave = async (platform: string) => {
    const cred = credentials.find(c => c.platform === platform);
    if (!cred) return;

    try {
      setIsSaving(true);
      
      // Here we would make an API call to save the credentials
      // For now just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Settings Saved',
        description: `${getPlatformName(platform)} API credentials updated successfully`,
      });
    } catch (error) {
      console.error('Error saving credentials:', error);
      toast({
        title: 'Error',
        description: 'Failed to save API credentials',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'YOUTUBE': return 'YouTube';
      case 'TIKTOK': return 'TikTok';
      case 'INSTAGRAM': return 'Instagram';
      case 'FACEBOOK': return 'Facebook';
      default: return platform;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'YOUTUBE': return <FaYoutube size={24} className="text-red-600" />;
      case 'TIKTOK': return <FaTiktok size={24} className="text-black" />;
      case 'INSTAGRAM': return <FaInstagram size={24} className="text-pink-600" />;
      case 'FACEBOOK': return <FaFacebook size={24} className="text-blue-600" />;
      default: return null;
    }
  };

  return (
    <>
      <HomeHeader pageName="Social API Settings" />
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-4xl font-medium mb-2">Social Media API Configuration</h2>
          <p className="text-gray-500">
            Configure API credentials for each social media platform to enable direct publishing.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center mt-20">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
            <p className="ml-3 text-gray-700">Loading settings...</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <Tabs defaultValue="YOUTUBE" className="w-full">
              <TabsList className="grid grid-cols-4 mb-8">
                {credentials.map((cred) => (
                  <TabsTrigger key={cred.platform} value={cred.platform} className="flex items-center gap-2">
                    {getPlatformIcon(cred.platform)}
                    <span>{getPlatformName(cred.platform)}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {credentials.map((cred) => (
                <TabsContent key={cred.platform} value={cred.platform}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        {getPlatformIcon(cred.platform)}
                        <span>{getPlatformName(cred.platform)} API Configuration</span>
                      </CardTitle>
                      <CardDescription>
                        Enter your {getPlatformName(cred.platform)} developer credentials to enable publishing.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor={`${cred.platform}-client-id`}>
                            {cred.platform === 'TIKTOK' ? 'Client Key' : 'Client ID / API Key'}
                          </Label>
                          <Input
                            id={`${cred.platform}-client-id`}
                            value={cred.clientId}
                            onChange={(e) => handleInputChange(cred.platform, 'clientId', e.target.value)}
                            placeholder={`Your ${getPlatformName(cred.platform)} ${cred.platform === 'TIKTOK' ? 'Client Key' : 'Client ID'}`}
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor={`${cred.platform}-client-secret`}>Client Secret</Label>
                          <Input
                            id={`${cred.platform}-client-secret`}
                            type="password"
                            value={cred.clientSecret}
                            onChange={(e) => handleInputChange(cred.platform, 'clientSecret', e.target.value)}
                            placeholder={`Your ${getPlatformName(cred.platform)} Client Secret`}
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor={`${cred.platform}-redirect-uri`}>Redirect URI</Label>
                          <Input
                            id={`${cred.platform}-redirect-uri`}
                            value={cred.redirectUri}
                            readOnly
                          />
                          <p className="text-xs text-gray-500">
                            Add this URL to your authorized redirect URIs in the developer console.
                          </p>
                        </div>

                        {/* Platform-specific fields */}
                        {cred.platform === 'YOUTUBE' && cred.additionalFields && (
                          <div className="grid gap-2">
                            <Label htmlFor={`${cred.platform}-api-key`}>API Key</Label>
                            <Input
                              id={`${cred.platform}-api-key`}
                              value={cred.additionalFields.apiKey}
                              onChange={(e) => handleInputChange(cred.platform, 'additionalFields.apiKey', e.target.value)}
                              placeholder="YouTube API Key"
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        onClick={() => handleSave(cred.platform)}
                        disabled={isSaving}
                        className="ml-auto"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <FaSave className="mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>

                  <div className="mt-8 bg-purple-50 p-6 rounded-lg border border-purple-200">
                    <h3 className="text-lg font-semibold mb-2">
                      How to obtain {getPlatformName(cred.platform)} API credentials
                    </h3>
                    
                    {cred.platform === 'YOUTUBE' && (
                      <ol className="list-decimal pl-5 space-y-2 text-gray-600">
                        <li>Go to the <a href="https://console.developers.google.com/" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">Google Developer Console</a></li>
                        <li>Create a new project</li>
                        <li>Enable the YouTube Data API v3</li>
                        <li>Create OAuth credentials (Web application type)</li>
                        <li>Add the redirect URI shown above to your authorized redirect URIs</li>
                        <li>Copy the Client ID and Client Secret to this form</li>
                        <li>Create an API key for additional functionality</li>
                      </ol>
                    )}
                    
                    {cred.platform === 'TIKTOK' && (
                      <ol className="list-decimal pl-5 space-y-2 text-gray-600">
                        <li>Go to the <a href="https://developers.tiktok.com/" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">TikTok Developer Portal</a></li>
                        <li>Create a new app and set up a Sandbox for testing</li>
                        <li>Add Login Kit and Content Posting API products</li>
                        <li>Set up the app with required scopes (user.info.basic, video.list, video.upload)</li>
                        <li>Add the redirect URI shown above to your app settings</li>
                        <li>Copy the Client Key and Client Secret to this form</li>
                        <li>Add your TikTok account as a target user in Sandbox settings</li>
                      </ol>
                    )}
                    
                    {cred.platform === 'INSTAGRAM' && (
                      <ol className="list-decimal pl-5 space-y-2 text-gray-600">
                        <li>Go to the <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">Meta for Developers</a> website</li>
                        <li>Create a new app with the Instagram API</li>
                        <li>Set up the app with appropriate permissions (instagram_basic, instagram_content_publish)</li>
                        <li>Add the redirect URI shown above to your app settings</li>
                        <li>Copy the App ID and App Secret to this form</li>
                      </ol>
                    )}
                    
                    {cred.platform === 'FACEBOOK' && (
                      <ol className="list-decimal pl-5 space-y-2 text-gray-600">
                        <li>Go to the <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">Meta for Developers</a> website</li>
                        <li>Create a new app with the Facebook API</li>
                        <li>Set up the app with appropriate permissions (pages_manage_posts, pages_read_engagement)</li>
                        <li>Add the redirect URI shown above to your app settings</li>
                        <li>Copy the App ID and App Secret to this form</li>
                      </ol>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </div>
    </>
  );
} 