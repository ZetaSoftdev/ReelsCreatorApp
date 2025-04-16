"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  MailIcon,
  ShieldCheck,
  UserCog,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { Role } from "@/lib/constants";
import { format } from "date-fns";

interface UserDetails {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
  profileImage: string | null;
  subscription: {
    id: string;
    plan: string;
    status: string;
    startDate: string;
    endDate: string | null;
    minutesAllowed: number;
    minutesUsed: number;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
  } | null;
  videos: {
    id: string;
    title: string;
    duration: number;
    status: string;
    uploadedAt: string;
  }[];
}

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchUserDetails();
  }, [userId]);
  
  // Fetch user details
  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("User not found");
        } else {
          throw new Error("Failed to fetch user details");
        }
      }
      
      const data = await response.json();
      setUser(data);
      setNewRole(data.role);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Update user role
  const updateUserRole = async () => {
    if (!user || newRole === user.role) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update user role");
      }
      
      // Update local user data
      setUser(prev => prev ? { ...prev, role: newRole } : null);
      setIsRoleDialogOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Delete user
  const deleteUser = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete user");
      }
      
      // Redirect to users list on success
      router.push("/admin/users");
      router.refresh();
    } catch (err: any) {
      setDeleteError(err.message);
      setIsDeleting(false);
    }
  };
  
  // Get initials from name
  const getInitials = (name: string | null): string => {
    if (!name) return "U";
    
    const names = name.split(" ");
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };
  
  // Format date
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "PPP");
  };
  
  // Format time ago
  const timeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    
    return Math.floor(seconds) + " seconds ago";
  };

  // Format minutes as hours and minutes
  const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };
  
  if (loading) {
    return (
      <div className="container py-10">
        <div className="flex items-center space-x-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-medium text-gray-800">Loading User Details...</h1>
        </div>
        
        <div className="grid gap-6">
          <Card className="animate-pulse bg-gray-100">
            <CardContent className="h-64" />
          </Card>
        </div>
      </div>
    );
  }
  
  if (error || !user) {
    return (
      <div className="container py-10">
        <div className="flex items-center space-x-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-medium text-gray-800">User Not Found</h1>
        </div>
        
        <Card>
          <CardContent className="py-10">
            <div className="flex flex-col items-center justify-center space-y-4">
              <AlertTriangle className="h-16 w-16 text-red-500" />
              <h2 className="text-xl font-semibold">{error || "Failed to load user details"}</h2>
              <Button onClick={() => router.back()}>
                Return to Users
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-10">
      {/* Header with back button */}
      <div className="flex items-center space-x-4 mb-8">
        <Button
          variant="outline"
          size="icon"
          asChild
        >
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-medium text-gray-800">User Details</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Profile Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.profileImage || undefined} />
                  <AvatarFallback className="bg-purple-100 text-purple-700 text-xl">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{user.name || "Unnamed User"}</CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <MailIcon className="h-4 w-4 mr-1" />
                    {user.email}
                  </CardDescription>
                </div>
              </div>
              <Badge 
                variant={user.role === Role.ADMIN ? "default" : "outline"}
                className="text-sm"
              >
                {user.role}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-medium mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">User ID</p>
                    <p className="font-mono text-sm">{user.id}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Account Created</p>
                    <p>{formatDate(user.createdAt)} ({timeAgo(user.createdAt)})</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p>{formatDate(user.updatedAt)} ({timeAgo(user.updatedAt)})</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Role</p>
                    <div className="flex items-center">
                      <p className="mr-2">{user.role}</p>
                      <AlertDialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Change Role
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Change User Role</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to change this user's role?
                              This will affect their permissions and access to the system.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          
                          <div className="my-4">
                            <Select value={newRole} onValueChange={setNewRole}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                                <SelectItem value="USER">User</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={updateUserRole}
                              disabled={isUpdating || newRole === user.role}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              {isUpdating ? "Updating..." : "Update Role"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Subscription Info */}
              <div>
                <h3 className="text-lg font-medium mb-3">Subscription Information</h3>
                {user.subscription ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Current Plan</p>
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2 text-purple-500" />
                        <p className="font-medium">{user.subscription.plan}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Status</p>
                      <div className="flex items-center">
                        {user.subscription.status === "active" ? (
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2 text-red-500" />
                        )}
                        <p className="capitalize">{user.subscription.status}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Start Date</p>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        <p>{formatDate(user.subscription.startDate)}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">End Date</p>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        <p>{user.subscription.endDate ? formatDate(user.subscription.endDate) : "No end date"}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Minutes Allowed</p>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-purple-500" />
                        <p>{formatMinutes(user.subscription.minutesAllowed)}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Minutes Used</p>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <p>
                          {formatMinutes(user.subscription.minutesUsed)}
                          <span className="text-gray-500 ml-1">
                            ({Math.round((user.subscription.minutesUsed / user.subscription.minutesAllowed) * 100)}%)
                          </span>
                        </p>
                      </div>
                    </div>
                    
                    {user.subscription.stripeCustomerId && (
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Stripe Customer ID</p>
                        <p className="font-mono text-sm">{user.subscription.stripeCustomerId}</p>
                      </div>
                    )}
                    
                    {user.subscription.stripeSubscriptionId && (
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500">Stripe Subscription ID</p>
                        <p className="font-mono text-sm">{user.subscription.stripeSubscriptionId}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <p className="text-gray-600">This user doesn't have an active subscription.</p>
                    <Button variant="outline" className="mt-3">
                      Add Subscription
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between border-t pt-6">
            <Button variant="outline" asChild>
              <Link href={`/admin/users/${userId}/edit`}>
                <UserCog className="h-4 w-4 mr-2" />
                Edit User
              </Link>
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  Delete User
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the user 
                    account and all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                
                {deleteError && (
                  <div className="bg-red-50 p-3 rounded-md border border-red-200 mb-4">
                    <p className="text-red-600 text-sm">{deleteError}</p>
                  </div>
                )}
                
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={deleteUser}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete User"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
        
        {/* Actions and Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage this user account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start bg-purple-600 hover:bg-purple-700">
              <ShieldCheck className="h-4 w-4 mr-2" />
              Manage Subscription
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <MailIcon className="h-4 w-4 mr-2" />
              Send Email
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="h-4 w-4 mr-2" />
              View Activity Log
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Videos Section */}
      {user.videos && user.videos.length > 0 && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Videos</CardTitle>
              <CardDescription>Videos uploaded by this user</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Uploaded
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {user.videos.map((video) => (
                      <tr key={video.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{video.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{formatMinutes(video.duration)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge 
                            variant={video.status === "completed" ? "default" : "outline"}
                            className={video.status === "completed" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                          >
                            {video.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{timeAgo(video.uploadedAt)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/videos/${video.id}`}>
                              View
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 