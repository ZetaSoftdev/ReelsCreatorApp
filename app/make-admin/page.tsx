"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

export default function MakeAdminPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleMakeAdmin = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/make-me-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update role');
      }

      setSuccess(`${data.message || 'Role updated'}. Please wait while we refresh your session...`);
      
      // Sign out and redirect to force a session refresh
      setTimeout(() => {
        signOut({ redirect: false }).then(() => {
          // Force a manual redirect to the login page
          window.location.href = '/login?callbackUrl=/admin/settings&message=Please+login+again+to+use+your+new+admin+privileges';
        });
      }, 2000);
    } catch (error) {
      setError((error as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="container py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-[#343434]">Become Admin</CardTitle>
          <CardDescription>Update your account to have admin privileges</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-gray-600">
            Click the button below to update your account to have administrator privileges.
            This will allow you to access admin features like branding settings.
          </p>
          
          <div className="mb-4 text-gray-600">
            <p><strong>Note:</strong> After becoming an admin, you'll need to log out and log back in 
            for the changes to take effect in your session. We'll automatically redirect you.</p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-600">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2 text-green-600">
              <CheckCircle size={16} />
              <span>{success}</span>
            </div>
          )}
          
          <Button 
            onClick={handleMakeAdmin}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {loading ? 'Updating...' : 'Make Me Admin'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 