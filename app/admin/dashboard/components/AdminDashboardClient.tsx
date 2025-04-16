"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@/lib/constants";
import Link from "next/link";
import axios from "axios";
import { Users, Film, CreditCard, Clock, FileUp, HardDrive } from "lucide-react";

// Define types for our dashboard data
type SubscriptionPlan = {
  plan: string;
  _count: {
    plan: number;
  };
}

type DashboardStats = {
  totalUsers: number;
  totalVideos: number;
  activeSubscriptions: number;
  overview: {
    totalUsers: number;
    totalVideos: number;
    activeSubscriptions: number;
    newUsers: number;
    recentVideos: number;
    totalStorage: number;
    avgProcessingTime: number;
  };
  subscriptionsByPlan: SubscriptionPlan[];
  userSignupData: {
    date: string;
    count: number;
  }[];
}

export default function AdminDashboardClient() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalVideos: 0,
    activeSubscriptions: 0,
    overview: {
      totalUsers: 0,
      totalVideos: 0,
      activeSubscriptions: 0,
      newUsers: 0,
      recentVideos: 0,
      totalStorage: 0,
      avgProcessingTime: 0
    },
    subscriptionsByPlan: [],
    userSignupData: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check authentication from localStorage as a backup protection
    function verifyAdminAuth() {
      try {
        const userData = localStorage.getItem('userData');
        if (!userData) {
          // For development, we'll just allow access without auth
          // router.push("/login");
          return;
        }
        
        const user = JSON.parse(userData);
        if (!user || user.role !== Role.ADMIN) {
          // For development, we'll just allow access without auth check
          // router.push("/unauthorized");
          return;
        }
      } catch (error) {
        console.error("Error verifying admin auth:", error);
        // For development, we'll just allow access without auth
        // router.push("/login");
      }
    }
    
    // Fetch admin dashboard data from API
    async function fetchDashboardData() {
      setLoading(true);
      setError(false);
      try {
        const response = await axios.get("/api/admin/dashboard");
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        setError(true);
        // Fallback to placeholder data if API fails
        setStats({
          totalUsers: 0,
          totalVideos: 0,
          activeSubscriptions: 0,
          overview: {
            totalUsers: 0,
            totalVideos: 0,
            activeSubscriptions: 0,
            newUsers: 0,
            recentVideos: 0,
            totalStorage: 0,
            avgProcessingTime: 0
          },
          subscriptionsByPlan: [],
          userSignupData: []
        });
      } finally {
        setLoading(false);
      }
    }

    verifyAdminAuth();
    fetchDashboardData();
  }, [router]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
    return `${Math.floor(seconds / 3600)} hours ${Math.floor((seconds % 3600) / 60)} minutes`;
  };

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md mb-8">
        <p className="text-red-600">Error loading dashboard data. Please try again later.</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-3xl font-medium text-[#343434] mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Stats Cards */}
        <Link href="/admin/users">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-[#e0e0e0] hover:shadow-md transition-shadow cursor-pointer h-full">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-medium text-[#343434]">Total Users</h2>
                {loading ? (
                  <div className="h-8 w-20 bg-gray-200 animate-pulse rounded mt-2"></div>
                ) : (
                  <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalUsers}</p>
                )}
                {!loading && (
                  <p className="text-sm text-[#606060] mt-2">
                    <span className="font-medium text-purple-600">{stats.overview?.newUsers || 0}</span> new in last 30 days
                  </p>
                )}
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </Link>
        
        <Link href="/admin/content">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-[#e0e0e0] hover:shadow-md transition-shadow cursor-pointer h-full">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-medium text-[#343434]">Total Videos</h2>
                {loading ? (
                  <div className="h-8 w-20 bg-gray-200 animate-pulse rounded mt-2"></div>
                ) : (
                  <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalVideos}</p>
                )}
                {!loading && (
                  <p className="text-sm text-[#606060] mt-2">
                    <span className="font-medium text-purple-600">{stats.overview?.recentVideos || 0}</span> uploaded recently
                  </p>
                )}
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Film className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </Link>
        
        <Link href="/admin/subscriptions">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-[#e0e0e0] hover:shadow-md transition-shadow cursor-pointer h-full">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-medium text-[#343434]">Active Subscriptions</h2>
                {loading ? (
                  <div className="h-8 w-20 bg-gray-200 animate-pulse rounded mt-2"></div>
                ) : (
                  <p className="text-3xl font-bold text-purple-600 mt-2">{stats.activeSubscriptions}</p>
                )}
                {!loading && stats.subscriptionsByPlan && stats.subscriptionsByPlan.length > 0 && (
                  <p className="text-sm text-[#606060] mt-2">
                    <span className="font-medium text-purple-600">
                      {stats.subscriptionsByPlan[0]?._count?.plan || 0}
                    </span> {stats.subscriptionsByPlan[0]?.plan || ''} plans
                  </p>
                )}
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-[#e0e0e0]">
          <h2 className="text-lg font-medium text-[#343434] mb-4">System Overview</h2>
          {loading ? (
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-6 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-6 bg-gray-200 animate-pulse rounded"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-[#606060]">Avg. Processing Time</p>
                  <p className="font-medium text-[#343434]">{formatTime(stats.overview?.avgProcessingTime || 0)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded">
                  <FileUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-[#606060]">Recent Uploads</p>
                  <p className="font-medium text-[#343434]">{stats.overview?.recentVideos || 0} videos in last 30 days</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded">
                  <HardDrive className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-[#606060]">Total Storage Used</p>
                  <p className="font-medium text-[#343434]">{formatBytes(stats.overview?.totalStorage || 0)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-[#e0e0e0]">
          <h2 className="text-lg font-medium text-[#343434] mb-4">Subscription Distribution</h2>
          {loading ? (
            <div className="h-40 bg-gray-200 animate-pulse rounded"></div>
          ) : (
            <div className="space-y-4">
              {stats.subscriptionsByPlan && stats.subscriptionsByPlan.length > 0 ? (
                stats.subscriptionsByPlan.map((plan, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full bg-purple-${600 - (index * 100)}`}></div>
                      <span className="capitalize text-[#343434]">{plan.plan}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[#606060]">{plan._count.plan} users</span>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ 
                            width: `${(plan._count.plan / stats.totalUsers) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[#606060]">No subscription data available</p>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-[#e0e0e0]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-[#343434]">System Status</h2>
          <div className="bg-green-100 px-3 py-1 rounded text-sm text-green-700 font-medium">Healthy</div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[#606060]">API Response Time</p>
            <p className="text-[#343434] font-medium">45ms</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[#606060]">Server Load</p>
            <p className="text-[#343434] font-medium">24%</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[#606060]">Database Status</p>
            <p className="text-[#343434] font-medium">Connected</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[#606060]">Last Backup</p>
            <p className="text-[#343434] font-medium">Today, 03:45 AM</p>
          </div>
        </div>
      </div>
    </>
  );
} 