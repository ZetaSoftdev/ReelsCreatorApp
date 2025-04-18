"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Cross2Icon, MagnifyingGlassIcon, PlusIcon } from "@radix-ui/react-icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import Link from "next/link";
import { DollarSign, CreditCard, Users, CheckCircle, XCircle, Calendar } from "lucide-react";

// Types for subscription data
interface Subscription {
  id: string;
  userId: string;
  plan: string;
  status: string;
  startDate: string;
  endDate: string | null;
  minutesAllowed: number;
  minutesUsed: number;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    profileImage: string | null;
  };
}

interface SubscriptionResponse {
  subscriptions: Subscription[];
  pagination: {
    total: number;
    pageSize: number;
    currentPage: number;
    totalPages: number;
  };
  metadata: {
    subscriptionsByPlan: {
      plan: string;
      _count: {
        plan: number;
      };
    }[];
    subscriptionsByStatus: {
      status: string;
      _count: {
        status: number;
      };
    }[];
    revenue: {
      total: number;
      byPlan: {
        plan: string;
        count: number;
        revenue: number;
      }[];
    };
  };
}

// Helper functions
const formatDate = (dateString: string | null): string => {
  if (!dateString) return "N/A";
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Generate initials from name
const getInitials = (name: string | null): string => {
  if (!name) return "U";
  
  const names = name.split(" ");
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

// Plan colors
const PLAN_COLORS = {
  free: "#9CA3AF",
  basic: "#60A5FA",
  pro: "#8B5CF6",
  enterprise: "#F59E0B"
};

export default function SubscriptionsPage() {
  // State for subscriptions and loading
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for filters
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("startDate");
  const [sortOrder, setSortOrder] = useState("desc");
  
  // Function to fetch subscriptions
  const fetchSubscriptions = async () => {
    setIsLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: "10",
        sortBy,
        sortOrder
      });
      
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      
      if (planFilter && planFilter !== "all") {
        params.append("plan", planFilter);
      }
      
      if (statusFilter && statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      
      const response = await fetch(`/api/admin/subscriptions?${params}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch subscriptions");
      }
      
      const data = await response.json();
      setSubscriptionData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch subscriptions when filters change
  useEffect(() => {
    fetchSubscriptions();
  }, [currentPage, planFilter, statusFilter, sortBy, sortOrder]);
  
  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    fetchSubscriptions();
  };
  
  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setPlanFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
    setSortBy("startDate");
    setSortOrder("desc");
  };
  
  // Handle sort
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };
  
  // Prepare data for plan distribution chart
  const planData = subscriptionData?.metadata.subscriptionsByPlan.map(item => ({
    name: item.plan,
    value: item._count.plan,
    fill: PLAN_COLORS[item.plan as keyof typeof PLAN_COLORS] || "#8B5CF6"
  })) || [];
  
  // Prepare data for revenue by plan chart
  const revenueData = subscriptionData?.metadata.revenue.byPlan.map(item => ({
    name: item.plan.charAt(0).toUpperCase() + item.plan.slice(1),
    revenue: parseFloat(item.revenue as any),
    count: parseInt(item.count as any),
    fill: PLAN_COLORS[item.plan as keyof typeof PLAN_COLORS] || "#8B5CF6"
  })) || [];
  
  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-medium text-gray-800">Subscription Management</h1>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Subscription
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Revenue Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-purple-600" />
              Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {formatCurrency(subscriptionData?.metadata.revenue.total || 0)}
            </div>
          </CardContent>
        </Card>
        
        {/* Total Subscribers Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Users className="h-5 w-5 mr-2 text-purple-600" />
              Total Subscribers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {subscriptionData?.pagination.total || 0}
            </div>
          </CardContent>
        </Card>
        
        {/* Active Subscriptions Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {subscriptionData?.metadata.subscriptionsByStatus.find(s => s.status === "active")?._count.status || 0}
            </div>
          </CardContent>
        </Card>
        
        {/* Inactive Subscriptions Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <XCircle className="h-5 w-5 mr-2 text-gray-500" />
              Inactive
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-500">
              {subscriptionData?.metadata.subscriptionsByStatus.find(s => s.status !== "active")?._count.status || 0}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue by Plan Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-purple-600" />
              Revenue by Plan
            </CardTitle>
            <CardDescription>Monthly revenue breakdown by subscription plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={revenueData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" />
                  <YAxis 
                    tickFormatter={(value) => `$${value}`}
                    domain={[0, 'dataMax + 100']}
                  />
                  <Tooltip 
                    formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #f0f0f0',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="revenue" 
                    name="Revenue" 
                    fill="#8B5CF6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Subscription Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-purple-600" />
              Subscription Plans
            </CardTitle>
            <CardDescription>Distribution by plan type</CardDescription>
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
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {planData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
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
            <div className="mt-4 space-y-2">
              {planData.map((plan) => (
                <div key={plan.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: plan.fill }}
                    />
                    <span className="capitalize">{plan.name}</span>
                  </div>
                  <span>{plan.value} users</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Subscription Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription List</CardTitle>
          <CardDescription>Manage customer subscriptions</CardDescription>
          
          {/* Filters */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by user name or email"
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
              />
            </div>
            
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={handleSearch}>
              Search
            </Button>
            
            <Button 
              variant="ghost" 
              className="px-3" 
              onClick={resetFilters}
              disabled={!searchQuery && planFilter === "all" && statusFilter === "all"}
            >
              <Cross2Icon className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">Loading subscriptions...</div>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md border border-red-200">
              <h3 className="text-red-800 font-medium">Error loading subscriptions</h3>
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort("startDate")}
                      >
                        Start Date
                        {sortBy === "startDate" && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptionData?.subscriptions.map(subscription => (
                      <TableRow key={subscription.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={subscription.user.profileImage || undefined} />
                              <AvatarFallback className="bg-purple-100 text-purple-700">
                                {getInitials(subscription.user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{subscription.user.name || "Unnamed User"}</div>
                              <div className="text-xs text-gray-500">{subscription.user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className="capitalize"
                            style={{
                              backgroundColor: PLAN_COLORS[subscription.plan as keyof typeof PLAN_COLORS] + '30',
                              color: PLAN_COLORS[subscription.plan as keyof typeof PLAN_COLORS],
                              borderColor: PLAN_COLORS[subscription.plan as keyof typeof PLAN_COLORS]
                            }}
                          >
                            {subscription.plan}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={subscription.status === "active" ? "default" : "outline"}
                            className={subscription.status === "active" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                          >
                            {subscription.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(subscription.startDate)}</TableCell>
                        <TableCell>{formatDate(subscription.endDate)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-purple-600 h-2.5 rounded-full" 
                                style={{ 
                                  width: `${Math.min(100, (subscription.minutesUsed / subscription.minutesAllowed) * 100)}%` 
                                }}
                              />
                            </div>
                            <span className="text-xs whitespace-nowrap">
                              {subscription.minutesUsed} / {subscription.minutesAllowed} min
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" asChild className="mr-2">
                            <Link href={`/admin/subscriptions/${subscription.id}`}>
                              View
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {subscriptionData?.subscriptions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No subscriptions found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {subscriptionData && subscriptionData.pagination.totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className="cursor-pointer"
                          aria-disabled={currentPage === 1}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: subscriptionData.pagination.totalPages }).map((_, i) => {
                        // Show first, last, and pages around current
                        const page = i + 1;
                        const showPage = 
                          page === 1 || 
                          page === subscriptionData.pagination.totalPages || 
                          Math.abs(page - currentPage) <= 1;
                          
                        if (!showPage) {
                          // Show ellipsis for skipped pages, but only once
                          if (
                            (i === 1 && currentPage > 3) ||
                            (i === subscriptionData.pagination.totalPages - 2 && currentPage < subscriptionData.pagination.totalPages - 2)
                          ) {
                            return (
                              <PaginationItem key={`ellipsis-${i}`}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          return null;
                        }
                          
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              isActive={page === currentPage}
                              onClick={() => setCurrentPage(page)}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(p => Math.min(subscriptionData.pagination.totalPages, p + 1))}
                          className="cursor-pointer"
                          aria-disabled={currentPage === subscriptionData.pagination.totalPages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 