"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import Link from "next/link";

// Types for our data
interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: string;
  profileImage: string | null;
  subscription: {
    plan: string;
    status: string;
  } | null;
}

interface UserResponse {
  users: User[];
  pagination: {
    total: number;
    pageSize: number;
    currentPage: number;
    totalPages: number;
  };
  metadata: {
    usersByRole: {
      role: string;
      _count: {
        role: number;
      };
    }[];
    subscriptionStats: {
      status: string;
      _count: {
        status: number;
      };
    }[];
  };
}

// Generate initials from name
const getInitials = (name: string | null): string => {
  if (!name) return "U";
  
  const names = name.split(" ");
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

// Format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

export default function UsersPage() {
  // State for users and loading
  const [userData, setUserData] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  
  // Colors for the pie chart
  const COLORS = ['#8B5CF6', '#C4B5FD', '#EDE9FE', '#DDD6FE'];
  
  // Function to fetch users
  const fetchUsers = async () => {
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
      
      if (roleFilter && roleFilter !== "ALL") {
        params.append("role", roleFilter);
      }
      
      const response = await fetch(`/api/admin/users?${params}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      
      const data = await response.json();
      setUserData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch users when filters change
  useEffect(() => {
    fetchUsers();
  }, [currentPage, roleFilter, sortBy, sortOrder]);
  
  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    fetchUsers();
  };
  
  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setRoleFilter("ALL");
    setCurrentPage(1);
    setSortBy("createdAt");
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
  
  // Prepare data for role distribution chart
  const roleData = userData?.metadata.usersByRole.map(item => ({
    name: item.role,
    value: item._count.role
  })) || [];
  
  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-medium text-gray-800">User Management</h1>
        <Button className="bg-purple-600 hover:bg-purple-700" asChild>
          <Link href="/admin/users/new">
            <PlusIcon className="mr-2 h-4 w-4" />
            Add User
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* User Count Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {userData?.pagination.total || 0}
            </div>
          </CardContent>
        </Card>
        
        {/* Admin Count Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {userData?.metadata.usersByRole.find(r => r.role === "ADMIN")?._count.role || 0}
            </div>
          </CardContent>
        </Card>
        
        {/* Active Subscriptions Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {userData?.metadata.subscriptionStats.find(s => s.status === "active")?._count.status || 0}
            </div>
          </CardContent>
        </Card>
        
        {/* Inactive Subscriptions Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Inactive Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-500">
              {userData?.metadata.subscriptionStats.find(s => s.status !== "active")?._count.status || 0}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* User Table Card */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>User Directory</CardTitle>
            <CardDescription>Manage your platform users</CardDescription>
            
            {/* Filters */}
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search by name or email"
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                />
              </div>
              
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="USER">User</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={handleSearch}>
                Search
              </Button>
              
              <Button 
                variant="ghost" 
                className="px-3" 
                onClick={resetFilters}
                disabled={!searchQuery && roleFilter === "ALL"}
              >
                <Cross2Icon className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">Loading users...</div>
              </div>
            ) : error ? (
              <div className="bg-red-50 p-4 rounded-md border border-red-200">
                <h3 className="text-red-800 font-medium">Error loading users</h3>
                <p className="text-red-600">{error}</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort("email")}
                        >
                          Email
                          {sortBy === "email" && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort("createdAt")}
                        >
                          Joined
                          {sortBy === "createdAt" && (
                            <span className="ml-1">
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </TableHead>
                        <TableHead>Subscription</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userData?.users.map(user => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={user.profileImage || undefined} />
                                <AvatarFallback className="bg-purple-100 text-purple-700">
                                  {getInitials(user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{user.name || "Unnamed User"}</div>
                                <div className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === "ADMIN" ? "default" : "outline"}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(user.createdAt)}</TableCell>
                          <TableCell>
                            {user.subscription ? (
                              <Badge 
                                variant={user.subscription.status === "active" ? "default" : "outline"}
                                className={user.subscription.status === "active" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                              >
                                {user.subscription.plan} - {user.subscription.status}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-100">
                                No subscription
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/admin/users/${user.id}`}>
                                View
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {userData?.users.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            No users found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {userData && userData.pagination.totalPages > 1 && (
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
                        
                        {Array.from({ length: userData.pagination.totalPages }).map((_, i) => {
                          // Show first, last, and pages around current
                          const page = i + 1;
                          const showPage = 
                            page === 1 || 
                            page === userData.pagination.totalPages || 
                            Math.abs(page - currentPage) <= 1;
                            
                          if (!showPage) {
                            // Show ellipsis for skipped pages, but only once
                            if (
                              (i === 1 && currentPage > 3) ||
                              (i === userData.pagination.totalPages - 2 && currentPage < userData.pagination.totalPages - 2)
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
                            onClick={() => setCurrentPage(p => Math.min(userData.pagination.totalPages, p + 1))}
                            className="cursor-pointer"
                            aria-disabled={currentPage === userData.pagination.totalPages}
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
        
        {/* User Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Role Distribution</CardTitle>
            <CardDescription>Breakdown of user roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              {roleData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {roleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [`${value} users`, 'Count']}
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
                <div className="text-gray-400">No role data available</div>
              )}
            </div>
            <div className="mt-4 space-y-2">
              {roleData.map((role, index) => (
                <div key={role.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span>{role.name}</span>
                  </div>
                  <span>{role.value} users</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 