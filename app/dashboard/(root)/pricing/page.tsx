'use client';

import HomeHeader from '@/components/HomeHeader';
import { motion } from 'framer-motion';
import { CheckCircle, PlayCircle, Video, Clock, CreditCard, Calendar, ArrowUpRight, XCircle, Loader, AlertTriangle } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
const Pricing = () => {
    return (
        <>
            <HomeHeader pageName="Subscription Plans" />
            <main className="p-6 md:p-10 w-full">
                <Suspense fallback={
                    <div className="max-w-6xl mx-auto">
                        <div className="flex justify-center items-center h-64">
                            <Loader className="h-8 w-8 animate-spin text-purple-600" />
                            <span className="ml-2">Loading pricing information...</span>
                        </div>
                    </div>
                }>
                    <PricingContent />
                </Suspense>
            </main>
        </>
    );
};

// Content component that uses searchParams
const PricingContent = () => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [redirectingPlanId, setRedirectingPlanId] = useState<string | null>(null);
    const [userSubscription, setUserSubscription] = useState<UserSubscriptionData | null>(null);
    const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
    const [isManagingSubscription, setIsManagingSubscription] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Check if returning from Stripe portal
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

    // Function to handle checkout
    const handleCheckout = async (planId: string) => {
        try {
            setRedirectingPlanId(planId);
            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    planId,
                    billingCycle
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create checkout session');
            }

            const { url } = await response.json();
            
            toast({
                title: "Redirecting to Checkout",
                description: "Preparing your subscription...",
                variant: "default",
            });
            
            // Small delay to show toast
            setTimeout(() => {
                window.location.href = url;
            }, 1000);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to start checkout process"
            });
            setRedirectingPlanId(null);
        }
    };

    // Check if redirected from login with plan parameters
    useEffect(() => {
        const planId = searchParams.get('planId');
        const cycle = searchParams.get('billingCycle');

        if (planId) {
            // Set billing cycle if provided
            if (cycle && (cycle === 'monthly' || cycle === 'yearly')) {
                setBillingCycle(cycle);
            }
            
            // Start checkout process after a short delay
            setTimeout(() => {
                handleCheckout(planId);
            }, 500);
        }
    }, [searchParams]);

    // Fetch user's subscription information
    useEffect(() => {
        const fetchUserSubscription = async () => {
            try {
                setIsLoadingSubscription(true);
                const response = await fetch('/api/user/subscription');
                
                if (!response.ok) {
                    console.error('Failed to fetch user subscription:', response.status);
                    return;
                }
                
                const data = await response.json();
                setUserSubscription(data);
            } catch (error) {
                console.error('Error fetching user subscription:', error);
            } finally {
                setIsLoadingSubscription(false);
            }
        };
        
        fetchUserSubscription();
    }, []);

    // Fetch subscription plans
    useEffect(() => {
        const fetchSubscriptionPlans = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/api/subscription-plans');

                if (!response.ok) {
                    throw new Error('Failed to fetch subscription plans');
                }

                const data = await response.json();
                setSubscriptionPlans(data.subscriptionPlans);
            } catch (error: any) {
                console.error('Error fetching subscription plans:', error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: error.message || "Failed to load subscription plans"
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchSubscriptionPlans();
    }, []);

    // Function to handle cancellation (will redirect to customer portal)
    const handleManageSubscription = async () => {
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
            console.error("Error accessing subscription management:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to access subscription management"
            });
            setIsManagingSubscription(false);
        }
    };

    // Helper to check if a user can subscribe to a plan
    // Free users can subscribe to any plan
    // Existing subscribers should manage their subscription instead
    const canSubscribeToNewPlan = () => {
        // If no subscription data yet, assume they can subscribe (we'll verify on the server)
        if (!userSubscription) return true;
        
        // If they have a subscription and it's active, they should manage it instead
        return !userSubscription.hasSubscription || 
            !['active', 'active-canceling', 'trialing'].includes(userSubscription.subscription?.status || '');
    };

    const hasActiveSubscription = userSubscription?.hasSubscription && 
        ['active', 'active-canceling', 'trialing'].includes(userSubscription?.subscription?.status || '');

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
        <div className="max-w-6xl mx-auto">
            {/* Billing cycle toggle */}
            <div className="flex flex-col items-center mb-16">
                <h1 className="text-3xl md:text-4xl font-bold text-[#343434] mb-8 text-center">Choose Your Plan</h1>

                <div className="mt-6 p-1 rounded-full inline-flex border bg-lightGray shadow-md gap-1">
                    <button
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition  ${billingCycle === 'monthly' ? 'bg-yellow text-black' : 'bg-bgWhite text-grayLight hover:bg-yellow/85'}`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingCycle('yearly')}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition ${billingCycle === 'yearly' ? 'bg-yellow text-black' : 'bg-bgWhite text-grayLight hover:bg-yellow/85'}`}
                    >
                        Yearly (-20%)
                    </button>
                </div>

                {isLoading ? (
                    <div className="mt-12 flex justify-center">
                        <p className="text-grayLight">Loading subscription plans...</p>
                    </div>
                ) : (
                    <div className="mt-6 flex flex-wrap justify-center gap-8 w-full">
                        {subscriptionPlans.map((plan, index) => {
                            const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
                            const isPlanRedirecting = redirectingPlanId === plan.id;
                            const isCurrentPlan = hasActiveSubscription && userSubscription?.subscription?.plan.toLowerCase() === plan.name.toLowerCase();
                            const isPlanHigherTier = hasActiveSubscription && !isCurrentPlan && 
                                (userSubscription?.subscription?.subscriptionPlan?.monthlyPrice || 0) < plan.monthlyPrice;
                            
                            return (
                                <motion.div
                                    key={plan.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, delay: index * 0.2 }}
                                    className={`bg-lightGray shadow-md rounded-2xl border p-6 w-[20rem] 
                                        ${isCurrentPlan ? 'border-purple-500 border-2' : ''}`}
                                >
                                    <div className="flex flex-col">
                                        <Video size={50} className="bg-[#343434] text-white p-1 rounded-full" />
                                        <h3 className="text-xl font-bold mt-4">{plan.name}</h3>
                                        {isCurrentPlan && (
                                            <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full mt-1">
                                                Current Plan
                                            </span>
                                        )}
                                        <p className="text-grayLight text-sm mt-2">{plan.description}</p>
                                    </div>
                                    <hr className="my-4 border-gray-300" />

                                    <div className="">
                                        <span className="text-5xl font-bold text-grayDark">${price}</span>
                                        <span className="text-grayLight"> / {billingCycle === 'monthly' ? 'month' : 'month (billed yearly)'}</span>
                                    </div>
                                    
                                    {/* Show different buttons based on subscription status */}
                                    <div className="mt-4 space-y-2">
                                        {isCurrentPlan ? (
                                            <>
                                                {/* Current plan - show status-appropriate buttons */}
                                                {userSubscription?.subscription?.status === 'active' && (
                                                    <>
                                                        <button 
                                                            disabled={true}
                                                            className="text-white text-lg w-full py-3 rounded-full font-semibold bg-green-600 opacity-75 cursor-not-allowed"
                                                        >
                                                            Subscribed
                                                        </button>
                                                        <button 
                                                            onClick={handleManageSubscription}
                                                            disabled={isManagingSubscription}
                                                            className="text-red-600 border border-red-600 text-lg w-full py-2 rounded-full font-semibold transition hover:bg-red-50"
                                                        >
                                                            {isManagingSubscription ? (
                                                                <>
                                                                    <Loader className="inline mr-2 h-4 w-4 animate-spin" />
                                                                    Please wait...
                                                                </>
                                                            ) : (
                                                                'Cancel Subscription'
                                                            )}
                                                        </button>
                                                    </>
                                                )}
                                                
                                                {userSubscription?.subscription?.status === 'active-canceling' && (
                                                    <>
                                                        <button 
                                                            disabled={true}
                                                            className="text-white text-lg w-full py-3 rounded-full font-semibold bg-orange-500 opacity-75 cursor-not-allowed"
                                                        >
                                                            Canceling at Period End
                                                        </button>
                                                        <button 
                                                            onClick={handleManageSubscription}
                                                            disabled={isManagingSubscription}
                                                            className="text-purple-600 border border-purple-600 text-lg w-full py-2 rounded-full font-semibold transition hover:bg-purple-50"
                                                        >
                                                            {isManagingSubscription ? (
                                                                <>
                                                                    <Loader className="inline mr-2 h-4 w-4 animate-spin" />
                                                                    Please wait...
                                                                </>
                                                            ) : (
                                                                'Resume Subscription'
                                                            )}
                                                        </button>
                                                    </>
                                                )}
                                                
                                                {userSubscription?.subscription?.status === 'canceled' && (
                                                    <button 
                                                        onClick={() => handleCheckout(plan.id)}
                                                        disabled={isPlanRedirecting}
                                                        className="text-white text-lg w-full py-3 rounded-full font-semibold bg-purple-600 hover:bg-purple-700"
                                                    >
                                                        {isPlanRedirecting ? 'Redirecting...' : 'Subscribe Again'}
                                                    </button>
                                                )}
                                                
                                                {userSubscription?.subscription?.status === 'trialing' && (
                                                    <>
                                                        <button 
                                                            disabled={true}
                                                            className="text-white text-lg w-full py-3 rounded-full font-semibold bg-blue-600 opacity-75 cursor-not-allowed"
                                                        >
                                                            Trial Active
                                                        </button>
                                                        <button 
                                                            onClick={handleManageSubscription}
                                                            disabled={isManagingSubscription}
                                                            className="text-gray-600 border border-gray-600 text-lg w-full py-2 rounded-full font-semibold transition hover:bg-gray-50"
                                                        >
                                                            {isManagingSubscription ? (
                                                                <>
                                                                    <Loader className="inline mr-2 h-4 w-4 animate-spin" />
                                                                    Please wait...
                                                                </>
                                                            ) : (
                                                                'Manage Trial'
                                                            )}
                                                        </button>
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            // Non-current plans - show appropriate button
                                            <button 
                                                onClick={() => handleCheckout(plan.id)}
                                                disabled={isPlanRedirecting}
                                                className={`text-white text-lg w-full py-3 rounded-full font-semibold transition 
                                                    ${isPlanRedirecting ? 'opacity-50 cursor-not-allowed' : ''}
                                                    ${isPlanHigherTier ? 'bg-purple-600 hover:bg-purple-700' : 'bg-[#343434] hover:bg-[#28262d]'}`}
                                            >
                                                {isPlanRedirecting 
                                                    ? 'Redirecting...' 
                                                    : isPlanHigherTier
                                                        ? 'Upgrade' 
                                                        : hasActiveSubscription 
                                                            ? 'Switch Plan' 
                                                            : 'Get Started'}
                                    </button>
                                        )}
                                    </div>
                                    
                                    <p className='text-center text-sm mt-2 text-grayLight'>Cancel anytime</p>
                                    <hr className="my-4 border-gray-300" />
                                    <ul className="mt-5 text-grayDark space-y-2 text-base">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex mb-4">
                                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                                                    <path d="M11.667 4L5.25 10.417 2.334 7.5" stroke="#181818" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                                                </svg>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-6 pt-6 border-t border-gray-300">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-grayDark">Video length</span>
                                            <span className="text-grayDark">Max {plan.minutesAllowed} minutes</span>
                                        </div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-grayDark">Storage</span>
                                            <span className="text-grayDark">{plan.storageDuration} days</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-grayDark">Max file size</span>
                                            <span className="text-grayDark">{plan.maxFileSize} MB</span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="mt-12 bg-lightGray shadow-md rounded-2xl border p-6 w-full"
                >
                    <h3 className="text-xl font-bold text-grayDark mb-4">Enterprise Plan</h3>
                    <p className="text-grayLight mb-4">Need a custom solution for your organization? Contact us to get the exact control and support you need.</p>
                    <button className="bg-[#343434] text-white py-2 px-3 rounded-full shadow-lg font-medium hover:bg-[#1d1c20] transition">Let's talk</button>
                    <hr className="my-4 border-gray-300" />
                    <div className='flex flex-wrap justify-evenly gap-4'>
                        <p className='flex gap-1 items-center text-grayLight'>
                            <CheckCircle />
                            Custom minutes/month
                        </p>
                        <p className='flex gap-1 items-center text-grayLight'>
                            <CheckCircle />
                            Enterprise-level support
                        </p>
                        <p className='flex gap-1 items-center text-grayLight'>
                            <CheckCircle />
                            Payment via invoice
                        </p>
                    </div>
                </motion.div>

                {/* Add the cancel confirmation dialog */}
                <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                                Cancel Subscription
                            </DialogTitle>
                            <DialogDescription>
                                Are you sure you want to cancel your subscription? You'll still have access until the end of your billing period.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="flex gap-2 justify-between sm:justify-between">
                            <Button 
                                variant="outline" 
                                onClick={() => setShowCancelDialog(false)}
                                className="sm:w-full"
                            >
                                No, Keep Subscription
                            </Button>
                            <Button 
                                variant="destructive" 
                                onClick={executeCancellation}
                                className="sm:w-full"
                            >
                                Yes, Cancel
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default Pricing;
