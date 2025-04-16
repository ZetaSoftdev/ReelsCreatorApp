"use client"
import { GalleryThumbnails, HelpCircle, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'
import React, { useState, useEffect } from 'react'
import ThemeToggle from './ThemeToggle'
import { Role } from '@/lib/constants'

const HomeHeader = ({pageName}: {pageName: string}) => {
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check if user is admin
  useEffect(() => {
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        setIsAdmin(user.role === Role.ADMIN);
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  }, []);
  
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
          <Link href="/help" className="text-gray-500 dark:text-gray-100 hover:text-gray-700">
            <HelpCircle size={24} />
          </Link>
          <ThemeToggle/>
        </div>
      </header>
  )
}

export default HomeHeader