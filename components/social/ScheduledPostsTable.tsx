import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FaYoutube, FaTiktok, FaInstagram, FaFacebook, FaExternalLinkAlt, FaTrash, FaEdit, FaRedo, FaEye } from 'react-icons/fa';
import { Loader2, Calendar, Clock, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ScheduledPost {
  id: string;
  caption: string;
  hashtags: string[];
  scheduledFor: string;
  status: 'SCHEDULED' | 'PROCESSING' | 'PUBLISHED' | 'FAILED';
  postUrl?: string;
  failureReason?: string;
  socialAccount: {
    platform: 'YOUTUBE' | 'TIKTOK' | 'INSTAGRAM' | 'FACEBOOK' | 'TWITTER';
    accountName: string;
  };
  video: {
    title: string;
    filePath: string;
    duration: number;
  };
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ScheduledPostsTableProps {
  filter?: string;
  className?: string;
}

export default function ScheduledPostsTable({ filter, className }: ScheduledPostsTableProps) {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(filter);

  // Fetch scheduled posts
  const fetchPosts = async (page = 1, status = statusFilter) => {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });
      
      if (status) {
        params.append('status', status);
      }
      
      const response = await fetch(`/api/social/schedule?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch scheduled posts');
      }
      
      const data = await response.json();
      setPosts(data.scheduledPosts || []);
      setPagination(data.pagination);
      
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your scheduled posts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(pagination.page, statusFilter);
  }, [pagination.page, statusFilter]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value === 'ALL' ? undefined : value);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page when filter changes
  };

  const handleDeletePost = async (postId: string) => {
    try {
      setIsDeleting(postId);
      
      const response = await fetch(`/api/social/schedule/${postId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete scheduled post');
      }
      
      // Remove the deleted post from the state
      setPosts(prev => prev.filter(post => post.id !== postId));
      
      toast({
        title: 'Success',
        description: 'Post deleted successfully',
      });
      
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the post',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleRetryPost = async (postId: string) => {
    try {
      setIsProcessing(postId);
      
      const response = await fetch(`/api/social/schedule/${postId}/retry`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to retry publishing post');
      }
      
      // Refresh the posts to show updated status
      fetchPosts(pagination.page, statusFilter);
      
      toast({
        title: 'Success',
        description: 'Publishing retry initiated',
      });
      
    } catch (error) {
      console.error('Error retrying post:', error);
      toast({
        title: 'Error',
        description: 'Failed to retry publishing',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const formatScheduledTime = (dateString: string) => {
    const date = new Date(dateString);
    return (
      <div className="flex flex-col">
        <span className="flex items-center">
          <Calendar className="h-3.5 w-3.5 mr-1" /> 
          {format(date, 'MMM d, yyyy')}
        </span>
        <span className="flex items-center text-gray-500 mt-1">
          <Clock className="h-3.5 w-3.5 mr-1" /> 
          {format(date, 'h:mm a')}
        </span>
      </div>
    );
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'YOUTUBE':
        return <FaYoutube className="text-red-600 text-lg" />;
      case 'TIKTOK':
        return <FaTiktok className="text-black text-lg" />;
      case 'INSTAGRAM':
        return <FaInstagram className="text-pink-600 text-lg" />;
      case 'FACEBOOK':
        return <FaFacebook className="text-blue-600 text-lg" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">Scheduled</Badge>;
      case 'PROCESSING':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50">Processing</Badge>;
      case 'PUBLISHED':
        return <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">Published</Badge>;
      case 'FAILED':
        return <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
        <span className="ml-3">Loading posts...</span>
      </div>
    );
  }

  const getEmptyStateMessage = () => {
    if (statusFilter === undefined) return "You don't have any social media posts yet";
    if (statusFilter === 'PUBLISHED') return "You don't have any published videos yet";
    if (statusFilter === 'SCHEDULED') return "You haven't scheduled any posts yet";
    if (statusFilter === 'FAILED') return "You don't have any failed posts";
    return "No posts found with the current filter";
  };

  if (posts.length === 0) {
    return (
      <div className="text-center py-10 border rounded-md">
        <h3 className="text-lg font-medium mb-2">No Posts Found</h3>
        <p className="text-gray-500 mb-4">
          {getEmptyStateMessage()}
        </p>
        {!filter && (
          <div className="mb-4 flex justify-center">
            <Select value={statusFilter || 'ALL'} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Posts</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {!filter && (
        <div className="mb-4 flex justify-end">
          <Select value={statusFilter || 'ALL'} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Posts</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <Table>
        <TableCaption>
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-4 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <span className="px-3 py-2 text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Platform</TableHead>
            <TableHead>Video</TableHead>
            <TableHead>Caption</TableHead>
            <TableHead>{statusFilter === 'PUBLISHED' ? 'Published On' : 'Scheduled For'}</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => (
            <TableRow key={post.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getPlatformIcon(post.socialAccount.platform)}
                  <span>{post.socialAccount.accountName}</span>
                </div>
              </TableCell>
              <TableCell className="font-medium truncate max-w-[180px]" title={post.video.title}>
                {post.video.title}
              </TableCell>
              <TableCell className="truncate max-w-[180px]" title={post.caption}>
                <div>
                  <div className="truncate">{post.caption}</div>
                  {post.hashtags.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {post.hashtags.map(tag => `#${tag}`).join(' ')}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>{formatScheduledTime(post.scheduledFor)}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {getStatusBadge(post.status)}
                  {post.failureReason && (
                    <div className="text-xs text-red-500 mt-1" title={post.failureReason}>
                      {post.failureReason.length > 30 
                        ? `${post.failureReason.substring(0, 30)}...` 
                        : post.failureReason}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  {/* View on social media button for published posts */}
                  {post.postUrl && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => window.open(post.postUrl, '_blank')}
                      title="View on social media"
                    >
                      <FaExternalLinkAlt className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {/* Preview video button */}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => window.open(`/api/videos/preview/${post.video.filePath.split('/').pop()}`, '_blank')}
                    title="Preview video"
                  >
                    <FaEye className="h-4 w-4" />
                  </Button>
                  
                  {/* Retry button for failed posts */}
                  {post.status === 'FAILED' && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      disabled={isProcessing === post.id}
                      onClick={() => handleRetryPost(post.id)}
                      title="Retry publishing"
                    >
                      {isProcessing === post.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FaRedo className="h-4 w-4 text-yellow-500" />
                      )}
                    </Button>
                  )}
                  
                  {/* Delete button for scheduled posts */}
                  {post.status === 'SCHEDULED' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          disabled={isDeleting === post.id}
                          title="Delete scheduled post"
                        >
                          {isDeleting === post.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FaTrash className="h-4 w-4 text-red-500" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Scheduled Post</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this scheduled post? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeletePost(post.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 