"use client"
import { GalleryThumbnails, HelpCircle, LayoutDashboard, CreditCard } from 'lucide-react'
import Link from 'next/link'
import React, { useState, useEffect } from 'react'
// import ThemeToggle from './ThemeToggle'
import { Role } from '@/lib/constants'
import { useSession } from 'next-auth/react'

const HomeHeader = ({pageName}: {pageName: string}) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { data: session, status } = useSession();
  
  // Check user role and subscription status
  useEffect(() => {
    if (session?.user?.role === Role.ADMIN) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
    
    // Check if user has subscription via API
    const checkSubscription = async () => {
      try {
        const response = await fetch('/api/user/subscription');
        if (response.ok) {
          const data = await response.json();
          setIsSubscribed(data.isSubscribed || false);
        }
      } catch (error) {
        console.error('Error checking subscription status:', error);
      }
    };
    
    if (session?.user) {
      checkSubscription();
    }
  }, [session]); // Re-run when session changes
  
  return (
    <header className="flex justify-between items-center bg-lightGray px-10 py-4 shadow-md z-10">
        <h6 className="text-lg font-medium ml-9 md:ml-0">{pageName}</h6>
        <div className="flex items-center gap-4">
          {isAdmin && (
            <Link href="/admin/dashboard" className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md border border-purple-200 items-center gap-2 hidden sm:flex hover:bg-purple-200 transition-colors">
              <LayoutDashboard size={20}/>
              Admin Dashboard
            </Link>
          )}
          <Link 
            href="/dashboard/subscription" 
            className="text-gray-500 dark:text-gray-100 hover:text-gray-700 relative flex items-center"
            title="Manage Subscription"
          >
            <CreditCard size={24} />
            {isSubscribed && (
              <span className="absolute -top-1 -right-1 bg-green-500 w-2 h-2 rounded-full"></span>
            )}
          </Link>
          <Link href="/dashboard/help" className="text-gray-500 dark:text-gray-100 hover:text-gray-700">
            <HelpCircle size={24} />
          </Link>
          {/* <ThemeToggle/> */}
        </div>
      </header>
  )
}

export default HomeHeader