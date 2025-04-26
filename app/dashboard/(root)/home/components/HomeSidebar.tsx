"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { 
  ChevronDown, 
  UploadCloud, 
  HelpCircle, 
  FolderPlus, 
  Search, 
  Import, 
  X, 
  LayoutDashboard, 
  ChevronLeft, 
  ChevronRight,
  Download,
  Edit2
} from "lucide-react";
import { GrSchedule } from "react-icons/gr";
import HomeHeader from "@/components/HomeHeader";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Role } from "@/lib/constants";
import { 
  getVideoUrl, 
  getSubtitleUrl, 
  getWordTimestampsUrl,
  createVideoProcessingJob,
  getJobStatus,
  getJobDetails,
  cancelJob
} from "@/lib/api";

// API endpoint from environment variable
const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://reels-creator-alb-555953912.us-west-1.elb.amazonaws.com/api/v1';

// Helper function to ensure URLs are properly formatted with the API endpoint
const getFullUrl = (url: string): string => {
  if (!url) return '';
  // If the URL already starts with http:// or https://, return it as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // If it's a relative path starting with /api/v1, prepend the API endpoint base
  if (url.startsWith('/api/v1/')) {
    // Remove the /api/v1 prefix since API_ENDPOINT already includes it
    return `${API_ENDPOINT}${url.substring(7)}`;
  }
  // For other relative paths, just append to API_ENDPOINT
  return `${API_ENDPOINT}/${url.startsWith('/') ? url.substring(1) : url}`;
};

// Define result type interfaces
interface VideoResult {
  id: string;
  url: string;
  result_type: "video";
  metadata: {
    filename: string;
    start_time: number;
    end_time: number;
    duration: number;
    with_captions: boolean;
    has_srt: boolean;
    has_word_timestamps: boolean;
    title: string;
    reason?: string;
  };
  created_at: string;
}

interface SubtitleResult {
  id: string;
  url: string;
  result_type: "subtitles";
  metadata: {
    format: string;
    video_filename: string;
  };
  created_at: string;
}

interface WordTimestampsResult {
  id: string;
  url: string;
  result_type: "word_timestamps";
  metadata: {
    format: string;
    video_filename: string;
  };
  created_at: string;
}

type JobResult = VideoResult | SubtitleResult | WordTimestampsResult;

interface ProcessedClip {
  videoResult: VideoResult;
  subtitleResult?: SubtitleResult;
  wordTimestampsResult?: WordTimestampsResult;
}

export default function HomeSidebar() {
  const [videosOpen, setVideosOpen] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);
  const [popUpOpen, setPopUpOpen] = useState(false);
  const [importVideo, setImportVideo] = useState(false);
  const [youtubeLink, setYoutubeLink] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [processedClips, setProcessedClips] = useState<ProcessedClip[]>([]);
  const [clipsList, setClipsList] = useState<string[]>([]);
  const [subtitlesList, setSubtitlesList] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const clipsPerPage = 6;
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<number>(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [uploadedVideo, setUploadedVideo] = useState<{
    file: File | null;
    url: string;
    status: "processing" | "completed" | "failed" | null;
    name?: string;
    size?: number;
    progress?: number;
    error?: string | null;
  }>({ file: null, url: "", status: null, error: null });
  const router = useRouter();

  // Add user state to store session data
  const [user, setUser] = useState<{
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string;
    image?: string | null;
  } | null>(null);
  
  // Fetch session data from our API endpoint
  useEffect(() => {
    const fetchSession = async () => {
      try {
        // Add cache-busting parameter
        const response = await fetch(`/api/user/session?t=${Date.now()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch session');
        }
        
        const data = await response.json();
        setUser(data.user);
        
        // Set isAdmin based on the user role
        if (data.user?.role === Role.ADMIN) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      }
    };
    
    fetchSession();
  }, []);

  // Calculate total pages - updated to work with both new and old API responses
  const totalClipsCount = processedClips.length > 0 ? processedClips.length : clipsList.length;
  const totalPages = Math.ceil(totalClipsCount / clipsPerPage);
  
  // Get current clips - updated to work with both new and old API responses
  const indexOfLastClip = currentPage * clipsPerPage;
  const indexOfFirstClip = indexOfLastClip - clipsPerPage;
  const currentClips = clipsList.slice(indexOfFirstClip, indexOfLastClip);
  const currentProcessedClips = processedClips.slice(indexOfFirstClip, indexOfLastClip);
  
  // Change page
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const clearStorage = () => {
    localStorage.removeItem('clipsList');
    localStorage.removeItem('subtitlesList');
    localStorage.removeItem('processedClips');
    localStorage.removeItem('uploadedVideo');
    setClipsList([]);
    setSubtitlesList([]);
    setProcessedClips([]);
    setUploadedVideo({ file: null, url: "", status: null, error: null });
    setCurrentPage(1);
    setJobId(null);
    setJobProgress(0);
    
    // Clear any ongoing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Only load clip data from localStorage, not user data
  useEffect(() => {
    const savedClips = localStorage.getItem('clipsList');
    const savedSubtitles = localStorage.getItem('subtitlesList');
    const savedProcessedClips = localStorage.getItem('processedClips');
    const savedVideo = localStorage.getItem('uploadedVideo');
    
    if (savedClips) {
      try {
      setClipsList(JSON.parse(savedClips));
      } catch (e) {
        console.error("Error parsing saved clips:", e);
    }
    }
    
    if (savedSubtitles) {
      try {
      setSubtitlesList(JSON.parse(savedSubtitles));
      } catch (e) {
        console.error("Error parsing saved subtitles:", e);
      }
    }
    
    if (savedProcessedClips) {
      try {
        setProcessedClips(JSON.parse(savedProcessedClips));
      } catch (e) {
        console.error("Error parsing saved processed clips:", e);
      }
    }
    
    if (savedVideo) {
      try {
      const videoData = JSON.parse(savedVideo);
        if (videoData.url) {
      setUploadedVideo({
            file: null, // We can't restore the actual file object from localStorage
        url: videoData.url,
        status: videoData.status,
        name: videoData.name,
            size: videoData.size,
            progress: videoData.progress,
            error: null
      });
        }
      } catch (e) {
        console.error("Error parsing saved video:", e);
      }
    }
  }, []);

  // Save processed clips to localStorage when they change
  useEffect(() => {
    if (processedClips.length > 0) {
      localStorage.setItem('processedClips', JSON.stringify(processedClips));
    }
    
    if (clipsList.length > 0) {
      localStorage.setItem('clipsList', JSON.stringify(clipsList));
    }
    
    if (subtitlesList.length > 0) {
      localStorage.setItem('subtitlesList', JSON.stringify(subtitlesList));
    }
  }, [clipsList, subtitlesList, processedClips]);

  useEffect(() => {
    if (uploadedVideo.url) {
      const videoData = {
        url: uploadedVideo.url,
        status: uploadedVideo.status,
        name: uploadedVideo.file?.name,
        size: uploadedVideo.file?.size,
        progress: uploadedVideo.progress
      };
      localStorage.setItem('uploadedVideo', JSON.stringify(videoData));
    }
  }, [uploadedVideo]);

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Fetch job details when complete
  const fetchJobDetails = async (id: string) => {
    try {
      const response = await getJobDetails(id);
      
      // Check if the response is OK
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Job details error:", errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const detailsData = await response.json();
      console.log("Job details:", detailsData);
      
      // Check if job failed
      if (detailsData.status === "failed") {
        const errorMessage = detailsData.error || detailsData.detail || "Job processing failed";
        console.error("Job failed:", errorMessage);
        setUploadedVideo(prev => ({ 
          ...prev, 
          status: "failed",
          error: `Processing failed: ${errorMessage}`
        }));
        setIsUploading(false);
        return;
      }
      
      if (detailsData.status === "completed" && Array.isArray(detailsData.results)) {
        // Process results
        const videoResults = detailsData.results.filter(
          (result: JobResult) => result.result_type === "video"
        ) as VideoResult[];
        
        const subtitleResults = detailsData.results.filter(
          (result: JobResult) => result.result_type === "subtitles"
        ) as SubtitleResult[];
        
        const wordTimestampResults = detailsData.results.filter(
          (result: JobResult) => result.result_type === "word_timestamps"
        ) as WordTimestampsResult[];
        
        console.log("Video results:", videoResults);
        console.log("Subtitle results:", subtitleResults);
        console.log("Word timestamp results:", wordTimestampResults);
        
        // Check if we have any video results
        if (videoResults.length === 0) {
          throw new Error("No video results were generated");
        }
        
        // Group related items together
        const processedClips: ProcessedClip[] = videoResults.map(videoResult => {
          const videoFilename = videoResult.metadata.filename;
          
          // Find matching subtitle and word timestamp files
          const subtitleResult = subtitleResults.find(
            s => s.metadata.video_filename === videoFilename
          );
          
          const wordTimestampsResult = wordTimestampResults.find(
            w => w.metadata.video_filename === videoFilename
          );
          
          return {
            videoResult,
            subtitleResult,
            wordTimestampsResult
          };
        });
        
        console.log("Processed clips:", processedClips);
        
        // Update state with processed results
        setProcessedClips(processedClips);
        setUploadedVideo(prev => ({ ...prev, status: "completed" }));
        
        // Also maintain backward compatibility with old format
        const clipFilenames = videoResults.map(v => v.metadata.filename);
        const subtitleFilenames = subtitleResults.map(s => s.metadata.video_filename);
        
        setClipsList(clipFilenames);
        setSubtitlesList(subtitleFilenames);
        
        // Set progress to 100% when complete
        setJobProgress(100);
        setUploadStatus("Processing complete!");
      } else {
        console.error("Invalid job details response:", detailsData);
        setUploadedVideo(prev => ({ 
          ...prev, 
          status: "failed",
          error: "Failed to process video: Invalid result format" 
        }));
      }
    } catch (error: any) {
      console.error("Error fetching job details:", error);
      setUploadedVideo(prev => ({ 
        ...prev, 
        status: "failed",
        error: error.message || "Failed to retrieve processing results" 
      }));
    } finally {
      setIsUploading(false);
    }
  };

  // Poll for job status updates
  useEffect(() => {
    if (!jobId) return;
    
    console.log('Starting job polling for ID:', jobId);
    
    // Set initial progress
    setJobProgress(40);
    
    // This function is called every 5 seconds to check job status
    const intervalId = setInterval(async () => {
      if (!jobId) {
        clearInterval(intervalId);
        return;
      }
      
      try {
        console.log('Polling job status for ID:', jobId);
        const response = await getJobStatus(jobId);
        
        // Check if the response is OK
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Job status error:", errorText);
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Job status:', data);
        
        // Update progress bar - ensure we show at least 40% progress even if the API doesn't return a progress value
        if (data.progress && typeof data.progress === 'number') {
          setJobProgress(Math.max(40, data.progress));
        } else if (data.status === 'processing') {
          // If no progress but still processing, increment progress slightly
          setJobProgress(prev => Math.min(prev + 5, 90)); // Increment but cap at 90%
        }
        
        // Update status message
        if (data.status_message) {
          setUploadStatus(data.status_message);
        } else {
          setUploadStatus(`Processing job: ${data.status}`);
        }
        
        if (data.status === 'completed') {
          console.log('Job completed, fetching details');
          clearInterval(intervalId);
          await fetchJobDetails(jobId);
        } else if (data.status === 'failed') {
          console.error('Job failed:', data);
          clearInterval(intervalId);
          
          const errorMessage = data.error || data.detail || "Unknown error";
          setUploadedVideo(prev => ({ 
            ...prev, 
            status: "failed",
            error: `Processing failed: ${errorMessage}`
          }));
          setIsUploading(false);
        }
      } catch (error: any) {
        console.error("Error polling job status:", error);
        // Show the error but don't stop polling on temporary network errors
        setUploadStatus(`Checking status... (${error.message || "Network error"})`);
      }
    }, 5000); // Poll every 5 seconds
    
    // Save the interval reference for cleanup
    pollingIntervalRef.current = intervalId;
    
    // Cleanup interval on unmount or when jobId changes
    return () => {
      clearInterval(intervalId);
      pollingIntervalRef.current = null;
    };
  }, [jobId]);

  // Handle YouTube link import
  const handleImportYoutube = () => {
    if (youtubeLink.trim() !== "") {
      router.push(`/dashboard/(editor)/edit?video=${encodeURIComponent(youtubeLink)}`);
    }
  };

  // Upload video to backend API
  const uploadVideo = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    
    // Create preview URL for the file
    const preview = URL.createObjectURL(file);
    
    setImportVideo(false);
    setUploadedVideo({ 
      file, 
      url: preview, 
      status: "processing",
      name: file.name,
      size: file.size,
      progress: 0,
      error: null
    });
    setVideosOpen(true);
    
    // Set initial progress and status message
    setJobProgress(10);
    setUploadStatus("Uploading video for processing...");
    
    try {
      console.log("Creating video processing job");
      const response = await createVideoProcessingJob(file, 3);
      
      // Set progress after request is sent
      setJobProgress(30);
      setUploadStatus("Video uploaded, starting job...");
      
      // Check if the request itself failed
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error:", errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("API Response:", data);

      // Check if the response contains an error
      if (data.error || data.detail) {
        const errorMessage = data.error || data.detail || "Unknown error";
        console.error("API error:", errorMessage);
        
        // Update UI with error
        setUploadedVideo(prev => ({ 
          ...prev, 
          status: "failed",
          error: `Processing error: ${errorMessage}`
        }));
        setIsUploading(false);
        return;
      }
      
      // Handle successful job creation response
      if (data.job_id) {
        // Set job ID to start polling
        setJobId(data.job_id);
        // Update status message with the estimated time
        const estimatedTime = data.estimated_completion_time || 60;
        setUploadStatus(`Processing started. Estimated time: ${Math.round(estimatedTime)} seconds`);
        // Set initial progress
        setJobProgress(40);
      } else {
        throw new Error("Invalid API response: No job_id returned");
      }
    } catch (error: any) {
      console.error("Error:", error);
      
      setUploadedVideo(prev => ({ 
        ...prev, 
        status: "failed",
        error: error.message || "Upload failed. Please try again."
      }));
      setIsUploading(false);
    }
  };

  // Handle job cancellation
  const handleCancelJob = async () => {
    // If we have a job ID, try to cancel it on the server
    if (jobId) {
      try {
        console.log("Cancelling job:", jobId);
        
        // Stop polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        // Call API to cancel the job
        const response = await cancelJob(jobId);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Job cancellation error:", errorText);
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        // Check response
        const data = await response.json();
        console.log("Cancellation response:", data);
        
        // Reset state
        setUploadedVideo(prev => ({ 
          ...prev, 
          status: null,
          error: "Processing cancelled by user"
        }));
        setJobId(null);
        setJobProgress(0);
        setIsUploading(false);
      } catch (error: any) {
        console.error("Error cancelling job:", error);
        setUploadedVideo(prev => ({ 
          ...prev, 
          status: "failed",
          error: `Failed to cancel: ${error.message || "Unknown error"}`
        }));
        setIsUploading(false);
      }
    } else {
      // No job ID, just clean up the UI
      console.log("Cancelling video processing (no server job)");
      
      // Reset state
      setUploadedVideo(prev => ({ 
        ...prev, 
        status: null,
        error: "Processing cancelled by user"
      }));
      setJobId(null);
      setJobProgress(0);
      setIsUploading(false);
    }
  };

  // Handle File Drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      uploadVideo(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "video/*": [] },
    multiple: false,
  });

  const createBtns = [
    {
      image: <img src="/short_to_short.webp" alt="Short to Short" className="w-40 mx-auto" />,
      altText: "Short to Short",
      label: "Subtitle and edit my Short",
      onClickHandler: () => {}
    },
    {
      image: <img src="/video_to_short.webp" alt="Short to Short" className="w-40 mx-auto" />,
      altText: "Video to Short",
      label: "Long videos to Short",
      onClickHandler: () => setImportVideo(true)
    },
    {
      image: <img src="/faceless.webp" alt="Short to Short" className="h-32 -mt-1 mx-auto rounded-md" />,
      altText: "Faceless Short",
      label: "Create Faceless video",
      onClickHandler: () => {}
    },
  ];

  const ErrorDisplay = ({error}: {error: string | null | undefined}) => {
    if (!error) return null;
    
    return (
      <div className="mt-2 p-3 bg-red-100 text-red-700 rounded-md">
        <p className="text-sm font-medium flex items-start">
          <span className="mr-2">⚠️</span>
          <span>{error}</span>
        </p>
      </div>
    );
  };

  // Rest of the component is UI rendering
  return (
    <div className="">
      <HomeHeader pageName={"Home"}/>

      <main className="p-10 w-full bg-bgWhite">
        <div className="">
          <div className="bg-yellow px-14 py-7 text-center rounded-3xl">
            <h6 className="text-4xl font-semibold">What do you want to create today?</h6>
            <p className="text-black font-semibold pt-3 pb-12 mt-2">Import/upload a long-form video and let AI take care of the rest. Or upload an existing Short for AI editing!</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mx-auto gap-1 -mt-10 px-0 sm:px-7">
            {createBtns.map((btn, index) => (
              <div key={index} className="relative text-center overflow-hidden" >
              <motion.button
                whileHover={{ scale: 1.05 }}
                  onClick={btn.onClickHandler}
                className="relative px-10 py-1 bg-bgWhite rounded-lg shadow-lg shadow-gray-700/10 border text-center cursor-pointer overflow-hidden h-36 w-64"
              >
                <motion.p
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  className="absolute top-0 left-0 right-0 bottom-0 bg-yellow bg-opacity-85 flex items-center justify-center text-gray-900 font-semibold text-lg"
                >
                  Start
                </motion.p>
              {btn.image}
              </motion.button>

              <p className="mt-4">{btn.label}</p>
            </div>
            ))}
          </div>
        </div>

        <hr className="my-6 border-gray-300" />

        <div className="">
          <div className="flex items-center justify-between mt-4">
            <div>
              <h6 className="text-lg font-medium">My Shorts</h6>
              <p className="text-sm mt-1">These are shorts created from your imported videos (section below).</p>
            </div>

            <div className="flex gap-3">
              <div className="relative">
                <Search size={18} className="absolute top-2 text-gray-500 left-2" />
                <input type="text" placeholder="Search" className="w-full p-1 pl-8 border rounded-md" />
              </div>
              <Link href="/dashboard/schedule" className="flex gap-2 items-center border px-3 py-1 rounded-md"><GrSchedule /> Schedule</Link>
              <button 
                onClick={clearStorage}
                className="flex gap-2 items-center border px-3 py-1 rounded-md text-red-500 hover:bg-red-50"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* My Shorts Section - Updated to support both APIs */}
          {(processedClips.length > 0 || clipsList.length > 0) ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
                {/* New API display (primary) */}
                {processedClips.length > 0 ? 
                  currentProcessedClips.map((clip, index) => {
                    const actualIndex = indexOfFirstClip + index;
                    const { videoResult, subtitleResult, wordTimestampsResult } = clip;
                    
                    // Fix URLs to prevent duplication
                    const videoUrl = getFullUrl(videoResult.url);
                      
                    const subtitleUrl = subtitleResult?.url
                      ? getFullUrl(subtitleResult.url)
                      : null;
                      
                    const wordTimestampsUrl = wordTimestampsResult?.url
                      ? getFullUrl(wordTimestampsResult.url)
                      : null;
                    
                    console.log("Constructed video URL:", videoUrl);
                    
                    return (
                      <div key={videoResult.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="relative aspect-[9/16] bg-black">
                          <video 
                            className="w-full h-full object-cover"
                            controls
                            src={videoUrl}
                            onError={(e) => {
                              console.error("Video loading error for:", videoResult.metadata.filename, e);
                            }}
                          />
                        </div>
                        <div className="p-2">
                          <h3 className="font-medium text-xs">
                            {videoResult.metadata.title || `Short Clip ${actualIndex + 1}`}
                          </h3>
                          <div className="flex justify-between items-center mt-2">
                            <a 
                              href={videoUrl}
                              download={videoResult.metadata.filename}
                              className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium px-3 py-1.5 rounded-md transition-colors text-xs"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Download size={14} />
                              <span>Download</span>
                            </a>
                            <button 
                              onClick={() => {
                                // Navigate to edit page with both video and word timestamps parameters
                                const editUrl = `/dashboard/edit?videoUrl=${encodeURIComponent(videoUrl)}&videoName=${encodeURIComponent(videoResult.metadata.filename)}`;
                                const finalUrl = wordTimestampsResult?.url ? `${editUrl}&wordTimestampsUrl=${encodeURIComponent(getFullUrl(wordTimestampsResult.url))}` : editUrl;
                                
                                console.log("Navigating to edit URL:", finalUrl);
                                router.push(finalUrl);
                              }}
                              className="flex items-center gap-1 bg-purple-50 hover:bg-purple-100 text-purple-600 font-medium px-3 py-1.5 rounded-md transition-colors text-xs"
                            >
                              <Edit2 size={14} />
                              <span>Edit</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                  :
                  // Legacy API display (fallback)
                  currentClips.map((clipFilename, index) => {
                    const videoUrl = getVideoUrl(clipFilename);
                    const wordTimestampsUrl = getWordTimestampsUrl(clipFilename.replace('final_', ''));
                  const actualIndex = indexOfFirstClip + index;
                  
                  return (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="relative aspect-[9/16] bg-black">
                        <video 
                          className="w-full h-full object-cover"
                          controls
                          src={videoUrl}
                          onError={(e) => {
                            console.error("Video loading error for:", clipFilename, e);
                          }}
                        />
                      </div>
                      <div className="p-2">
                        <h3 className="font-medium text-sm">Short Clip {actualIndex + 1}</h3>
                        <div className="flex justify-between items-center mt-2">
                          <a 
                            href={videoUrl}
                            download={clipFilename}
                            className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium px-3 py-1.5 rounded-md transition-colors text-xs"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download size={14} />
                            <span>Download</span>
                          </a>
                          <button 
                            onClick={() => {
                              // Get the video filename without the "final_" prefix
                              const originalVideoName = clipFilename.replace('final_', '');
                              
                              // Construct the URLs
                                const videoUrl = getVideoUrl(clipFilename);
                                const wordTimestampsUrl = getWordTimestampsUrl(originalVideoName);
                              
                                // Navigate to edit page with both video and word timestamps parameters
                              const editUrl = `/dashboard/edit?videoUrl=${encodeURIComponent(videoUrl)}&videoName=${encodeURIComponent(originalVideoName)}`;
                                const finalUrl = `${editUrl}&wordTimestampsUrl=${encodeURIComponent(wordTimestampsUrl)}`;
                              
                              router.push(finalUrl);
                            }}
                            className="flex items-center gap-1 bg-purple-50 hover:bg-purple-100 text-purple-600 font-medium px-3 py-1.5 rounded-md transition-colors text-xs"
                          >
                            <Edit2 size={14} />
                            <span>Edit</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                  })
                }
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-6 gap-4">
                  <button 
                    onClick={goToPreviousPage} 
                    disabled={currentPage === 1}
                    className={`p-2 rounded-md border ${currentPage === 1 ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  
                  <span className="text-sm font-medium">{currentPage} of {totalPages}</span>
                  
                  <button 
                    onClick={goToNextPage} 
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-md border ${currentPage === totalPages ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                  >
                    <ChevronRight size={18} />
                  </button>
                  
                  <span className="text-sm text-gray-500">Videos per page: <span className="font-medium">6</span></span>
                </div>
              )}
            </>
          ) : (
            <button 
              onClick={() => setImportVideo(true)}
              className="w-full h-72 mt-6 p-6 flex flex-col gap-3 items-center justify-center border-2 border-dashed border-gray-300 bg-slate50 hover:bg-slateHover50 rounded-xl text-gray-400 cursor-pointer"
            >
              <UploadCloud size={24} className="font-semibold" /> No Shorts found, click here to import a Short
            </button>
          )}
        </div>

        <hr className="my-6 border-gray-300" />

        <div className="">
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-3 items-center">
              <div className="bg-slate50 hover:bg-slateHover50 p-1 rounded-full">
                <ChevronDown size={20} className={`${videosOpen ? "rotate-180" : "rotate-0"} transition-transform`} onClick={() => setVideosOpen(prev => !prev)} />
              </div>
              <div>
                <h6 className="text-lg font-medium">Imported Videos</h6>
                <p className="text-sm mt-1">Out of your imported videos, you can create shorts</p>
              </div>
            </div>

            <button onClick={() => setImportVideo(true)} className="flex gap-2 items-center border px-3 py-1 rounded-md"><Import size={19} /> Import Videos</button>
          </div>

          {videosOpen && (
            <>
              {uploadedVideo.url ? (
                <div className="mt-6 border rounded-lg overflow-hidden">
                  <div className="flex items-center p-4 gap-4">
                    <div className="w-48 h-32 bg-black rounded-lg overflow-hidden">
                      <video 
                        src={uploadedVideo.url}
                        className="w-full h-full object-cover"
                        controls
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{uploadedVideo.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {uploadedVideo.size ? (uploadedVideo.size / (1024 * 1024)).toFixed(2) : 0} MB
                      </p>
                      
                      {/* Upload status and progress indicator */}
                        {uploadedVideo.status === "processing" && (
                        <div className="mt-4">
                          <div className="flex flex-col space-y-2">
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-gray-700">{uploadStatus || "Processing your video..."}</p>
                              <p className="text-sm font-medium text-gray-900">{Math.round(jobProgress)}%</p>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-purple-600 h-2.5 rounded-full" 
                                style={{ width: `${jobProgress}%` }}
                              ></div>
                            </div>
                            <button
                              onClick={handleCancelJob}
                              className="mt-2 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              Cancel Processing
                            </button>
                          </div>
                          <ErrorDisplay error={uploadedVideo.error} />
                        </div>
                      )}
                      
                        {uploadedVideo.status === "completed" && (
                        <span className="text-green-500 inline-flex items-center mt-2">
                          <span className="mr-1">✓</span>
                          Processing completed
                        </span>
                        )}
                      
                        {uploadedVideo.status === "failed" && (
                        <ErrorDisplay error={uploadedVideo.error} />
                        )}
                    </div>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setImportVideo(true)} 
                  className="w-full h-72 mt-6 p-6 flex flex-col gap-3 items-center justify-center border-2 border-dashed border-gray-300 bg-slate50 hover:bg-slateHover50 rounded-xl text-gray-400 cursor-pointer"
                >
                  <UploadCloud size={24} className="font-semibold" /> No videos found, click here to import a video
                </button>
              )}
            </>
          )}
        </div>

        <hr className="my-6 border-gray-300" />

        <div className="">
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-3 items-center">
              <div className="bg-slate50 hover:bg-slateHover50 p-1 rounded-full">
                <ChevronDown size={20} className={`${folderOpen ? "rotate-180" : "rotate-0"} transition-transform`} onClick={() => setFolderOpen(prev => !prev)} />
              </div>
              <h6 className="text-lg font-medium">Folders</h6>
            </div>

            <button className="flex gap-2 items-center border px-3 py-1 rounded-md"
              onClick={() => setPopUpOpen(prev => !prev)}
            ><FolderPlus size={18} /> New Folder</button>
          </div>

          {folderOpen && (
            <button className="w-full h-72 mt-6 p-6 flex flex-col gap-3 items-center justify-center border-2 border-dashed border-gray-300 bg-slate50 hover:bg-slateHover50 rounded-xl text-gray-400 cursor-pointer">
              <FolderPlus className="font-semibold" />Click here to create your first folder
            </button>
          )}
        </div>
      </main>

      {/* Import Video Modal */}
      {importVideo && (
        <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white shadow-xl rounded-2xl p-6 w-[480px] animate-fadeIn">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Import size={20} className="text-purple-500" />
                Import Video
              </h3>
              <button 
                onClick={() => setImportVideo(false)} 
                className="text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full p-1.5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {isUploading ? (
              <div className="mt-6">
                {previewUrl && (
                  <div className="relative w-full aspect-[9/16] mb-6 bg-black rounded-xl overflow-hidden flex items-center justify-center shadow-md">
                    <video 
                      src={previewUrl}
                      className="w-full h-full object-contain"
                      controls={false}
                      autoPlay
                      muted
                      loop
                    />
                  </div>
                )}
                <div className="text-center py-4">
                  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-700 font-medium">{uploadStatus || "Processing your video..."}</p>
                  
                  {/* Progress bar */}
                  {jobProgress > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4 mx-auto max-w-xs">
                      <div 
                        className="bg-purple-600 h-2.5 rounded-full transition-all duration-500" 
                        style={{ width: `${jobProgress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* YouTube Import Section */}
                <div className="mt-6">
                  <label className="text-gray-700 font-medium block mb-2">Paste YouTube Link</label>
                  <div className="relative">
                  <input
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full border border-gray-300 p-3 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    value={youtubeLink}
                    onChange={(e) => setYoutubeLink(e.target.value)}
                  />
                  </div>
                  <button
                    onClick={handleImportYoutube}
                    className="w-full bg-purple-600 text-white mt-3 py-3 rounded-lg hover:bg-purple-700 transition-all duration-200 font-medium flex items-center justify-center gap-2"
                  >
                    <Import size={18} />
                    Import from YouTube
                  </button>
                </div>

                {/* OR Divider */}
                <div className="flex items-center my-6">
                  <div className="flex-grow h-0.5 bg-gray-200"></div>
                  <span className="mx-4 text-gray-500 font-medium">OR</span>
                  <div className="flex-grow h-0.5 bg-gray-200"></div>
                </div>

                {/* Drag & Drop Upload Section */}
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                    isDragActive 
                      ? "border-purple-500 bg-purple-50" 
                      : "border-gray-300 hover:border-purple-400 hover:bg-gray-50"
                  }`}
                >
                  <input {...getInputProps()} />
                  {isDragActive ? (
                    <div className="py-4">
                      <UploadCloud size={48} className="mx-auto text-purple-500 mb-2" />
                      <p className="text-purple-600 font-medium">Drop your file here</p>
                    </div>
                  ) : (
                    <div className="py-4">
                      <UploadCloud size={48} className="mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-700 font-medium mb-1">Drag & Drop a video file</p>
                      <p className="text-gray-500 text-sm">or click to select a file</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Folder popup */}
      {popUpOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
          <div className="bg-slate-50 shadow-md rounded-lg p-4">
            <div className="mb-2">
              <p className="text-base text-slate-600 mb-2">create new folder</p>
              <input type="text" placeholder="Folder Name" className="px-2 py-1 border"/>
            </div>
            <div className="flex justify-between">
              <button>Create Folder</button>
              <button className="bg-red-400 text-white px-3 py-1 rounded" onClick={() => setPopUpOpen(prev => !prev)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 