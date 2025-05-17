'use client';

import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BgImage from '@/components/BgImage';
import Link from 'next/link';

const TermsOfServicePage = () => {
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
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center">Terms of Service</h1>
          
          <div className="prose prose-lg prose-invert max-w-none">
            <p className="text-gray-300 mb-6">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p>
                Welcome to Reels Creator. These Terms of Service ("Terms") govern your access to and use of our website, services,
                and applications (collectively, the "Service"). By accessing or using our Service, you agree to be bound by these Terms.
              </p>
              <p>
                Our Service provides AI-based video editing tools that enable users to generate short viral clips from long videos,
                edit captions, and publish to social media accounts directly from our website.
              </p>
              <p>
                If you do not agree with any part of these Terms, you may not access or use our Service.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Account Registration</h2>
              <p>
                To access certain features of the Service, you must register for an account. You agree to provide accurate, current, 
                and complete information during the registration process and to update such information to keep it accurate, current, and complete.
              </p>
              <p>
                You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your account.
                We encourage you to use a strong password and to sign out from your account at the end of each session.
              </p>
              <p>
                You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security 
                or unauthorized use of your account.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Subscription and Payment</h2>
              <p>
                Certain features of our Service require a paid subscription. By purchasing a subscription, you agree to pay the fees as described on our pricing page.
              </p>
              <p>
                All fees are exclusive of all taxes, levies, or duties imposed by taxing authorities. You are responsible for all taxes associated with your purchase.
              </p>
              <p>
                Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current billing period. You can cancel your subscription 
                through your account settings or by contacting support.
              </p>
              <p>
                No refunds will be provided for any subscription fees already paid, except as required by applicable law.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. User Content</h2>
              <p>
                Our Service allows you to upload, edit, and share content, including videos, images, and text ("User Content").
                You retain ownership of your User Content, but you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, 
                adapt, publish, translate, and distribute your User Content in connection with the Service.
              </p>
              <p>
                You represent and warrant that:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-300">
                <li>You own or have the necessary rights to your User Content</li>
                <li>Your User Content does not violate the rights of any third party, including intellectual property rights and privacy rights</li>
                <li>Your User Content complies with these Terms and all applicable laws and regulations</li>
              </ul>
              <p>
                We reserve the right to remove any User Content that violates these Terms or that we find objectionable.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Social Media Integration</h2>
              <p>
                Our Service allows you to connect to various social media platforms (such as YouTube, TikTok, and others) to publish content directly from our website.
                By using these features, you authorize us to access and interact with your social media accounts on your behalf.
              </p>
              <p>
                You are responsible for complying with the terms and policies of any third-party social media platforms you connect to through our Service.
                We are not responsible for the availability or functionality of any social media platform.
              </p>
              <p>
                We may store access tokens for the social media platforms you connect, but we will only use them to provide the requested services and 
                will handle them securely according to our Privacy Policy.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Prohibited Uses</h2>
              <p>
                You agree not to use the Service:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-300">
                <li>In any way that violates any applicable law or regulation</li>
                <li>To transmit any material that is defamatory, obscene, or otherwise objectionable</li>
                <li>To infringe upon any patent, trademark, trade secret, copyright, or other intellectual property rights</li>
                <li>To transmit any unsolicited or unauthorized advertising or promotional materials</li>
                <li>To impersonate or attempt to impersonate our company, employees, another user, or any other person</li>
                <li>To engage in any activity that interferes with or disrupts the Service</li>
                <li>To attempt to access any parts of the Service that you are not authorized to access</li>
                <li>To create or distribute content that promotes hate speech, discrimination, or violence</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
              <p>
                The Service and its original content, features, and functionality are and will remain the exclusive property of Reels Creator and its licensors.
                The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
                Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. AI Generated Content</h2>
              <p>
                Our Service uses artificial intelligence to help generate and edit content. While we strive to provide high-quality AI-generated content, 
                we do not guarantee that such content will be error-free, complete, or suitable for your specific needs.
              </p>
              <p>
                You are responsible for reviewing and editing any AI-generated content before publication or distribution.
                We are not responsible for any consequences resulting from your use of AI-generated content.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, in no event shall Reels Creator, its directors, employees, partners, agents, suppliers, 
                or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, 
                loss of profits, data, use, goodwill, or other intangible losses, resulting from:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-300">
                <li>Your access to or use of or inability to access or use the Service</li>
                <li>Any conduct or content of any third party on the Service</li>
                <li>Any content obtained from the Service</li>
                <li>Unauthorized access, use, or alteration of your transmissions or content</li>
                <li>The quality, accuracy, or reliability of AI-generated content</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Termination</h2>
              <p>
                We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, 
                for any reason whatsoever, including without limitation if you breach these Terms.
              </p>
              <p>
                Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, 
                you may simply discontinue using the Service or contact us to request account deletion.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
              <p>
                We reserve the right to modify or replace these Terms at any time. If a revision is material, we will make reasonable efforts to provide at least 30 days' notice prior to any new terms taking effect.
              </p>
              <p>
                By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Governing Law</h2>
              <p>
                These Terms shall be governed and construed in accordance with the laws of [Your Country], without regard to its conflict of law provisions.
              </p>
              <p>
                Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
              <p>
                If you have any questions about these Terms, please contact us at:
              </p>
              <p className="mt-2">
                <strong>Email:</strong> legal@reelscreator.com<br />
                <strong>Address:</strong> 123 Creator Avenue, Suite 456, San Francisco, CA 94107
              </p>
            </section>
            
            <div className="mt-12 border-t border-gray-700 pt-6">
              <p className="text-center text-gray-400">
                By using our service, you acknowledge that you have read and understood these Terms of Service.
              </p>
              <p className="text-center mt-4">
                <Link href="/privacy" className="text-purple-400 hover:text-purple-300">
                  View our Privacy Policy
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

export default TermsOfServicePage; 