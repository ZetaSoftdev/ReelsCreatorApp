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
import { Cross2Icon, MagnifyingGlassIcon, TrashIcon } from "@radix-ui/react-icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts";
import Link from "next/link";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FileVideo, HardDrive, Clock, CheckCircle, AlertCircle, Hourglass, Loader2 } from "lucide-react";

// Types for video data
interface Video {
  id: string;
  title: string;
  filename: string;
  fileSize: number;
  duration: number | null;
  url: string | null;
  thumbnailUrl: string | null;
  status: string;
  uploadedAt: string;
  processedAt: string | null;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    profileImage: string | null;
  };
}

interface VideoResponse {
  videos: Video[];
  pagination: {
    total: number;
    pageSize: number;
    currentPage: number;
    totalPages: number;
  };
  metadata: {
    videosByStatus: {
      status: string;
      _count: {
        status: number;
      };
    }[];
    storageUsed: number;
    avgProcessingTime: number;
    videoUploadTrend: {
      date: string;
      count: number;
    }[];
  };
}

// Helper functions
const formatDate = (dateString: string | null): string => {
  if (!dateString) return "N/A";
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};

const formatTime = (seconds: number): string => {
  if (!seconds) return "0:00";
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Generate initials from name
const getInitials = (name: string | null): string => {
  if (!name) return "U";
  
  const names = name.split(" ");
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

// Status colors and icons
const statusConfig: Record<string, { color: string, icon: React.ReactNode }> = {
  'pending': { 
    color: '#F59E0B', 
    icon: <Hourglass className="h-4 w-4" /> 
  },
  'processing': { 
    color: '#8B5CF6', 
    icon: <Loader2 className="h-4 w-4 animate-spin" /> 
  },
  'completed': { 
    color: '#10B981', 
    icon: <CheckCircle className="h-4 w-4" /> 
  },
  'failed': { 
    color: '#EF4444', 
    icon: <AlertCircle className="h-4 w-4" /> 
  }
};

export default function ContentPage() {
  // State for videos and loading
  const [videoData, setVideoData] = useState<VideoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState<string | null>(null);
  
  // State for filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("uploadedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  
  // Function to fetch videos
  const fetchVideos = async () => {
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
      
      if (statusFilter && statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      
      const response = await fetch(`/api/admin/videos?${params}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch videos");
      }
      
      const data = await response.json();
      setVideoData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch videos when filters change
  useEffect(() => {
    fetchVideos();
  }, [currentPage, statusFilter, sortBy, sortOrder]);
  
  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    fetchVideos();
  };
  
  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCurrentPage(1);
    setSortBy("uploadedAt");
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
  
  // Handle delete video
  const handleDeleteVideo = async (id: string) => {
    setDeleteLoading(id);
    try {
      const response = await fetch(`/api/admin/videos?id=${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete video");
      }
      
      // Refresh the videos list
      fetchVideos();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleteLoading(null);
    }
  };
  
  // Handle update video status
  const handleUpdateStatus = async (id: string, status: string) => {
    setStatusUpdateLoading(id);
    try {
      const response = await fetch('/api/admin/videos', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, status })
      });
      
      if (!response.ok) {
        throw new Error("Failed to update video status");
      }
      
      // Refresh the videos list
      fetchVideos();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setStatusUpdateLoading(null);
    }
  };
  
  // Format upload trend data for chart
  const uploadTrendData = videoData?.metadata.videoUploadTrend?.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    uploads: parseInt(item.count)
  })) || [];
  
  // Format status data for chart
  const statusData = videoData?.metadata.videosByStatus.map(status => ({
    name: status.status.charAt(0).toUpperCase() + status.status.slice(1),
    count: status._count.status
  })) || [];
  
  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-medium text-gray-800">Content Management</h1>
        <Button className="bg-purple-600 hover:bg-purple-700">
          Upload New Video
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Videos Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <FileVideo className="h-5 w-5 mr-2 text-purple-600" />
              Total Videos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {videoData?.pagination.total || 0}
            </div>
          </CardContent>
        </Card>
        
        {/* Storage Used Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <HardDrive className="h-5 w-5 mr-2 text-purple-600" />
              Storage Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {formatBytes(videoData?.metadata.storageUsed || 0)}
            </div>
          </CardContent>
        </Card>
        
        {/* Processing Time Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Clock className="h-5 w-5 mr-2 text-purple-600" />
              Avg. Processing Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {formatTime(videoData?.metadata.avgProcessingTime || 0)}
            </div>
          </CardContent>
        </Card>
        
        {/* Completed Videos Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {videoData?.metadata.videosByStatus.find(s => s.status === "completed")?._count.status || 0}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Video Upload Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Upload Trend</CardTitle>
            <CardDescription>Videos uploaded over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={uploadTrendData} margin={{ top: 5, right: 30, left: 20, bottom: 35 }}>
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
                    dataKey="uploads" 
                    name="Videos Uploaded" 
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
        
        {/* Video Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Distribution</CardTitle>
            <CardDescription>Videos by processing status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} layout="vertical" margin={{ top: 5, right: 30, left: 55, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fontSize: 12, fill: '#666' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #f0f0f0',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    name="Videos" 
                    fill="#8B5CF6"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Videos Table */}
      <Card>
        <CardHeader>
          <CardTitle>Video Library</CardTitle>
          <CardDescription>Manage uploaded videos</CardDescription>
          
          {/* Filters */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by title or filename"
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={handleSearch}>
              Search
            </Button>
            
            <Button 
              variant="ghost" 
              className="px-3" 
              onClick={resetFilters}
              disabled={!searchQuery && statusFilter === "all"}
            >
              <Cross2Icon className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">Loading videos...</div>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md border border-red-200">
              <h3 className="text-red-800 font-medium">Error loading videos</h3>
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Video</TableHead>
                      <TableHead>Uploader</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort("uploadedAt")}
                      >
                        Uploaded
                        {sortBy === "uploadedAt" && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {videoData?.videos.map(video => (
                      <TableRow key={video.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-8 bg-gray-100 rounded overflow-hidden relative">
                              {video.thumbnailUrl ? (
                                <img 
                                  src={video.thumbnailUrl} 
                                  alt={video.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <FileVideo className="h-4 w-4 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium line-clamp-1">{video.title || video.filename}</div>
                              <div className="text-xs text-gray-500 line-clamp-1">{video.filename}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={video.user.profileImage || undefined} />
                              <AvatarFallback className="text-xs bg-purple-100 text-purple-700">
                                {getInitials(video.user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{video.user.name || "Unnamed User"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Badge 
                              className="flex items-center gap-1 capitalize"
                              style={{
                                backgroundColor: `${statusConfig[video.status]?.color}20`,
                                color: statusConfig[video.status]?.color,
                                borderColor: `${statusConfig[video.status]?.color}40`
                              }}
                            >
                              {statusConfig[video.status]?.icon}
                              {video.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{formatBytes(video.fileSize)}</TableCell>
                        <TableCell>{video.duration ? formatTime(video.duration) : "N/A"}</TableCell>
                        <TableCell>{formatDate(video.uploadedAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {video.status !== "completed" && (
                              <Select
                                value={video.status}
                                onValueChange={(value) => handleUpdateStatus(video.id, value)}
                                disabled={statusUpdateLoading === video.id}
                              >
                                <SelectTrigger className="h-8 w-28">
                                  <SelectValue placeholder="Change status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="processing">Processing</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="failed">Failed</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-red-500 border-red-200 hover:bg-red-50"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Video</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{video.title || video.filename}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteVideo(video.id)}
                                    className="bg-red-500 text-white hover:bg-red-600"
                                    disabled={deleteLoading === video.id}
                                  >
                                    {deleteLoading === video.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : null}
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {videoData?.videos.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No videos found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {videoData && videoData.pagination.totalPages > 1 && (
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
                      
                      {Array.from({ length: videoData.pagination.totalPages }).map((_, i) => {
                        // Show first, last, and pages around current
                        const page = i + 1;
                        const showPage = 
                          page === 1 || 
                          page === videoData.pagination.totalPages || 
                          Math.abs(page - currentPage) <= 1;
                          
                        if (!showPage) {
                          // Show ellipsis for skipped pages, but only once
                          if (
                            (i === 1 && currentPage > 3) ||
                            (i === videoData.pagination.totalPages - 2 && currentPage < videoData.pagination.totalPages - 2)
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
                          onClick={() => setCurrentPage(p => Math.min(videoData.pagination.totalPages, p + 1))}
                          className="cursor-pointer"
                          aria-disabled={currentPage === videoData.pagination.totalPages}
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