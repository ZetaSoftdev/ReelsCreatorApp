'use client';

import { motion } from 'framer-motion';
import { Check, CheckCircle, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BgImage from '@/components/BgImage';
import { useLogoContext } from "@/context/LogoContext";
import { toast } from '@/hooks/use-toast';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

// Types for subscription plans
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
}

const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const { branding } = useLogoContext();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [redirectingPlanId, setRedirectingPlanId] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const router = useRouter();

  // Function to check if user is logged in
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/user/session');
        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        console.error('Error fetching session:', error);
      }
    };
    
    fetchSession();
  }, []);

  // Function to handle checkout
  const handleCheckout = async (planId: string) => {
    try {
      setRedirectingPlanId(planId);
      
      // Check if user is logged in
      if (!user) {
        // Redirect to login page with redirect URL to dashboard/pricing
        const loginUrl = `/auth/sign-in?callbackUrl=${encodeURIComponent(`/dashboard/pricing?planId=${planId}&billingCycle=${billingCycle}`)}`;
        router.push(loginUrl);
        return;
      }
      
      // User is logged in, proceed with checkout
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
      window.location.href = url;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to start checkout process"
      });
      setRedirectingPlanId(null);
    }
  };

  // Fetch subscription plans from API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/subscription-plans');
        
        if (!response.ok) {
          throw new Error('Failed to fetch subscription plans');
        }
        
        const data = await response.json();
        // Only show active plans
        // const activePlans = data.subscriptionPlans.filter((plan: SubscriptionPlan) => plan.isActive);
        setPlans(data.subscriptionPlans);
      } catch (error) {
        console.error('Error fetching subscription plans:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load subscription plans"
        });
        
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPlans();
  }, []);

  const competitorComparison = [
    { feature: 'Create unlimited clips', ourProduct: true, opusClip: false, submagic: false, klapApp: false, autoShorts: false, invideo: false },
    { feature: 'AI faceless video generator', ourProduct: true, opusClip: false, submagic: false, klapApp: false, autoShorts: false, invideo: false },
    { feature: 'Export subtitles', ourProduct: true, opusClip: true, submagic: true, klapApp: true, autoShorts: false, invideo: true },
    { feature: 'Custom thumbnail', ourProduct: true, opusClip: true, submagic: false, klapApp: true, autoShorts: false, invideo: true },
    { feature: 'Schedule videos', ourProduct: true, opusClip: false, submagic: false, klapApp: false, autoShorts: false, invideo: false },
    { feature: 'Social media video analytics', ourProduct: true, opusClip: false, submagic: false, klapApp: false, autoShorts: false, invideo: false },
    { feature: 'Translate in +50 languages', ourProduct: true, opusClip: false, submagic: false, klapApp: false, autoShorts: false, invideo: false },
  ];

  return (
    <div className='relative h-screen bg-[#010C0A] pt-6 px-2 sm:px-4 md:px-6 overflow-x-hidden'>
      <BgImage />
      <div className='relative items-center z-10'>
        <Navbar />
      </div>
      
      <div className="container relative mx-auto py-16 px-4 text-white">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{branding.siteName} starts paying for itself from day 1</h1>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-xl text-gray-300 max-w-3xl mx-auto"
          >
            Before it earns you more money, {branding.siteName} already pays for itself by saving you time, since you create 10x more content
          </motion.p>
          
          <div className="flex flex-wrap justify-center mt-8 gap-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="bg-blue-900/30 px-6 py-3 rounded-lg border border-blue-500/30"
            >
              <p className="font-semibold">Helps you earn more $$</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="bg-green-900/30 px-6 py-3 rounded-lg border border-green-500/30"
            >
              <p className="font-semibold">You create 10x more content</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="bg-purple-900/30 px-6 py-3 rounded-lg border border-purple-500/30"
            >
              <p className="font-semibold">Saves you time</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="bg-yellow-900/30 px-6 py-3 rounded-lg border border-yellow-500/30"
            >
              <p className="font-semibold">Makes you more productive</p>
            </motion.div>
          </div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="text-gray-400 mt-10"
          >
            trusted by
          </motion.p>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="font-bold text-2xl"
          >
            1,000+ paying customers
          </motion.p>
        </motion.div>
        
        {/* Billing Toggle */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex justify-center mb-12"
        >
          <div className="bg-gray-900/50 p-1 rounded-full inline-flex border border-gray-700 gap-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                billingCycle === 'monthly' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-300'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                billingCycle === 'yearly' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-300'
              }`}
            >
              Yearly (-20%)
            </button>
          </div>
        </motion.div>
        
        {/* Loading state */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : (
          /* Pricing Cards */
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + (index * 0.2) }}
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
                className="bg-gray-900/40 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-700"
              >
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-2 text-white">{plan.name}</h3>
                  <p className="text-gray-400 h-12">{plan.description}</p>
                  
                  <div className="mt-6 mb-8">
                    <p className="text-sm text-gray-400">Starting from</p>
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-white">${billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}</span>
                      <span className="text-gray-400 ml-2">/ {billingCycle === 'monthly' ? 'month' : 'year'}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      handleCheckout(plan.id);
                    }}
                    className={`block w-full py-3 px-4  bg-purple-600 hover:bg-purple-700 text-white text-center rounded-lg font-medium transition ${redirectingPlanId === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={redirectingPlanId !== null}
                  >
                    {redirectingPlanId === plan.id ? 'Redirecting...' : 'Get Started'}
                  </button>
                  
                  <div className="mt-8 space-y-4">
                    <p className="text-sm font-medium text-gray-300">Plan includes:</p>
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <Check className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Video length</span>
                      <span className="text-gray-300">Max {plan.minutesAllowed} minutes</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Storage</span>
                      <span className="text-gray-300">{plan.storageDuration} days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Max file size</span>
                      <span className="text-gray-300">{plan.maxFileSize} MB</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        {/* Competitor Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-24 mb-16"
        >
          <h2 className="text-3xl font-bold text-center mb-12">How we compare to others</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="py-4 px-4 text-left text-gray-300">Features</th>
                  <th className="py-4 px-4 text-center text-white bg-purple-600/20">{branding.siteName}</th>
                  <th className="py-4 px-4 text-center text-gray-400">OpusClip</th>
                  <th className="py-4 px-4 text-center text-gray-400">Submagic</th>
                  <th className="py-4 px-4 text-center text-gray-400">KlapApp</th>
                  <th className="py-4 px-4 text-center text-gray-400">AutoShorts</th>
                  <th className="py-4 px-4 text-center text-gray-400">InVideo</th>
                </tr>
              </thead>
              <tbody>
                {competitorComparison.map((row, i) => (
                  <tr key={i} className="border-b border-gray-800">
                    <td className="py-4 px-4 text-left text-gray-300">{row.feature}</td>
                    <td className="py-4 px-4 text-center bg-purple-600/10">
                      {row.ourProduct ? 
                        <CheckCircle className="h-5 w-5 text-green-400 mx-auto" /> : 
                        <X className="h-5 w-5 text-gray-600 mx-auto" />
                      }
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row.opusClip ? 
                        <CheckCircle className="h-5 w-5 text-green-400 mx-auto" /> : 
                        <X className="h-5 w-5 text-gray-600 mx-auto" />
                      }
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row.submagic ? 
                        <CheckCircle className="h-5 w-5 text-green-400 mx-auto" /> : 
                        <X className="h-5 w-5 text-gray-600 mx-auto" />
                      }
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row.klapApp ? 
                        <CheckCircle className="h-5 w-5 text-green-400 mx-auto" /> : 
                        <X className="h-5 w-5 text-gray-600 mx-auto" />
                      }
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row.autoShorts ? 
                        <CheckCircle className="h-5 w-5 text-green-400 mx-auto" /> : 
                        <X className="h-5 w-5 text-gray-600 mx-auto" />
                      }
                    </td>
                    <td className="py-4 px-4 text-center">
                      {row.invideo ? 
                        <CheckCircle className="h-5 w-5 text-green-400 mx-auto" /> : 
                        <X className="h-5 w-5 text-gray-600 mx-auto" />
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
        
        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="max-w-4xl mx-auto mb-24"
        >
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-8">
            <div className="bg-gray-900/30 p-6 rounded-xl border border-gray-700">
              <h3 className="text-xl font-semibold mb-3">Can I cancel my subscription anytime?</h3>
              <p className="text-gray-300">Yes, you can cancel your subscription at any time. If you cancel, you'll still have access to the features until the end of your billing period.</p>
            </div>
            
            <div className="bg-gray-900/30 p-6 rounded-xl border border-gray-700">
              <h3 className="text-xl font-semibold mb-3">Do you offer a free trial?</h3>
              <p className="text-gray-300">Yes, you can try the basic features for free. We offer a limited number of shorts creation per month on the free plan.</p>
            </div>
            
            <div className="bg-gray-900/30 p-6 rounded-xl border border-gray-700">
              <h3 className="text-xl font-semibold mb-3">Can I change my plan later?</h3>
              <p className="text-gray-300">Absolutely! You can upgrade or downgrade your plan at any time. When you upgrade, you'll be charged the prorated amount for the remainder of your billing cycle.</p>
            </div>
            
            <div className="bg-gray-900/30 p-6 rounded-xl border border-gray-700">
              <h3 className="text-xl font-semibold mb-3">What payment methods do you accept?</h3>
              <p className="text-gray-300">We accept all major credit cards including Visa, Mastercard, and American Express. We also support PayPal for payments.</p>
            </div>
          </div>
        </motion.div>
        
        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 p-10 rounded-2xl text-center max-w-5xl mx-auto border border-purple-500/30"
        >
          <h2 className="text-3xl font-bold mb-4">Ready to supercharge your content creation?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Join thousands of content creators who are saving time and creating more engaging content
          </p>
          <Link 
            href="/auth/sign-up" 
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-8 rounded-lg text-lg transition-colors"
          >
            Get Started Today
          </Link>
        </motion.div>
      </div>
      
      <Footer />
    </div>
  );
};

export default PricingPage; 