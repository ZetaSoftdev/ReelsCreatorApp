"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { CreditCard } from "lucide-react";

interface HeadingProps {
  title: string;
  description: string;
  icon?: string;
}

// Create simple heading component inline
const Heading = ({ title, description, icon = "none" }: HeadingProps) => {
  return (
    <div className="flex items-center gap-x-3">
      {icon === "credit-card" && (
        <div className="p-2 w-fit rounded-md bg-primary/10">
          <CreditCard className="w-8 h-8 text-primary" />
        </div>
      )}
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};

interface LoaderProps {
  className?: string;
}

// Create simple loader component inline
const Loader = ({ className = "" }: LoaderProps) => {
  return (
    <div className={`animate-spin rounded-full border-4 border-primary border-t-transparent ${className}`} />
  );
};

interface StripeStatus {
  databaseCredentials: {
    publishableKeyExists: boolean;
    secretKeyExists: boolean;
    webhookSecretExists: boolean;
    liveMode: boolean;
  };
  activeCredentials: {
    publishableKeyExists: boolean;
    secretKeyExists: boolean;
    webhookSecretExists: boolean;
    liveMode: boolean;
  };
  environmentVariables: {
    publishableKeyExists: boolean;
    secretKeyExists: boolean;
    webhookSecretExists: boolean;
  };
}

export default function StripeStatusPage() {
  const [status, setStatus] = useState<StripeStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStripeStatus = async () => {
    try {
      const isRefresh = !isLoading;
      if (isRefresh) setIsRefreshing(true);

      const response = await fetch('/api/admin/stripe/status');
      if (!response.ok) {
        throw new Error('Failed to fetch Stripe status');
      }

      const data = await response.json();
      setStatus(data.status);
    } catch (error) {
      console.error('Error fetching Stripe status:', error);
      toast({
        title: "Error",
        description: "Failed to load Stripe configuration status",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStripeStatus();
  }, []);

  const refreshStatus = () => {
    fetchStripeStatus();
  };

  const StatusIndicator = ({ exists }: { exists: boolean }) => (
    <div className={`w-3 h-3 rounded-full ${exists ? 'bg-green-500' : 'bg-red-500'}`}></div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <Heading
          title="Stripe Configuration Status"
          description="View and validate your Stripe configuration"
          icon="credit-card"
        />
        <Button 
          onClick={refreshStatus}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <>
              <Loader className="mr-2 h-4 w-4" />
              Refreshing...
            </>
          ) : (
            'Refresh Status'
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="h-8 w-8" />
        </div>
      ) : status ? (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Stripe Configuration Summary</CardTitle>
              <CardDescription>
                Overview of your Stripe configuration status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Database Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Publishable Key</span>
                          <StatusIndicator exists={status.databaseCredentials.publishableKeyExists} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Secret Key</span>
                          <StatusIndicator exists={status.databaseCredentials.secretKeyExists} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Webhook Secret</span>
                          <StatusIndicator exists={status.databaseCredentials.webhookSecretExists} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Live Mode</span>
                          <span>{status.databaseCredentials.liveMode ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Active Configuration</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Publishable Key</span>
                          <StatusIndicator exists={status.activeCredentials.publishableKeyExists} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Secret Key</span>
                          <StatusIndicator exists={status.activeCredentials.secretKeyExists} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Webhook Secret</span>
                          <StatusIndicator exists={status.activeCredentials.webhookSecretExists} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Live Mode</span>
                          <span>{status.activeCredentials.liveMode ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Environment Variables</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">STRIPE_PUBLISHABLE_KEY</span>
                          <StatusIndicator exists={status.environmentVariables.publishableKeyExists} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">STRIPE_SECRET_KEY</span>
                          <StatusIndicator exists={status.environmentVariables.secretKeyExists} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">STRIPE_WEBHOOK_SECRET</span>
                          <StatusIndicator exists={status.environmentVariables.webhookSecretExists} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Configuration Tips</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 space-y-2 text-sm">
                        <li>
                          Database settings take precedence over environment variables when both are present.
                        </li>
                        <li>
                          After changing settings in the admin panel, the application needs to reload to use the new credentials.
                        </li>
                        <li>
                          Make sure your webhook URL is configured in the Stripe dashboard to point to <code className="bg-muted px-1 rounded">/api/stripe/webhook</code>.
                        </li>
                        <li>
                          In test mode, use Stripe test keys that start with <code className="bg-muted px-1 rounded">pk_test_</code> and <code className="bg-muted px-1 rounded">sk_test_</code>.
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-muted-foreground mt-4">
            <p>
              Need to update your Stripe settings? Go to <a href="/admin/settings" className="text-primary hover:underline">Settings</a> and select the Stripe tab.
            </p>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <p>Failed to load Stripe configuration status</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 