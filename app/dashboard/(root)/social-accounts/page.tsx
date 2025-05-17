'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import HomeHeader from '@/components/HomeHeader';
import { FaYoutube, FaTiktok, FaInstagram, FaFacebook, FaPlus, FaTrash, FaTools } from 'react-icons/fa';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { useSession } from "next-auth/react";
import Link from 'next/link';
import { Role, ROUTES } from "@/lib/constants";

interface SocialAccount {
  id: string;
  platform: 'YOUTUBE' | 'TIKTOK' | 'INSTAGRAM' | 'FACEBOOK' | 'TWITTER';
  accountName: string;
  createdAt: string;
  updatedAt: string;
}

export default function SocialAccountsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === Role.ADMIN;
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [scopeWarning, setScopeWarning] = useState<string | null>(null);

  // Fetch connected accounts on load and check for error param
  useEffect(() => {
    // Check for error or success in URL
    const searchParams = new URLSearchParams(window.location.search);
    const error = searchParams.get('error');
    const connected = searchParams.get('connected');
    const scopeWarningParam = searchParams.get('scope_warning');
    const missingScopes = searchParams.get('missing_scopes');
    
    if (error) {
      setConnectionError(error);
      toast({
        title: 'Connection Failed',
        description: `Failed to connect: ${error}`,
        variant: 'destructive',
      });
      
      // Clear the URL query parameter
      window.history.replaceState({}, '', window.location.pathname);
    }
    
    if (connected && scopeWarningParam === 'true') {
      // Set scope warning if missing required scopes
      setScopeWarning(missingScopes || 'video.publish');
      toast({
        title: 'Account Connected with Limited Permissions',
        description: `Your ${connected} account was connected but with limited permissions. Direct publishing may not work.`,
        variant: 'destructive',
      });
      
      // Clear the URL query parameter
      window.history.replaceState({}, '', window.location.pathname);
    } else if (connected) {
      toast({
        title: 'Account Connected',
        description: `Successfully connected your ${connected} account!`,
      });
      
      // Clear the URL query parameter
      window.history.replaceState({}, '', window.location.pathname);
    }
    
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(ROUTES.API.SOCIAL.ACCOUNTS);
      
      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }
      
      const data = await response.json();
      setAccounts(data.accounts || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your social accounts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = (platform: string) => {
    // Redirect to the OAuth flow for the selected platform
    const platformUpperCase = platform.toUpperCase() as keyof typeof ROUTES.API.AUTH.AUTHORIZE;
    
    if (ROUTES.API.AUTH.AUTHORIZE[platformUpperCase]) {
      window.location.href = ROUTES.API.AUTH.AUTHORIZE[platformUpperCase];
    } else {
      console.error(`No OAuth route defined for ${platform}`);
      toast({
        title: 'Error',
        description: `OAuth flow not configured for ${platform}`,
        variant: 'destructive',
      });
    }
  };
  
  // Keep the simulateAddAccount for platforms not yet fully implemented
  const simulateAddAccount = async (platform: string) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/social/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          accountName: `demo_user_${platform.toLowerCase()}`,
          accessToken: 'simulated_token_' + Date.now(),
          refreshToken: 'simulated_refresh_' + Date.now(),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add account');
      }
      
      toast({
        title: 'Success',
        description: `${platform} account connected successfully`,
      });
      
      // Refresh the accounts list
      fetchAccounts();
    } catch (error) {
      console.error('Error adding account:', error);
      toast({
        title: 'Error',
        description: 'Failed to connect account',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/social/accounts?id=${accountId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to disconnect account');
      }
      
      // Refresh accounts list
      fetchAccounts();
      
      toast({
        title: 'Account Disconnected',
        description: 'Your social account has been disconnected successfully',
      });
    } catch (error) {
      console.error('Error disconnecting account:', error);
      toast({
        title: 'Error',
        description: 'Failed to disconnect account',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'YOUTUBE':
        return <FaYoutube size={24} className="text-red-600" />;
      case 'TIKTOK':
        return <FaTiktok size={24} className="text-black" />;
      case 'INSTAGRAM':
        return <FaInstagram size={24} className="text-pink-600" />;
      case 'FACEBOOK':
        return <FaFacebook size={24} className="text-blue-600" />;
      default:
        return null;
    }
  };

  const platformCards = [
    { platform: 'YOUTUBE', title: 'YouTube', description: 'Connect your YouTube channel to publish shorts' },
    { platform: 'TIKTOK', title: 'TikTok', description: 'Connect your TikTok account to publish videos' },
    { platform: 'INSTAGRAM', title: 'Instagram', description: 'Connect your Instagram account to publish reels' },
    { platform: 'FACEBOOK', title: 'Facebook', description: 'Connect your Facebook page to publish videos' }
  ];

  return (
    <>
      <HomeHeader pageName="Social Accounts" />
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-4xl font-medium mb-2">Connect Your Social Accounts</h2>
            <p className="text-gray-500">Connect your social media accounts to publish videos directly from the platform.</p>
          </div>
          
          {isAdmin && (
            <Link href={ROUTES.SOCIAL_SETTINGS}>
              <Button variant="outline" className="flex items-center gap-2">
                <FaTools className="w-4 h-4" />
                Configure OAuth Settings
              </Button>
            </Link>
          )}
        </div>
          
        {connectionError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 mb-6">
            <p className="font-medium">Connection Error</p>
            <p className="text-sm">There was an issue connecting your social account: {connectionError}</p>
            <p className="text-sm mt-1">Please make sure OAuth credentials are properly configured.</p>
          </div>
        )}

        {scopeWarning && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-700 mb-6">
            <p className="font-medium">Limited TikTok Permissions</p>
            <p className="text-sm">
              Your TikTok account was connected but the following required permissions were not granted: 
              <span className="font-mono bg-amber-100 px-1 mx-1 rounded">{scopeWarning}</span>
            </p>
            <p className="text-sm mt-2">
              <strong>Direct publishing will not work</strong>. Please disconnect and reconnect your account, 
              making sure to accept <strong>all requested permissions</strong> on the TikTok authorization screen.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 border-amber-300 hover:bg-amber-100"
              onClick={() => {
                const tiktokAccount = accounts.find(a => a.platform === 'TIKTOK');
                if (tiktokAccount) {
                  handleDisconnect(tiktokAccount.id);
                  setTimeout(() => {
                    handleConnect('TIKTOK');
                  }, 1000);
                } else {
                  handleConnect('TIKTOK');
                }
              }}
            >
              Reconnect TikTok with Full Permissions
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center mt-20">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
            <p className="ml-3 text-gray-700">Loading accounts...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {platformCards.map((platform) => {
              const connectedAccount = accounts.find(a => a.platform === platform.platform);
              
              return (
                <Card key={platform.platform} className="overflow-hidden">
                  <CardHeader className="flex flex-row items-center gap-3">
                    {getPlatformIcon(platform.platform)}
                    <div>
                      <CardTitle>{platform.title}</CardTitle>
                      {connectedAccount && (
                        <CardDescription className="text-sm text-green-600 font-medium">
                          Connected
                        </CardDescription>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">{platform.description}</p>
                    
                    {connectedAccount && (
                      <div className="mt-4 p-2 bg-gray-50 rounded-md">
                        <p className="text-sm font-medium text-gray-800">{connectedAccount.accountName}</p>
                        <p className="text-xs text-gray-500">
                          Connected on {new Date(connectedAccount.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    {connectedAccount ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">
                            <FaTrash size={16} className="mr-2" />
                            Disconnect
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Disconnect {platform.title} Account?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove access to your {platform.title} account. Any scheduled posts for this account will fail to publish.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDisconnect(connectedAccount.id)}>
                              Disconnect
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <Button onClick={() => handleConnect(platform.platform)} className="w-full">
                        <FaPlus size={16} className="mr-2" />
                        Connect
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
        
        <div className="mt-10 bg-purple-50 p-6 rounded-lg border border-purple-200">
          <h3 className="text-lg font-semibold mb-2">Social Media Integration</h3>
          <p className="text-gray-600 mb-4">
            This application integrates with social media platforms using OAuth 2.0 authentication.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-gray-600">
            <li>YouTube integration is fully implemented with real OAuth flow and video upload capability</li>
            <li>Authentication uses secure token storage with encryption</li>
            <li>Token refresh is handled automatically when access tokens expire</li>
            <li>Additional platforms (TikTok, Instagram, Facebook) can be implemented using the same framework</li>
          </ul>
        </div>
      </div>
    </>
  );
} 