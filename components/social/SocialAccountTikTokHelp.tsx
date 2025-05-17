import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { FaTiktok } from 'react-icons/fa';
import Link from 'next/link';

export default function SocialAccountTikTokHelp() {
  return (
    <Card className="w-full mb-6">
      <CardHeader className="bg-amber-50">
        <div className="flex items-center gap-2">
          <FaTiktok className="h-5 w-5" />
          <CardTitle>TikTok Permission Issue</CardTitle>
        </div>
        <CardDescription className="text-amber-800">
          Your TikTok account is missing required permissions for direct publishing
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <Alert variant="warning" className="bg-amber-50 border-amber-200 text-amber-800">
          <AlertTitle className="text-amber-800">Why am I seeing this?</AlertTitle>
          <AlertDescription className="mt-2">
            TikTok allows users to selectively grant permissions during authorization.
            For direct publishing to work, your account must have the <code className="bg-amber-100 px-1 rounded">video.publish</code> permission.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-2">
          <h4 className="font-medium">How to fix this:</h4>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Disconnect your current TikTok account</li>
            <li>Reconnect with TikTok using the button below</li>
            <li><strong>Important:</strong> When prompted by TikTok, ensure you check/allow <strong>ALL</strong> requested permissions</li>
          </ol>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <img 
            src="/images/tiktok-permissions.png" 
            alt="TikTok permissions screen" 
            className="border rounded-md w-full max-w-[250px] mx-auto"
          />
          <div className="flex flex-col justify-center">
            <p className="text-sm mb-2">On the TikTok permissions screen, make sure to accept:</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>View your public profile</li>
              <li>Publish videos to TikTok</li>
              <li>Upload videos to TikTok</li>
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 bg-gray-50">
        <Link href="/dashboard/social-accounts">
          <Button variant="outline">Go to Accounts Page</Button>
        </Link>
        <Button variant="default">Reconnect TikTok</Button>
      </CardFooter>
    </Card>
  );
} 