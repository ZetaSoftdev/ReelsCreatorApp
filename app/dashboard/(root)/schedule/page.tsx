"use client";

import { useEffect, useState } from "react";
import HomeHeader from "@/components/HomeHeader";
import { Calendar, Clock, Edit, Plus, Trash2, Video } from "lucide-react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";

interface ScheduledVideo {
  id: string;
  title: string;
  platform: string;
  scheduledFor: Date;
  thumbnail: string;
  status: 'scheduled' | 'published' | 'failed';
}

export default function SchedulePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [scheduledVideos, setScheduledVideos] = useState<ScheduledVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Mock data for scheduled videos
  useEffect(() => {
    // This would normally be an API call to fetch scheduled videos
    const mockData: ScheduledVideo[] = [
      {
        id: "1",
        title: "Top 10 Travel Tips for Europe",
        platform: "YouTube",
        scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        thumbnail: "https://images.unsplash.com/photo-1519677100203-a0e668c92439?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        status: "scheduled"
      },
      {
        id: "2",
        title: "5-Minute Workout for Busy People",
        platform: "Instagram",
        scheduledFor: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
        thumbnail: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        status: "scheduled"
      },
      {
        id: "3",
        title: "Easy Dinner Recipes for Beginners",
        platform: "TikTok",
        scheduledFor: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        thumbnail: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        status: "published"
      }
    ];
    
    setScheduledVideos(mockData);
    setIsLoading(false);
  }, []);

  const handleDeleteSchedule = (id: string) => {
    // Mock deletion
    setScheduledVideos(prev => prev.filter(video => video.id !== id));
    toast({
      title: "Video unscheduled",
      description: "The video has been removed from the schedule.",
    });
  };

  const handleEditSchedule = (id: string) => {
    // This would navigate to an edit page
    toast({
      title: "Coming soon",
      description: "Edit functionality will be available soon.",
    });
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Display loading state or redirect if not authenticated
  if (status === "loading" || isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (status === "unauthenticated") {
    return null; // useEffect will handle redirect
  }

  return (
    <>
      <HomeHeader pageName="Schedule" />
      <div className="p-6 w-full flex justify-center items-center h-screen mx-auto">
        <p>Coming soon...</p>
      </div>

      {/* <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Video Schedule</h1>
          <button className="inline-flex items-center bg-[#1a1a1a] text-white px-3 py-1 rounded-full hover:bg-[#343434] transition-colors">
            <Plus size={20} className="mr-1" />
            <span className="whitespace-nowrap">New Schedule</span>
          </button>
        </div>
        
        {scheduledVideos.length === 0 ? (
          <div className="text-center py-20 bg-lightGray rounded-lg border border-gray-200">
            <Video className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No scheduled videos</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by scheduling your first video.</p>
            <div className="mt-6">
              <button className="inline-flex items-center bg-[#1a1a1a] px-3 py-1 text-sm font-medium text-white hover:bg-[#343434] rounded-full transition-colors">
                <Plus className="mr-1 h-5 w-5" aria-hidden="true" />
                <span>Schedule a Video</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scheduledVideos.map((video) => (
              <div 
                key={video.id} 
                className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-200 hover:shadow-lg transition-all"
              >
                <div className="relative h-40 bg-gray-200">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-xs font-medium">
                    {video.platform}
                  </div>
                  <div className={`absolute bottom-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${
                    video.status === 'published' ? 'bg-green-100 text-green-800' : 
                    video.status === 'failed' ? 'bg-red-100 text-red-800' : 
                    video.status === 'scheduled' ? 'bg-green-300 text-yellow-800' : ''
                  }`}>
                    {video.status.charAt(0).toUpperCase() + video.status.slice(1)}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-1">{video.title}</h3>
                  
                  <div className="flex items-center text-gray-500 mb-3">
                    <Calendar size={16} className="mr-1" />
                    <span className="text-sm">{formatDate(video.scheduledFor)}</span>
                  </div>
                  
                  <div className="flex justify-end space-x-2 mt-4">
                    <button 
                      onClick={() => handleEditSchedule(video.id)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteSchedule(video.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-10 bg-gradient-to-r from-purple-500 to-blue-500 p-8 rounded-lg text-white">
          <h2 className="text-2xl font-bold mb-4">Maximize Your Reach</h2>
          <p className="mb-6">
            Schedule your videos to be published at optimal times across multiple platforms to reach your audience when they're most active.
          </p>
          <button className="bg-white text-purple-600 hover:bg-gray-100 transition-colors px-6 py-2 rounded-full font-medium">
            Learn More
          </button>
        </div>
      </div> */}
    </>
  );
} 