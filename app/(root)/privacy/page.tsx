'use client';

import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BgImage from '@/components/BgImage';
import Link from 'next/link';

const PrivacyPolicyPage = () => {
  return (
    <div className='relative h-screen bg-[#010C0A] pt-6 px-2 sm:px-4 md:px-6 overflow-x-hidden'>
      <BgImage />
      <div className='relative items-center z-10'>
        <Navbar />
      </div>
      
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">Privacy Policy</h1>
          
          <div className="prose prose-lg prose-invert max-w-none">
            <p className="text-gray-300 mb-6">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p>
                Welcome to Editur ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-based video editing service.
              </p>
              <p>
                Our platform provides tools to generate short viral clips from long videos, edit captions, and publish to social media accounts directly from our website.
                This policy applies to information we collect through our website, application, and any related services.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Personal Information</h3>
              <p>We may collect the following types of personal information:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-300">
                <li>Account information: name, email address, password, profile picture</li>
                <li>Billing information: payment details, billing address, subscription information</li>
                <li>Social media account information: access tokens and account identifiers for platforms you connect</li>
                <li>User-generated content: videos, clips, captions, and other content you upload or create</li>
                <li>Usage data: how you interact with our service, features you use, and time spent</li>
              </ul>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Automatically Collected Information</h3>
              <p>When you use our service, we automatically collect:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-300">
                <li>Device information: IP address, browser type, operating system, device identifiers</li>
                <li>Log data: access times, pages viewed, error logs</li>
                <li>Cookies and similar technologies: as described in our Cookie Policy</li>
                <li>Performance data: application performance metrics to improve our service</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
              <p>We use your information for the following purposes:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-300">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and manage your subscription</li>
                <li>Connect to social media platforms for content publishing</li>
                <li>Analyze usage patterns to enhance user experience</li>
                <li>Communicate with you about updates, promotions, or support</li>
                <li>Detect and prevent fraudulent activity and security issues</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Sharing Your Information</h2>
              <p>We may share your information with:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-300">
                <li>Social media platforms: when you authorize us to publish content on your behalf</li>
                <li>Service providers: for payment processing, hosting, analytics, and customer support</li>
                <li>Business partners: for joint offerings or promotional purposes (with your consent)</li>
                <li>Legal authorities: when required by law or to protect our rights</li>
              </ul>
              <p>We do not sell your personal information to third parties.</p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Data Storage and Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, 
                alteration, disclosure, or destruction. Your videos and edited content are stored securely on our servers.
              </p>
              <p>
                We retain your information for as long as your account is active or as needed to provide services, comply with legal obligations, 
                resolve disputes, or enforce agreements. You can request deletion of your data as described in Your Rights section.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
              <p>Depending on your location, you may have rights to:</p>
              <ul className="list-disc pl-6 mb-4 text-gray-300">
                <li>Access the personal information we hold about you</li>
                <li>Correct inaccurate or incomplete information</li>
                <li>Delete your personal data</li>
                <li>Restrict or object to certain processing activities</li>
                <li>Receive your data in a portable format</li>
                <li>Withdraw consent for activities based on consent</li>
              </ul>
              <p>
                To exercise these rights, please contact us at privacy@reelscreator.com. We will respond to your request within 30 days.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Children's Privacy</h2>
              <p>
                Our services are not intended for children under 16. We do not knowingly collect personal information from children under 16. 
                If you believe we have collected information from a child under 16, please contact us to have it removed.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than your country of residence. 
                These countries may have different data protection laws. We ensure appropriate safeguards are in place to protect your information.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. 
                We will notify you of any material changes by posting the new policy on our website or via email.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
              <p>
                If you have questions or concerns about this Privacy Policy or our data practices, please contact us at:
              </p>
              <p className="mt-2">
                <strong>Email:</strong> privacy@reelscreator.com<br />
                <strong>Address:</strong> 123 Creator Avenue, Suite 456, San Francisco, CA 94107
              </p>
            </section>
            
            <div className="mt-12 border-t border-gray-700 pt-6">
              <p className="text-center text-gray-400">
                By using our service, you acknowledge that you have read and understood this Privacy Policy.
              </p>
              <p className="text-center mt-4">
                <Link href="/terms" className="text-purple-400 hover:text-purple-300">
                  View our Terms of Service
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
      
      <Footer />
    </div>
  );
};

export default PrivacyPolicyPage; 