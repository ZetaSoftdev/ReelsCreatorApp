"use client";

import { useEffect, useState } from "react";
import HomeHeader from "@/components/HomeHeader";
import { Calendar, Film, Plus, Settings, Trash2, Video, Play, Pause, Edit } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";

interface AutomatedSeries {
  id: string;
  title: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: string;
  timeOfDay: string;
  platform: string;
  thumbnailUrl: string;
  isActive: boolean;
  lastPublished?: Date;
  videosPublished: number;
}

export default function AutomatedSeriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [series, setSeries] = useState<AutomatedSeries[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Mock data for automated series
  useEffect(() => {
    // This would normally be an API call to fetch automated series
    const mockData: AutomatedSeries[] = [
      {
        id: "1",
        title: "Daily Tech Tips",
        description: "Short tech tips for everyday users",
        frequency: "daily",
        timeOfDay: "09:00 AM",
        platform: "TikTok",
        thumbnailUrl: "https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        isActive: true,
        lastPublished: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        videosPublished: 42
      },
      {
        id: "2",
        title: "Weekly Recipe Series",
        description: "Healthy recipes for busy professionals",
        frequency: "weekly",
        dayOfWeek: "Monday",
        timeOfDay: "05:00 PM",
        platform: "Instagram",
        thumbnailUrl: "https://images.unsplash.com/photo-1466637574441-749b8f19452f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        isActive: true,
        lastPublished: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        videosPublished: 12
      },
      {
        id: "3",
        title: "Monthly Book Reviews",
        description: "In-depth analysis of bestselling books",
        frequency: "monthly",
        dayOfWeek: "1st",
        timeOfDay: "12:00 PM",
        platform: "YouTube",
        thumbnailUrl: "https://images.unsplash.com/photo-1550399105-c4db5fb85c18?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        isActive: false,
        lastPublished: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        videosPublished: 6
      }
    ];
    
    setSeries(mockData);
    setIsLoading(false);
  }, []);

  const handleToggleActive = (id: string) => {
    setSeries(prev => prev.map(item => 
      item.id === id ? {...item, isActive: !item.isActive} : item
    ));
    
    const seriesItem = series.find(item => item.id === id);
    if (seriesItem) {
      toast({
        title: seriesItem.isActive ? "Series paused" : "Series activated",
        description: seriesItem.isActive 
          ? `"${seriesItem.title}" has been paused.` 
          : `"${seriesItem.title}" is now active.`,
      });
    }
  };

  const handleDelete = (id: string) => {
    const seriesItem = series.find(item => item.id === id);
    setSeries(prev => prev.filter(item => item.id !== id));
    
    if (seriesItem) {
      toast({
        title: "Series deleted",
        description: `"${seriesItem.title}" has been deleted.`,
      });
    }
  };

  const handleEdit = (id: string) => {
    toast({
      title: "Coming soon",
      description: "Edit functionality will be available soon.",
    });
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
      <HomeHeader pageName="Automated Series" />
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Automated Video Series</h1>
          <button className="inline-flex items-center bg-[#1a1a1a] text-white px-3 py-1 rounded-full hover:bg-[#343434] transition-colors">
            <Plus size={20} className="mr-1" />
            <span className="whitespace-nowrap">Create New Series</span>
          </button>
        </div>
        
        {series.length === 0 ? (
          <div className="text-center py-20 bg-lightGray rounded-lg border border-gray-200">
            <Film className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No automated series</h3>
            <p className="mt-1 text-sm text-gray-500">Create a series to automate your content publishing.</p>
            <div className="mt-6">
              <button className="inline-flex items-center bg-[#1a1a1a] px-3 py-1 text-sm font-medium text-white hover:bg-[#343434] rounded-full transition-colors">
                <Plus className="mr-1 h-5 w-5" aria-hidden="true" />
                <span>Create Series</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {series.map((item) => (
              <div 
                key={item.id} 
                className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-200 hover:shadow-lg transition-all"
              >
                <div className="md:flex">
                  <div className="md:w-1/4 h-48 md:h-auto bg-gray-200 relative">
                    <img 
                      src={item.thumbnailUrl} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-xs font-medium">
                      {item.platform}
                    </div>
                    <div className={`absolute bottom-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${
                      item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.isActive ? 'Active' : 'Paused'}
                    </div>
                  </div>
                  <div className="p-6 md:w-3/4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-xl mb-2">{item.title}</h3>
                        <p className="text-gray-600 mb-4">{item.description}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleToggleActive(item.id)}
                          className={`p-2 rounded-full transition-colors ${
                            item.isActive 
                              ? 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50' 
                              : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                          }`}
                        >
                          {item.isActive ? <Pause size={18} /> : <Play size={18} />}
                        </button>
                        <button 
                          onClick={() => handleEdit(item.id)}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-gray-500 mb-1">Frequency</p>
                        <p className="font-medium capitalize">
                          {item.frequency}
                          {item.dayOfWeek ? ` (${item.dayOfWeek})` : ''}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-gray-500 mb-1">Time</p>
                        <p className="font-medium">{item.timeOfDay}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-gray-500 mb-1">Last Published</p>
                        <p className="font-medium">
                          {item.lastPublished 
                            ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(item.lastPublished)
                            : 'Never'}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-gray-500 mb-1">Videos Published</p>
                        <p className="font-medium">{item.videosPublished}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-10 bg-gradient-to-r from-purple-500 to-blue-500 p-8 rounded-lg text-white">
          <h2 className="text-2xl font-bold mb-4">Set It and Forget It</h2>
          <p className="mb-6">
            Create automated series to publish content consistently without manual intervention. Perfect for regular shows, tutorials, or tips.
          </p>
          <button className="bg-white text-purple-600 hover:bg-gray-100 transition-colors px-6 py-2 rounded-full font-medium">
            Learn More
          </button>
        </div>
      </div>
    </>
  );
} 