'use client';

import { useState } from 'react';
import HomeHeader from '@/components/HomeHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FaYoutube, FaTiktok, FaInstagram, FaFacebook, FaRegCalendarCheck } from 'react-icons/fa';
import { HiOutlineStatusOnline } from 'react-icons/hi';
import { BsBarChartFill } from 'react-icons/bs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import ScheduledPostsTable from '@/components/social/ScheduledPostsTable';

const platformColors = {
  YOUTUBE: '#FF0000',
  TIKTOK: '#000000',
  INSTAGRAM: '#C13584',
  FACEBOOK: '#4267B2',
};

// Simulated data for demonstration
const activityData = [
  { day: 'Mon', posts: 2, views: 120 },
  { day: 'Tue', posts: 1, views: 80 },
  { day: 'Wed', posts: 3, views: 250 },
  { day: 'Thu', posts: 2, views: 150 },
  { day: 'Fri', posts: 4, views: 340 },
  { day: 'Sat', posts: 1, views: 90 },
  { day: 'Sun', posts: 0, views: 30 },
];

const platformData = [
  { name: 'YouTube', value: 35, color: platformColors.YOUTUBE },
  { name: 'TikTok', value: 25, color: platformColors.TIKTOK },
  { name: 'Instagram', value: 30, color: platformColors.INSTAGRAM },
  { name: 'Facebook', value: 10, color: platformColors.FACEBOOK },
];

const engagementData = [
  { month: 'Jan', likes: 120, comments: 34, shares: 12 },
  { month: 'Feb', likes: 160, comments: 45, shares: 18 },
  { month: 'Mar', likes: 180, comments: 52, shares: 24 },
  { month: 'Apr', likes: 220, comments: 63, shares: 28 },
  { month: 'May', likes: 260, comments: 58, shares: 32 },
  { month: 'Jun', likes: 300, comments: 70, shares: 45 },
];

const summaryStats = [
  {
    title: 'Total Posts',
    value: '32',
    icon: <FaRegCalendarCheck className="h-6 w-6 text-purple-600" />,
    description: 'Posts published across all platforms'
  },
  {
    title: 'Average Engagement',
    value: '7.4%',
    icon: <BsBarChartFill className="h-6 w-6 text-purple-600" />,
    description: 'Average engagement rate per post'
  },
  {
    title: 'Active Accounts',
    value: '4',
    icon: <HiOutlineStatusOnline className="h-6 w-6 text-purple-600" />,
    description: 'Connected social media accounts'
  }
];

export default function SocialDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <>
      <HomeHeader pageName="Social Dashboard" />
      <div className="p-6">
        <div className="mb-6">
          <p className="text-gray-500">
            Track your social media posts, schedule, and performance across platforms.
          </p>
        </div>

        <Tabs
          defaultValue="overview"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4 md:w-max mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled Posts</TabsTrigger>
            <TabsTrigger value="published">All Videos</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {summaryStats.map((stat, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-medium">
                      {stat.title}
                    </CardTitle>
                    {stat.icon}
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-1">{stat.value}</div>
                    <p className="text-sm text-gray-500">{stat.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Distribution by Platform */}
            <Card>
              <CardHeader>
                <CardTitle>Distribution by Platform</CardTitle>
                <CardDescription>
                  Percentage of your posts across different social platforms
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={platformData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {platformData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Posts and views in the last 7 days
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityData}>
                    <XAxis dataKey="day" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="posts" name="Posts" fill="#8884d8" />
                    <Bar yAxisId="right" dataKey="views" name="Views (x10)" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scheduled Posts Tab */}
          <TabsContent value="scheduled">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Posts</CardTitle>
                <CardDescription>
                  Manage your scheduled social media posts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScheduledPostsTable filter="SCHEDULED" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Published Videos Tab */}
          <TabsContent value="published">
            <Card>
              <CardHeader>
                <CardTitle>All Videos</CardTitle>
                <CardDescription>
                  Manage your videos across social media platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScheduledPostsTable />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Platform Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { name: 'YouTube', icon: <FaYoutube size={24} className="text-red-600" />, followers: '2.3K', growth: '+5%' },
                { name: 'TikTok', icon: <FaTiktok size={24} className="text-black" />, followers: '4.7K', growth: '+12%' },
                { name: 'Instagram', icon: <FaInstagram size={24} className="text-pink-600" />, followers: '3.1K', growth: '+8%' },
                { name: 'Facebook', icon: <FaFacebook size={24} className="text-blue-600" />, followers: '1.5K', growth: '+2%' },
              ].map((platform, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-md font-medium">
                      {platform.name}
                    </CardTitle>
                    {platform.icon}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{platform.followers}</div>
                    <div className="text-sm text-green-500">{platform.growth}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Engagement Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
                <CardDescription>
                  Likes, comments and shares over time
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="likes" stroke="#8884d8" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="comments" stroke="#82ca9d" />
                    <Line type="monotone" dataKey="shares" stroke="#ffc658" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance by Platform */}
            <Card>
              <CardHeader>
                <CardTitle>Performance by Platform</CardTitle>
                <CardDescription>
                  Average engagement per platform
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { platform: 'YouTube', views: 3200, engagement: 7.2 },
                      { platform: 'TikTok', views: 5400, engagement: 11.5 },
                      { platform: 'Instagram', views: 2800, engagement: 9.3 },
                      { platform: 'Facebook', views: 1200, engagement: 4.8 },
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="platform" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="views" name="Views" fill="#8884d8" />
                    <Bar yAxisId="right" dataKey="engagement" name="Engagement %" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-10 bg-purple-50 p-6 rounded-lg border border-purple-200">
          <h3 className="text-lg font-semibold mb-2">Analytics Data Simulation</h3>
          <p className="text-gray-600 mb-4">
            The data shown in this dashboard is simulated for demonstration purposes. In a production environment, this page would:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-gray-600">
            <li>Fetch real analytics data from each social media platform API</li>
            <li>Track post performance and engagement metrics over time</li>
            <li>Provide insights and recommendations based on content performance</li>
            <li>Allow filtering and customization of date ranges and metrics</li>
          </ul>
        </div>
      </div>
    </>
  );
} 