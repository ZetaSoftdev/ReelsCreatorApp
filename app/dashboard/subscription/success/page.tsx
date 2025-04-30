'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

// Create a client component that uses search params
function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Redirect to subscription management page after 5 seconds
    const timer = setTimeout(() => {
      router.push('/dashboard/subscription');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
      <div className="text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Payment Successful!
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Thank you for subscribing to our service. Your subscription has been activated.
        </p>
        <p className="mt-4 text-sm text-gray-600">
          You will be redirected to your subscription management page in a few seconds...
        </p>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function SubscriptionSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Suspense fallback={
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 animate-pulse bg-gray-200 rounded-full"></div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Processing Payment...
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please wait while we confirm your subscription.
            </p>
          </div>
        </div>
      }>
        <SuccessContent />
      </Suspense>
    </div>
  );
} 