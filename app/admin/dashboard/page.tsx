"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Users, FileVideo, CreditCard, HardDrive, Clock, TrendingUp, Video, Star, DollarSign, Activity } from "lucide-react";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Helper functions
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};

const formatTime = (seconds: number) => {
  if (seconds < 60) return `${seconds} sec`;
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  const hours = Math.floor(seconds / 3600);
  const remainingMinutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${remainingMinutes}m`;
};

// Type for pie chart data
interface PlanDataItem {
  name: string;
  value: number;
}

// Type for label renderer props
interface LabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  index: number;
  name: string;
}

// Sample data - in a real app, this would come from an API
const sampleUserData = [
  { date: "Jan", users: 65 },
  { date: "Feb", users: 78 },
  { date: "Mar", users: 95 },
  { date: "Apr", users: 115 },
  { date: "May", users: 142 },
  { date: "Jun", users: 168 },
  { date: "Jul", users: 190 },
];

const sampleVideoData = [
  { name: "Uploaded", value: 125 },
  { name: "Processing", value: 15 },
  { name: "Completed", value: 98 },
  { name: "Failed", value: 12 },
];

// Dashboard component
export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/admin/dashboard');
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        const data = await response.json();
        setDashboardData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="flex justify-center items-center h-96">
          <div className="text-[#606060]">Loading dashboard data...</div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container py-10">
        <div className="bg-red-50 p-4 rounded-md border border-red-200">
          <h3 className="text-red-800 font-medium">Error loading dashboard</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }
  
  // Prepare subscription plan data for chart
  const planData: PlanDataItem[] = dashboardData?.subscriptionsByPlan?.map((item: any) => ({
    name: item.plan,
    value: item._count.plan
  })) || [];
  
  // Define colors for the pie chart
  const COLORS = ['#8B5CF6', '#C4B5FD', '#EDE9FE', '#DDD6FE'];
  
  // Format user signup data for line chart
  const signupData = dashboardData?.userSignupData?.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    users: parseInt(item.count)
  })) || [];
  
  // Custom label renderer for pie chart
  const renderCustomizedLabel = ({ name, percent }: LabelProps) => {
    return `${name}: ${(percent * 100).toFixed(0)}%`;
  };
  
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-medium text-[#343434] mb-8">Dashboard</h1>
      
      <Tabs defaultValue="overview">
        <TabsList className="mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="subscription">Subscriptions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* User Stats Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-600" />
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{dashboardData?.overview?.totalUsers || 0}</div>
                <p className="text-sm text-[#606060] mt-1">+12% from last month</p>
              </CardContent>
            </Card>
            
            {/* Content Stats Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Video className="h-5 w-5 mr-2 text-purple-600" />
                  Total Videos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{dashboardData?.overview?.totalVideos || 0}</div>
                <p className="text-sm text-[#606060] mt-1">+8% from last month</p>
              </CardContent>
            </Card>
            
            {/* System Stats Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-purple-600" />
                  Avg. Processing Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{formatTime(dashboardData?.overview?.avgProcessingTime || 0)}</div>
                <p className="text-sm text-[#606060] mt-1">-10% from last month</p>
              </CardContent>
            </Card>
            
            {/* Premium Users Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Star className="h-5 w-5 mr-2 text-yellow-500" />
                  Premium Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-500">{dashboardData?.overview?.premiumUsers || 0}</div>
                <p className="text-sm text-[#606060] mt-1">+15% from last month</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Growth Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center">
                  <TrendingUp size={18} className="mr-2 text-purple-600" />
                  User Growth
                </CardTitle>
                <CardDescription>New user signups over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={signupData} margin={{ top: 5, right: 30, left: 20, bottom: 35 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12, fill: '#666' }}
                        tickMargin={10} 
                      />
                      <YAxis tick={{ fontSize: 12, fill: '#666' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #f0f0f0',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="users" 
                        name="New Users" 
                        stroke="#8B5CF6" 
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#8B5CF6' }}
                        activeDot={{ r: 5, fill: '#8B5CF6' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Subscription Plan Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center">
                  <CreditCard size={18} className="mr-2 text-purple-600" />
                  Subscription Plans
                </CardTitle>
                <CardDescription>Active subscription distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  {planData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={planData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                          nameKey="name"
                          label={renderCustomizedLabel}
                          labelLine={false}
                        >
                          {planData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: any) => [`${value} subscribers`, 'Count']}
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #f0f0f0',
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-gray-400">No subscription data available</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="users">
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-xl font-medium mb-4">User Analytics</h2>
            <p className="text-gray-500">Detailed user analytics section will be implemented next.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="content">
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-xl font-medium mb-4">Content Analytics</h2>
            <p className="text-gray-500">Detailed content analytics section will be implemented next.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="subscription">
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-xl font-medium mb-4">Subscription Analytics</h2>
            <p className="text-gray-500">Detailed subscription analytics section will be implemented next.</p>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Recent Activity & Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-purple-600" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest user actions on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 pb-4 border-b">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-[#343434]">New User Registration</p>
                  <p className="text-sm text-[#606060]">John Smith joined the platform</p>
                  <p className="text-xs text-[#606060] mt-1">10 minutes ago</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 pb-4 border-b">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Video className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-[#343434]">Video Uploaded</p>
                  <p className="text-sm text-[#606060]">Sarah Johnson uploaded "Summer Vacation Highlights"</p>
                  <p className="text-xs text-[#606060] mt-1">25 minutes ago</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 pb-4 border-b">
                <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Star className="h-4 w-4 text-yellow-500" />
                </div>
                <div>
                  <p className="font-medium text-[#343434]">Premium Subscription</p>
                  <p className="text-sm text-[#606060]">Michael Brown upgraded to Premium plan</p>
                  <p className="text-xs text-[#606060] mt-1">1 hour ago</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-[#343434]">Video Processed</p>
                  <p className="text-sm text-[#606060]">Video "Marketing Tips 2023" finished processing</p>
                  <p className="text-xs text-[#606060] mt-1">2 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-600" />
              Revenue
            </CardTitle>
            <CardDescription>Subscription revenue breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-green-600">$12,540</p>
                  <p className="text-sm text-[#606060]">Total revenue this month</p>
                </div>
                <div className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                  +18% from last month
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-sm text-[#343434]">Basic Plan</p>
                    <p className="text-sm font-medium text-[#343434]">$3,240</p>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-300 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-sm text-[#343434]">Premium Plan</p>
                    <p className="text-sm font-medium text-[#343434]">$6,720</p>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600 rounded-full" style={{ width: '53%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-sm text-[#343434]">Enterprise Plan</p>
                    <p className="text-sm font-medium text-[#343434]">$2,580</p>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 rounded-full" style={{ width: '22%' }}></div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-[#343434] mb-2">Upcoming Renewals</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-[#606060]">Next 7 days</p>
                    <p className="text-sm font-medium text-[#343434]">12 subscriptions</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-[#606060]">Next 30 days</p>
                    <p className="text-sm font-medium text-[#343434]">48 subscriptions</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  trendUp,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend: string;
  trendUp: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </div>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-end">
          <div className="text-2xl font-bold">{value}</div>
          <div
            className={cn(
              "flex items-center text-xs font-medium",
              trendUp ? "text-green-600" : "text-red-600"
            )}
          >
            <ArrowUpDown className="mr-1 h-3 w-3" />
            {trend}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 