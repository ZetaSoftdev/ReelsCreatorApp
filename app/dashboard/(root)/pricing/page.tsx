'use client';

import HomeHeader from '@/components/HomeHeader';
import { motion } from 'framer-motion';
import { CheckCircle, PlayCircle, Video } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

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

const Pricing = () => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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

    return (
        <>
            <HomeHeader pageName='Pricing' />
            <main className="p-10 w-full flex flex-col bg-bgWhite items-center">
                <h1 className="text-xl font-bold text-darkBrown mb-2">Pricing</h1>
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center text-4xl font-bold text-darkBrown"
                >
                    What's the price of <span className="text-yellow">going viral?</span>
                </motion.h2>
                <p className="text-center text-base text-grayLight mt-2">
                    Whatever it is, Editur pays for itself. We're in the business of multiplying your income.
                </p>

                <div className="mt-6 flex flex-col sm:flex-row gap-4 px-3 py-2 border bg-lightGray shadow-md rounded-full">
                    <button
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-6 py-2 rounded-full font-semibold ${billingCycle === 'monthly' ? 'bg-yellow text-black' : 'bg-bgWhite text-grayLight hover:bg-yellow/85'} transition`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingCycle('yearly')}
                        className={`px-6 py-2 rounded-full font-semibold ${billingCycle === 'yearly' ? 'bg-yellow text-black' : 'bg-bgWhite text-grayLight hover:bg-yellow/85'} transition`}
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
                            return (
                                <motion.div
                                    key={plan.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, delay: index * 0.2 }}
                                    className="bg-lightGray shadow-md rounded-2xl border p-6 w-[20rem]"
                                >
                                    <div className="flex flex-col">
                                        <Video size={50} className="bg-[#2F2D35] text-white p-1 rounded-full" />
                                        <h3 className="text-xl font-bold mt-4">{plan.name}</h3>
                                        <p className="text-grayLight text-sm mt-2">{plan.description}</p>
                                    </div>
                                    <hr className="my-4 border-gray-300" />

                                    <div className="">
                                        <span className="text-5xl font-bold text-grayDark">${price}</span>
                                        <span className="text-grayLight"> / {billingCycle === 'monthly' ? 'month' : 'month (billed yearly)'}</span>
                                    </div>
                                    <button className="mt-4 bg-[#2F2D35] text-white text-lg w-full py-3 rounded-full font-semibold hover:bg-[#28262d] transition">
                                        Get started
                                    </button>
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
                    <button className="bg-[#2F2D35] text-white py-2 px-3 rounded-full shadow-lg font-medium hover:bg-[#1d1c20] transition">Let's talk</button>
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
            </main>
        </>
    );
};

export default Pricing;
