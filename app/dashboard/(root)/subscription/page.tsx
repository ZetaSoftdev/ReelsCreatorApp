'use client';

import { useState, useEffect, Suspense } from 'react';
import HomeHeader from '@/components/HomeHeader';
import { toast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  CreditCard, 
  Clock, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  ArrowUpCircle, 
  FileText, 
  Shield, 
  Video, 
  Loader,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  minutesAllowed: number;
  maxFileSize: number;
  maxConcurrentRequests: number;
  storageDuration: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserSubscription {
  id: string;
  plan: string;
  status: string;
  startDate: string;
  endDate: string | null;
  minutesAllowed: number;
  minutesUsed: number;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionPlan: SubscriptionPlan | null;
}

interface UserSubscriptionData {
  hasSubscription: boolean;
  isSubscribed: boolean;
  subscription: UserSubscription | null;
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  return format(new Date(dateString), 'PPP');
};

const formatPercentage = (used: number, total: number) => {
  const percentage = Math.round((used / total) * 100);
  return percentage > 100 ? 100 : percentage;
};

// Main component wrapped with Suspense
export default function SubscriptionPage() {
  return (
    <>
      <HomeHeader pageName="Subscription Management" />
      <main className="p-6 md:p-10 w-full">
        <Suspense fallback={
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <Loader className="h-8 w-8 animate-spin text-purple-600" />
              <span className="ml-2">Loading subscription information...</span>
            </div>
          </div>
        }>
          <SubscriptionContent />
        </Suspense>
      </main>
    </>
  );
}

// Content component that uses searchParams
function SubscriptionContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [userSubscription, setUserSubscription] = useState<UserSubscriptionData | null>(null);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const searchParams = useSearchParams();

  // Check if user is returning from Stripe portal
  useEffect(() => {
    const portalAction = searchParams.get('portal_action');
    
    if (portalAction === 'returned') {
      toast({
        title: "Subscription Updated",
        description: "Your subscription changes have been processed.",
        variant: "default",
      });
    }
  }, [searchParams]);

  // Fetch user's subscription information
  useEffect(() => {
    const fetchUserSubscription = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching user subscription data...");
        
        const response = await fetch('/api/user/subscription');
        
        if (!response.ok) {
          console.error('Failed to fetch user subscription:', response.status);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load subscription data"
          });
          return;
        }
        
        const data = await response.json();
        console.log("Subscription data received:", data.hasSubscription ? "User has subscription" : "No subscription");
        setUserSubscription(data);
      } catch (error) {
        console.error('Error fetching user subscription:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load subscription data"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserSubscription();
  }, [searchParams]); // Re-fetch when returning from Stripe portal

  // Handle managing subscription via Stripe Customer Portal
  const handleManageSubscription = async () => {
    try {
      setIsManagingSubscription(true);
      console.log("Opening Stripe customer portal...");
      
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Failed to create customer portal session:', data.error);
        throw new Error(data.error || 'Failed to create customer portal session');
      }

      if (!data.url) {
        console.error('No URL returned from customer portal API');
        throw new Error('No redirect URL returned from subscription service');
      }
      
      console.log("Redirecting to Stripe portal...");
      toast({
        title: "Redirecting",
        description: "Opening subscription management portal...",
        variant: "default",
      });
      
      // Short delay to allow toast to show
      setTimeout(() => {
        window.location.href = data.url;
      }, 1000);
      
    } catch (error: any) {
      console.error('Error accessing customer portal:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to access subscription management"
      });
      setIsManagingSubscription(false);
    }
  };
  
  // Handle subscription cancellation specifically
  const handleCancelSubscription = async () => {
    // Show the custom cancel dialog instead of using confirm()
    setShowCancelDialog(true);
  };
  
  // Execute the cancellation after confirmation
  const executeCancellation = async () => {
    setShowCancelDialog(false);
    
    try {
      setIsManagingSubscription(true);
      console.log("Preparing to cancel subscription...");
      
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Failed to create customer portal session:', data.error);
        throw new Error(data.error || 'Failed to create customer portal session');
      }

      if (!data.url) {
        console.error('No URL returned from customer portal API');
        throw new Error('No redirect URL returned from subscription service');
      }
      
      console.log("Redirecting to Stripe portal for cancellation...");
      toast({
        title: "Cancellation Process",
        description: "Redirecting to subscription cancellation portal...",
        variant: "default",
      });
      
      // Short delay to allow toast to show
      setTimeout(() => {
        window.location.href = data.url;
      }, 1000);
      
    } catch (error: any) {
      console.error('Error accessing customer portal for cancellation:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to access subscription management"
      });
      setIsManagingSubscription(false);
    }
  };

  const hasActiveSubscription = userSubscription?.hasSubscription && 
    ['active', 'active-canceling', 'trialing'].includes(userSubscription?.subscription?.status || '');

  // Helper function to render status badge
  const renderSubscriptionStatus = (status: string | undefined) => {
    if (!status) return null;
    
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center">
            <CheckCircle className="h-3 w-3 text-green-600 mr-1" /> Active
          </span>
        );
      case 'active-canceling':
        return (
          <span className="flex items-center">
            <Clock className="h-3 w-3 text-orange-500 mr-1" /> Canceling at period end
          </span>
        );
      case 'canceled':
        return (
          <span className="flex items-center">
            <XCircle className="h-3 w-3 text-red-600 mr-1" /> Canceled
          </span>
        );
      case 'trialing':
        return (
          <span className="flex items-center">
            <CheckCircle className="h-3 w-3 text-blue-600 mr-1" /> Trial
          </span>
        );
      default:
        return (
          <span className="flex items-center">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : !hasActiveSubscription ? (
        <div className="space-y-6">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl">No Active Subscription</CardTitle>
              <CardDescription>
                You don't have an active subscription. Upgrade to access premium features.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <p>You're currently on the free plan</p>
              </div>
              <div className="flex items-center space-x-2">
                <Video className="h-5 w-5 text-[#343434]" />
                <p>Limited to one free video</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="bg-purple-600 hover:bg-purple-700">
                <Link href="/dashboard/pricing">
                  View Pricing Plans
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="border-none shadow-md bg-white">
            <CardHeader className="bg-[#343434] text-white rounded-t-lg">
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl">Your Subscription</CardTitle>
                <Button
                  onClick={handleManageSubscription}
                  disabled={isManagingSubscription}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isManagingSubscription ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Please wait
                    </>
                  ) : (
                    <>Manage Subscription</>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full mb-6">
                  <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                  <TabsTrigger value="usage" className="flex-1">Usage</TabsTrigger>
                  <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Plan Info */}
                    <div className="bg-[#f8f8f8] p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-[#343434] mb-3">Current Plan</h3>
                      <div className="flex items-start space-x-3">
                        <CreditCard className="h-5 w-5 text-purple-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-[#343434]">{userSubscription.subscription?.plan}</p>
                          <p className="text-sm text-[#606060]">
                            {renderSubscriptionStatus(userSubscription.subscription?.status)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Usage Info */}
                    <div className="bg-[#f8f8f8] p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-[#343434] mb-3">Usage</h3>
                      <div className="flex items-start space-x-3">
                        <Clock className="h-5 w-5 text-purple-600 mt-0.5" />
                        <div className="w-full">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-[#343434]">
                              {userSubscription.subscription?.minutesUsed} of {userSubscription.subscription?.minutesAllowed} minutes
                            </p>
                            <p className="text-sm text-[#606060]">
                              {formatPercentage(
                                userSubscription.subscription?.minutesUsed || 0, 
                                userSubscription.subscription?.minutesAllowed || 1
                              )}%
                            </p>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className={`h-2 rounded-full ${
                                formatPercentage(
                                  userSubscription.subscription?.minutesUsed || 0, 
                                  userSubscription.subscription?.minutesAllowed || 1
                                ) > 90 ? 'bg-red-600' : 'bg-purple-600'
                              }`} 
                              style={{ 
                                width: `${formatPercentage(
                                  userSubscription.subscription?.minutesUsed || 0, 
                                  userSubscription.subscription?.minutesAllowed || 1
                                )}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Renewal Info */}
                    <div className="bg-[#f8f8f8] p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-[#343434] mb-3">Renewal</h3>
                      <div className="flex items-start space-x-3">
                        <Calendar className="h-5 w-5 text-purple-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-[#343434]">
                            {userSubscription.subscription?.endDate ? formatDate(userSubscription.subscription.endDate) : 'No end date'}
                          </p>
                          {userSubscription.subscription?.endDate && (
                            <p className="text-sm text-[#606060]">
                              Renews in {formatDistanceToNow(new Date(userSubscription.subscription.endDate))}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <div className="flex justify-between items-center mb-4">
                      {userSubscription.subscription?.status === 'active' && (
                        <Button 
                          onClick={handleCancelSubscription}
                          variant="outline" 
                          className="border-red-600 text-red-600 hover:bg-red-50"
                          disabled={isManagingSubscription}
                        >
                          {isManagingSubscription ? (
                            <>
                              <Loader className="mr-2 h-4 w-4 animate-spin" />
                              Please wait
                            </>
                          ) : (
                            <>Cancel Subscription</>
                          )}
                        </Button>
                      )}
                      
                      {userSubscription.subscription?.status === 'active-canceling' && (
                        <div className="flex items-center text-orange-600">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>Your subscription will be canceled at the end of your billing period.</span>
                        </div>
                      )}
                      
                      {userSubscription.subscription?.status === 'canceled' && (
                        <Button asChild className="bg-purple-600 hover:bg-purple-700">
                          <Link href="/dashboard/pricing">
                            Subscribe Again
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="usage">
                  <div className="space-y-6">
                    <div className="bg-[#f8f8f8] p-6 rounded-lg">
                      <h3 className="text-lg font-medium mb-4">Minutes Usage</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span>Total Minutes Allowed</span>
                          <span className="font-medium">{userSubscription.subscription?.minutesAllowed} minutes</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Minutes Used</span>
                          <span className="font-medium">{userSubscription.subscription?.minutesUsed} minutes</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Minutes Remaining</span>
                          <span className="font-medium">
                            {Math.max(0, (userSubscription.subscription?.minutesAllowed || 0) - (userSubscription.subscription?.minutesUsed || 0))} minutes
                          </span>
                        </div>
                        <div className="mt-4">
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div 
                              className={`h-4 rounded-full ${
                                formatPercentage(
                                  userSubscription.subscription?.minutesUsed || 0, 
                                  userSubscription.subscription?.minutesAllowed || 1
                                ) > 90 ? 'bg-red-600' : 'bg-purple-600'
                              }`} 
                              style={{ 
                                width: `${formatPercentage(
                                  userSubscription.subscription?.minutesUsed || 0, 
                                  userSubscription.subscription?.minutesAllowed || 1
                                )}%` 
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-sm mt-1">
                            <span>0%</span>
                            <span>
                              {formatPercentage(
                                userSubscription.subscription?.minutesUsed || 0, 
                                userSubscription.subscription?.minutesAllowed || 1
                              )}% used
                            </span>
                            <span>100%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <Button asChild className="bg-purple-600 hover:bg-purple-700">
                        <Link href="/dashboard/pricing">
                          Upgrade Plan
                        </Link>
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="details">
                  <div className="bg-[#f8f8f8] p-6 rounded-lg space-y-4">
                    <div className="flex justify-between">
                      <h3 className="text-sm font-medium">Plan Name</h3>
                      <span>{userSubscription.subscription?.plan}</span>
                    </div>
                    <div className="flex justify-between">
                      <h3 className="text-sm font-medium">Status</h3>
                      <span className="flex items-center">
                        {renderSubscriptionStatus(userSubscription.subscription?.status)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <h3 className="text-sm font-medium">Start Date</h3>
                      <span>{formatDate(userSubscription.subscription?.startDate || null)}</span>
                    </div>
                    <div className="flex justify-between">
                      <h3 className="text-sm font-medium">Renewal Date</h3>
                      <span>{formatDate(userSubscription.subscription?.endDate || null)}</span>
                    </div>
                    {userSubscription.subscription?.subscriptionPlan && (
                      <>
                        <div className="flex justify-between">
                          <h3 className="text-sm font-medium">Price</h3>
                          <span>${userSubscription.subscription.subscriptionPlan.monthlyPrice}/month</span>
                        </div>
                        <div className="flex justify-between">
                          <h3 className="text-sm font-medium">Max File Size</h3>
                          <span>{userSubscription.subscription.subscriptionPlan.maxFileSize} MB</span>
                        </div>
                        <div className="flex justify-between">
                          <h3 className="text-sm font-medium">Storage Duration</h3>
                          <span>{userSubscription.subscription.subscriptionPlan.storageDuration} days</span>
                        </div>
                      </>
                    )}
                    {userSubscription.subscription?.stripeSubscriptionId && (
                      <div className="flex justify-between">
                        <h3 className="text-sm font-medium">Subscription ID</h3>
                        <span className="font-mono text-xs">{userSubscription.subscription.stripeSubscriptionId}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4">Need Help?</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Link 
                        href="/dashboard/support"
                        className="p-4 border rounded-lg flex items-center hover:bg-gray-50 transition"
                      >
                        <div className="mr-3 bg-purple-100 p-2 rounded-full">
                          <FileText className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Contact Support</h4>
                          <p className="text-sm text-gray-500">Get help with your subscription</p>
                        </div>
                      </Link>
                      <Link 
                        href="/dashboard/pricing"
                        className="p-4 border rounded-lg flex items-center hover:bg-gray-50 transition"
                      >
                        <div className="mr-3 bg-purple-100 p-2 rounded-full">
                          <ArrowUpCircle className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Upgrade Plan</h4>
                          <p className="text-sm text-gray-500">Explore other pricing options</p>
                        </div>
                      </Link>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add the cancel confirmation dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cancel Subscription?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? You'll continue to have access until the end of your current billing period.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-yellow-50 border border-yellow-100 rounded-md p-4 mt-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              <div className="text-sm text-yellow-700">
                <p className="font-medium">Important:</p>
                <p>You will lose access to premium features after your current billing period ends.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCancelDialog(false)}
            >
              Keep Subscription
            </Button>
            <Button 
              variant="destructive"
              onClick={executeCancellation}
              disabled={isManagingSubscription}
            >
              {isManagingSubscription ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Proceed with Cancellation</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 