"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-white p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full p-8 rounded-xl shadow-2xl border border-gray-300/50 text-center"
      >
        <div className="flex justify-center mb-6">
          <AlertTriangle className="h-16 w-16 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Unauthorized Access</h1>
        
        <p className="text-gray-600 mb-6">
          Sorry, you don't have permission to access this page. This area requires 
          administrator privileges.
        </p>
        
        <Link 
          href="/dashboard/home" 
          className="inline-block bg-purple-200 text-black font-medium py-3 px-6 rounded-lg hover:bg-purple-300 transition-colors"
        >
          Go to Home
        </Link>
        
        <p className="mt-6 text-gray-500 text-sm">
          If you believe this is an error, please contact the site administrator for assistance.
        </p>
      </motion.div>
    </div>
  );
} 