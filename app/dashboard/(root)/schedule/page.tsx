'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import HomeHeader from '@/components/HomeHeader';
import { ChevronLeft, ChevronRight, Calendar, Search } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { MdPublish } from 'react-icons/md';
import PublishModal from '@/components/social/PublishModal';
import ScheduleModal from '@/components/social/ScheduleModal';

// Define types for our data
interface EditedVideo {
  id: string;
  title: string;
  filePath: string;
  duration: number;
  fileSize: number;
  editedAt: string;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function SchedulePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [editedVideos, setEditedVideos] = useState<EditedVideo[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 6,
    totalPages: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  
  // State for publish modal
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<EditedVideo | null>(null);

  // Function to fetch edited videos
  const fetchEditedVideos = async (page = 1, search = '') => {
    try {
      setIsLoading(true);

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });

      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/videos/edited?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch edited videos: ${response.status}`);
      }

      const data = await response.json();
      setEditedVideos(data.editedVideos || []);
      setPagination(data.pagination);

    } catch (error) {
      console.error('Error fetching edited videos:', error);
      toast({
        title: "Error Loading Videos",
        description: "Failed to load your edited videos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch videos on initial load
  useEffect(() => {
    fetchEditedVideos(pagination.page, searchTerm);
  }, [pagination.page]);

  // Handle search
  const handleSearch = () => {
    fetchEditedVideos(1, searchTerm);
  };

  // Function to format duration (seconds to MM:SS)
  const formatDuration = (durationInSeconds: number) => {
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = Math.floor(durationInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Pagination functions
  const goToNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    }
  };

  const goToPreviousPage = () => {
    if (pagination.page > 1) {
      setPagination(prev => ({ ...prev, page: prev.page - 1 }));
    }
  };
  
  // Handle opening the publish modal
  const handleOpenPublishModal = (video: EditedVideo) => {
    setSelectedVideo(video);
    setPublishModalOpen(true);
  };
  
  // Handle opening the schedule modal
  const handleOpenScheduleModal = (video: EditedVideo) => {
    setSelectedVideo(video);
    setScheduleModalOpen(true);
  };
  
  // Handle closing the publish modal
  const handleClosePublishModal = () => {
    setPublishModalOpen(false);
    setSelectedVideo(null);
  };
  
  // Handle closing the schedule modal
  const handleCloseScheduleModal = () => {
    setScheduleModalOpen(false);
    setSelectedVideo(null);
  };
  
  // Handle successful publishing or scheduling
  const handleActionComplete = (success: boolean) => {
    if (success) {
      // Optionally refresh the video list
      fetchEditedVideos(pagination.page, searchTerm);
    }
  };

  return (
    <>
      <HomeHeader pageName="Schedule & Publish" />
      <div className="p-6">
        <div className="mx-auto">
          <h2 className="text-4xl font-medium mb-4">Choose a short to Post</h2>

          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={20} className="absolute top-3 left-3 text-gray-500" />
              <Input
                placeholder="Search shorts by name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 focus-visible:border-yellow border-gray-400 transition-shadow py-6 text-lg"
                type="text"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button
              onClick={handleSearch}
              className="bg-purple-600 hover:bg-purple-700 text-white py-6 px-6"
            >
              Search
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center mt-20">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="ml-3 text-gray-700">Loading videos...</p>
            </div>
          ) : editedVideos.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
                {editedVideos.map((video) => (
                  <div key={video.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="relative">
                      {/* Video preview */}
                      <div className="relative aspect-[9/16] bg-black">
                        <video
                          className="w-full h-full object-cover"
                          controls
                          src={video.filePath}
                        />
                      </div>

                      {/* Duration badge */}
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {formatDuration(video.duration)}
                      </div>
                    </div>

                    <div className="p-3">
                      <h3 className="font-medium text-gray-800 line-clamp-1">{video.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Edited on {new Date(video.editedAt).toLocaleString()}
                      </p>

                      <div className="flex justify-between items-center mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 text-xs p-1"
                          onClick={() => handleOpenScheduleModal(video)}
                        >
                          <Calendar size={14} />
                          Schedule
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 text-xs p-1"
                          onClick={() => handleOpenPublishModal(video)}
                        >
                          <MdPublish size={14} />
                          Publish
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center mt-8 gap-4">
                  <button
                    onClick={goToPreviousPage}
                    disabled={pagination.page === 1}
                    className={`p-2 rounded-md border ${pagination.page === 1 ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <span className="text-sm font-medium">{pagination.page} of {pagination.totalPages}</span>

                  <button
                    onClick={goToNextPage}
                    disabled={pagination.page === pagination.totalPages}
                    className={`p-2 rounded-md border ${pagination.page === pagination.totalPages ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                  >
                    <ChevronRight size={18} />
                  </button>

                  <span className="text-sm text-gray-500">Videos per page: <span className="font-medium">{pagination.limit}</span></span>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 text-lg mt-40 font-medium">
              No shorts available to Post
            </div>
          )}
        </div>
      </div>
      
      {/* Publish Modal */}
      {selectedVideo && (
        <>
          <PublishModal 
            isOpen={publishModalOpen}
            onClose={handleClosePublishModal}
            videoId={selectedVideo.id}
            videoTitle={selectedVideo.title}
            onPublish={handleActionComplete}
          />
          
          <ScheduleModal
            isOpen={scheduleModalOpen}
            onClose={handleCloseScheduleModal}
            videoId={selectedVideo.id}
            videoTitle={selectedVideo.title}
            onSchedule={handleActionComplete}
          />
        </>
      )}
    </>
  );
}
