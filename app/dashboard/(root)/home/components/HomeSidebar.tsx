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
  processVideo, 
  getVideoUrl, 
  getSubtitleUrl, 
  getWordTimestampsUrl,
  createVideoProcessingJob,
  getJobStatus,
  getJobDetails
} from "@/lib/api";

// Define new result type interfaces
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

  // Check if user is admin
  useEffect(() => {
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        setIsAdmin(user.role === Role.ADMIN);
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  }, []);

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedClips = localStorage.getItem('clipsList');
    const savedSubtitles = localStorage.getItem('subtitlesList');
    const savedProcessedClips = localStorage.getItem('processedClips');
    const savedVideo = localStorage.getItem('uploadedVideo');
    
    if (savedProcessedClips) {
      try {
        setProcessedClips(JSON.parse(savedProcessedClips));
      } catch (error) {
        console.error("Error parsing processed clips:", error);
      }
    } else if (savedClips) {
      // Fallback for legacy storage format
      try {
        setClipsList(JSON.parse(savedClips));
        if (savedSubtitles) {
          setSubtitlesList(JSON.parse(savedSubtitles));
        }
      } catch (error) {
        console.error("Error parsing legacy clips data:", error);
      }
    }
    
    if (savedVideo) {
      try {
        const videoData = JSON.parse(savedVideo);
        setUploadedVideo({
          file: null,
          url: videoData.url,
          status: videoData.status,
          name: videoData.name,
          size: videoData.size,
          progress: videoData.progress
        });
        setVideosOpen(true);
      } catch (error) {
        console.error("Error parsing uploaded video data:", error);
      }
    }
  }, []);

  // Save to localStorage whenever clips or processedClips change
  useEffect(() => {
    if (processedClips.length > 0) {
      localStorage.setItem('processedClips', JSON.stringify(processedClips));
    }
    
    // Keep legacy storage for backward compatibility
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
        
        setProcessedClips(processedClips);
        setUploadedVideo(prev => ({ ...prev, status: "completed" }));
        
        // Also maintain backward compatibility with old format
        const clipFilenames = videoResults.map(v => v.metadata.filename);
        const subtitleFilenames = subtitleResults.map(s => s.metadata.video_filename);
        
        setClipsList(clipFilenames);
        setSubtitlesList(subtitleFilenames);
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
    setJobProgress(5);
    
    // This function is called every few seconds to check job status
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
        
        // Update progress bar
        if (data.progress && typeof data.progress === 'number') {
          setJobProgress(data.progress);
        }
        
        // Update status message
        if (data.status_message) {
          setUploadStatus(data.status_message);
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
    }, 5000); // Poll every 5 seconds (reduced from 10 to improve feedback)
    
    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
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
    
    try {
      // Try using the new API first
      console.log("Using new job-based API");
      const jobResponse = await createVideoProcessingJob(file, 3, true, true);
      
      // Check if the request itself failed
      if (!jobResponse.ok) {
        const errorText = await jobResponse.text();
        console.error("Job API error:", errorText);
        throw new Error(`API error: ${jobResponse.status} ${jobResponse.statusText}`);
      }
      
      const jobData = await jobResponse.json();
      console.log("Job API Response:", jobData);
      
      // Check if the response contains an error
      if (jobData.detail || jobData.error) {
        const errorMessage = jobData.detail || jobData.error || "Unknown error";
        console.error("Job API error:", errorMessage);
        
        // Update UI with error
        setUploadedVideo(prev => ({ 
          ...prev, 
          status: "failed",
          error: `Processing error: ${errorMessage}`
        }));
        setIsUploading(false);
        
        // Don't fall back if we got a real error response
        return;
      }
      
      if (jobData.job_id) {
        // New API success
        setJobId(jobData.job_id);
        setUploadStatus(`Processing started. Estimated time: ${Math.round(jobData.estimated_completion_time || 60)} seconds`);
        
        // No need to call startPollingJobStatus as we now use a useEffect that automatically
        // starts polling when jobId changes
      } else {
        // Fall back to legacy API
        console.log("Job API failed, falling back to legacy API");
        try {
          const response = await processVideo(file, 3);
          
          // Check if the request itself failed
          if (!response.ok) {
            const errorText = await response.text();
            console.error("Legacy API error:", errorText);
            throw new Error(`Legacy API error: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          console.log("Legacy API Response:", data);
          
          // Check if the response contains an error
          if (data.error || data.detail) {
            throw new Error(data.error || data.detail || "Processing failed");
          }

          if (data.status === "completed" && Array.isArray(data.clips)) {
            setUploadedVideo(prev => ({ ...prev, status: "completed" }));
            setClipsList(data.clips);
            if (Array.isArray(data.subtitles)) {
              console.log("Setting subtitles list:", data.subtitles);
              setSubtitlesList(data.subtitles);
            } else {
              console.log("No subtitles array in response");
            }
            setIsUploading(false);
          } else {
            setUploadedVideo(prev => ({ 
              ...prev, 
              status: "failed",
              error: "Processing failed: Invalid response format" 
            }));
            setIsUploading(false);
          }
        } catch (error: any) {
          console.error("Legacy API error:", error);
          setUploadedVideo(prev => ({ 
            ...prev, 
            status: "failed",
            error: `Legacy API error: ${error.message || "Connection failed"}`
          }));
          setIsUploading(false);
        }
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

  // Helper function to ensure API URLs are complete
  const getApiUrl = (urlPath: string): string => {
    // If URL is already absolute, return it as is
    if (urlPath.startsWith('http')) {
      return urlPath;
    }
    
    const apiBase = process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://localhost:8000/api/v1';
    
    // Remove leading slash if present
    const cleanPath = urlPath.startsWith('/') ? urlPath.substring(1) : urlPath;
    
    // Prevent path duplication (avoid /api/v1/api/v1/)
    if (cleanPath.startsWith('api/v1/')) {
      // If cleanPath already includes api/v1, remove it from the base URL
      const baseWithoutApiPath = apiBase.endsWith('/api/v1') 
        ? apiBase.slice(0, -7) // Remove trailing '/api/v1'
        : apiBase;
      return `${baseWithoutApiPath}/${cleanPath}`;
    }
    
    // Normal case - just join the paths
    return `${apiBase}/${cleanPath}`;
  };

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

  // Update the error display component for better visualization
  const ErrorDisplay = ({error}: {error: string | null | undefined}) => {
    if (!error) return null;
    
    return (
      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-medium text-red-800">Processing failed</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  };

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
                    const videoUrl = videoResult.url.startsWith('http') 
                      ? videoResult.url 
                      : getApiUrl(videoResult.url);
                      
                    const subtitleUrl = subtitleResult?.url
                      ? (subtitleResult.url.startsWith('http')
                          ? subtitleResult.url
                          : getApiUrl(subtitleResult.url))
                      : null;
                      
                    const wordTimestampsUrl = wordTimestampsResult?.url
                      ? (wordTimestampsResult.url.startsWith('http')
                          ? wordTimestampsResult.url
                          : getApiUrl(wordTimestampsResult.url))
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
                          <h3 className="font-medium text-sm">
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
                                // Navigate to edit page with both video and subtitle parameters
                                const editUrl = `/dashboard/edit?videoUrl=${encodeURIComponent(videoUrl)}&videoName=${encodeURIComponent(videoResult.metadata.filename)}`;
                                const finalUrl = subtitleUrl ? `${editUrl}&srtUrl=${encodeURIComponent(subtitleUrl)}` : editUrl;
                                
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
                    const subtitleUrl = subtitlesList[indexOfFirstClip + index] ? 
                      getSubtitleUrl(subtitlesList[indexOfFirstClip + index]) : 
                      null;
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
                                // Get the corresponding subtitle filename
                                const subtitleFile = subtitlesList[actualIndex];
                                
                                // Construct the URLs
                                const videoUrl = getVideoUrl(clipFilename);
                                const srtUrl = subtitleFile ? 
                                  getSubtitleUrl(subtitleFile) : '';
                                
                                // Navigate to edit page with both video and subtitle parameters
                                const editUrl = `/dashboard/edit?videoUrl=${encodeURIComponent(videoUrl)}&videoName=${encodeURIComponent(originalVideoName)}`;
                                const finalUrl = srtUrl ? `${editUrl}&srtUrl=${encodeURIComponent(srtUrl)}` : editUrl;
                                
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
                      
                      {/* Status display */}
                      {uploadedVideo.status === "processing" && (
                        <div className="mt-2">
                          {/* Progress bar */}
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 mb-1">
                            <div 
                              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                              style={{ width: `${uploadedVideo.progress || 0}%` }}
                            ></div>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-blue-500">
                              {uploadStatus || "Processing..."}
                              {uploadedVideo.progress ? ` (${Math.round(uploadedVideo.progress)}%)` : ''}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {uploadedVideo.status === "completed" && (
                        <span className="text-green-500 flex items-center gap-1 mt-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Processing complete
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
                // disabled={isUploading}
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

      {/* pop up */}
      {popUpOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
          <div className="bg-slate-50 shadow-md rounded-lg p-4">
            <div className="mb-2">
              <p className="text-base text-slate-600 mb-2">create new folder</p>
              <input type="text" placeholder="Folder Name" className="px-2 py-1 border"/>
            </div>
            <div className="flex justify-between">
              <button>Create Folder</button>
              <button className="bg-red-400 text-white px-3 py-1 rounded" onClick={() => setPopUpOpen(prev => !prev)} >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 