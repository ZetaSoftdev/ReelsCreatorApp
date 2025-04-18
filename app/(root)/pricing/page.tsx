'use client';

import { motion } from 'framer-motion';
import { Check, CheckCircle, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BgImage from '@/components/BgImage';
import { useLogoContext } from "@/context/LogoContext";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const { branding } = useLogoContext();

  const plans = [
    {
      name: 'Subtitles Pro',
      monthlyPrice: 15,
      yearlyPrice: 19,
      description: 'Add professional quality subtitles to your shorts, very quickly',
      features: [
        '100 subtitled shorts / month',
        'Cropping from long videos',
        '1 min 30 max per video',
        '300 MB/video',
        'Import music and sound effects',
        'B-rolls',
        'Import your own images',
        'Faceless video: 4 per week',
      ],
    },
    {
      name: 'Advanced',
      monthlyPrice: 23,
      yearlyPrice: 29,
      description: 'Turn your long-form videos into multiple shorts with a few clicks',
      features: [
        'Everything included in Subtitles Pro, plus...',
        '2 min max',
        '30 shorts from long videos per month',
        'Auto-Crop to vertical format (9:16)',
        '1GB and 2 hours / long video',
        'Import long video by local file or YouTube link',
        'Faceless video: 10 per week',
      ],
    },
    {
      name: 'Expert',
      monthlyPrice: 47,
      yearlyPrice: 59,
      description: 'Create, plan, publish and save incredible amounts of time',
      features: [
        'Everything included in Advanced, plus...',
        '3 min max',
        '100 shorts from long videos / month',
        'Program & Publish to all platforms (YouTube, TikTok, Instagram, etc)',
        'Analyze content performance',
        'Faceless video: 30 per week',
      ],
    },
  ];

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
          <div className="bg-gray-900/50 p-1 rounded-full inline-flex border border-gray-700">
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
        
        {/* Pricing Cards */}
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
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <div className="mt-4 flex items-baseline">
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.8 + (index * 0.1) }}
                    className="text-4xl font-extrabold text-white"
                  >
                    ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                  </motion.span>
                  <span className="ml-1 text-gray-400">/ Per Month</span>
                </div>
                
                <Link href="/sign-up">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-6 w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition"
                  >
                    Get Started
                  </motion.button>
                </Link>
                <p className="text-center text-sm text-gray-400 mt-2">No credit card required</p>
              </div>
              
              <div className="bg-gray-800/30 px-8 py-6">
                <p className="font-medium mb-4 text-gray-300">Features:</p>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <motion.li 
                      key={i} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.6 + (i * 0.05) + (index * 0.1) }}
                      className="flex items-start"
                    >
                      <Check size={18} className="text-purple-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Comparison Table */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-24 max-w-6xl mx-auto"
        >
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-3xl font-bold text-center mb-12"
          >
            Compare to similar products
          </motion.h2>
          
          <div className="overflow-x-auto">
            <motion.table 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="min-w-full bg-gray-900/40 backdrop-blur-sm shadow-lg rounded-lg overflow-hidden border border-gray-700"
            >
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-gray-300">Feature</th>
                  <th className="border-b hidden lg:table-cell lg:w-[180px]">Basic</th>
                  <th className="border-b hidden lg:table-cell lg:w-[180px]">Advanced</th>
                  <th className="border-b hidden lg:table-cell lg:w-[180px]">Pro</th>
                  <th className="px-6 py-4 text-center text-purple-400 font-bold">{branding.siteName}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {competitorComparison.map((row, index) => (
                  <motion.tr 
                    key={index} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.8 + (index * 0.1) }}
                    className={index % 2 === 0 ? 'bg-gray-800/20' : 'bg-gray-900/40'}
                  >
                    <td className="px-6 py-4 text-gray-300 font-medium">{row.feature}</td>
                    <td className="px-6 py-4 text-center">
                      {row.ourProduct ? 
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.5, delay: 1 + (index * 0.05) }}
                        >
                          <Check size={20} className="mx-auto text-green-400" />
                        </motion.div> : 
                        <X size={20} className="mx-auto text-red-400" />
                      }
                    </td>
                    <td className="px-6 py-4 text-center">
                      {row.opusClip ? <Check size={20} className="mx-auto text-green-400" /> : <X size={20} className="mx-auto text-red-400" />}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {row.submagic ? <Check size={20} className="mx-auto text-green-400" /> : <X size={20} className="mx-auto text-red-400" />}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {row.klapApp ? <Check size={20} className="mx-auto text-green-400" /> : <X size={20} className="mx-auto text-red-400" />}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {row.autoShorts ? <Check size={20} className="mx-auto text-green-400" /> : <X size={20} className="mx-auto text-red-400" />}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {row.invideo ? <Check size={20} className="mx-auto text-green-400" /> : <X size={20} className="mx-auto text-red-400" />}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </motion.table>
          </div>
        </motion.div>
        
        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-24 text-center max-w-4xl mx-auto bg-gray-900/40 backdrop-blur-sm rounded-2xl p-12 border border-gray-700"
        >
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="text-3xl font-bold mb-6"
          >
            Are You Ready to Become The Next Big Video Creator?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="text-lg text-gray-300 mb-8"
          >
            Try Today for Free & Get Access to everything you need to start Multiplying Your Revenue.
          </motion.p>
          
          <Link href="/sign-up">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.2, type: "spring", stiffness: 400 }}
              className="bg-purple-600 text-white px-8 py-4 rounded-lg font-medium text-lg hover:bg-purple-700 transition"
            >
              Try for free
            </motion.button>
          </Link>
        </motion.div>
      </div>
      
      <Footer />
    </div>
  );
};

export default PricingPage; 