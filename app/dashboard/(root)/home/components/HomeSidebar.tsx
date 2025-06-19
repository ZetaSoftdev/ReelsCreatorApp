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
import { toast } from "@/hooks/use-toast";
import { VideoWithExternalFields } from "@/types/database";
import {
  getVideoUrl,
  getSubtitleUrl,
  getWordTimestampsUrl,
  createVideoProcessingJob,
  getJobStatus,
  getJobDetails,
  cancelJob,
  saveVideoToDatabase,
  saveClipsToDatabase
} from "@/lib/api";
import { MdPublish } from "react-icons/md";

// API endpoint from environment variable
const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://reels-creator-alb-555953912.us-west-1.elb.amazonaws.com/api/v1';

// Extend Window interface to include our custom property
declare global {
  interface Window {
    apiErrorToastShown?: boolean;
  }
}

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

// Add interface for imported video type
interface ImportedVideo {
  id: string;
  title: string;
  originalUrl: string;
  fileSize: number;
  status: string;
  error?: string | null;
  externalJobId?: string;
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
  const [jobProgress, setJobProgress] = useState<number>(40);
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
  // Add state for edited videos
  const [editedVideos, setEditedVideos] = useState<any[]>([]);
  const [isLoadingEditedVideos, setIsLoadingEditedVideos] = useState(false);
  const [currentEditedVideoPage, setCurrentEditedVideoPage] = useState(1);
  const router = useRouter();

  // Add user state to store session data
  const [user, setUser] = useState<{
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string;
    image?: string | null;
  } | null>(null);

  // Add this state at the top with other state declarations
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);

  // Add loading state for clips
  const [isLoadingClips, setIsLoadingClips] = useState(false);

  // Add new state for number of clips
  const [numClips, setNumClips] = useState<number>(3);

  // Add new state for silence removal
  const [removeSilence, setRemoveSilence] = useState<boolean>(false);

  // Add these state variables near the top where other state variables are defined
  const [importedVideos, setImportedVideos] = useState<ImportedVideo[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalImportedPages, setTotalImportedPages] = useState(1);
  const [currentImportedPage, setCurrentImportedPage] = useState(1);
  const [isLoadingImported, setIsLoadingImported] = useState(false);

  // Add state for total clips count
  const [totalClips, setTotalClips] = useState(0);

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

    // Fetch clips from database when component mounts
    fetchClipsFromDatabase();
    
    // Fetch edited videos from database when component mounts
    fetchEditedVideosFromDatabase();
  }, []);

  // Add function to fetch clips from database
  const fetchClipsFromDatabase = async () => {
    try {
      setIsLoadingClips(true);
      console.log('Fetching clips for page:', currentPage);

      // Make API request with pagination
      const response = await fetch(`/api/clips?page=${currentPage}&limit=${clipsPerPage}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch clips: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Debug logs
      console.log('API Response:', data);
      console.log('Pagination data:', data.pagination);
      console.log('Total clips:', data.pagination.total);
      console.log('Clips array:', data.clips);

      // Update state with fetched clips and total count
      setProcessedClips(data.clips || []);
      setTotalPages(data.pagination.totalPages);
      
      // Ensure we have a valid total count
      const totalCount = typeof data.pagination.total === 'number' ? data.pagination.total : 0;
      console.log('Setting total clips count to:', totalCount);
      setTotalClips(totalCount);
      
      // Debug logs after state update
      console.log('State after update - processedClips:', data.clips?.length);
      console.log('State after update - totalPages:', data.pagination.totalPages);
      console.log('State after update - totalClips:', totalCount);
      
      setIsLoadingClips(false);
    } catch (error) {
      console.error('Error fetching clips:', error);
      toast({
        title: "Error Loading Clips",
        description: "Failed to load clips from database",
        variant: "destructive",
      });
      setIsLoadingClips(false);
    }
  };

  // Add effect to log when total clips changes
  useEffect(() => {
    console.log('Total clips state updated:', totalClips);
  }, [totalClips]);

  // Fetch clips when page changes
  useEffect(() => {
    fetchClipsFromDatabase();
  }, [currentPage]);

  // Get current clips - updated to work with both new and old API responses
  const currentClips = clipsList.slice(0, clipsPerPage);
  const currentProcessedClips = processedClips.slice(0, clipsPerPage);

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
    // Show confirmation toast before clearing
    toast({
      title: "Clearing Display",
      description: "Cleared display (data remains in database)",
      variant: "default",
    });
    
    // Reset state
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
    
    // Refresh data from database
    fetchClipsFromDatabase();
    fetchUploadedVideosFromDatabase();
  };

  // Fetch uploaded videos from database instead of localStorage
  useEffect(() => {
    // Fetch videos from database
    fetchUploadedVideosFromDatabase();
  }, []);

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

        // Show error toast
        toast({
          title: "Processing Failed",
          description: errorMessage,
          variant: "destructive",
        });

        // Update video status in database
        try {
          const videoRecords = await fetch(`/api/videos?status=processing`);
          const videoData = await videoRecords.json();
          
          if (videoData.videos && videoData.videos.length > 0) {
            // Look for any processing videos that match our job
            const processingVideo = videoData.videos.find(
              (v: any) => v.originalUrl && v.originalUrl.includes(id)
            );
            
            if (processingVideo) {
              await fetch(`/api/videos/${processingVideo.id}/status`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  status: 'failed',
                  error: errorMessage
                })
              });
              console.log("Updated video status in database to failed");
            }
          }
        } catch (dbError) {
          console.error("Failed to update video status in database:", dbError);
        }

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
          // Show error toast
          toast({
            title: "Processing Error",
            description: "No video results were generated",
            variant: "destructive",
          });

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

        // Add toast notification for completed processing
        toast({
          title: "Processing Complete",
          description: `Successfully created ${processedClips.length} video clips`,
          variant: "default",
        });

        // Update video status in database and save clips
        try {
          const videoRecords = await fetch(`/api/videos?status=processing`);
          const videoData = await videoRecords.json();
          
          if (videoData.videos && videoData.videos.length > 0) {
            // Look for any processing videos that match our job
            const processingVideo = videoData.videos.find(
              (v: any) => v.originalUrl && v.originalUrl.includes(id)
            );
            
            if (processingVideo) {
              // First update video status to completed
              await fetch(`/api/videos/${processingVideo.id}/status`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  status: 'completed',
                  processedAt: new Date().toISOString()
                })
              });
              console.log("Updated video status in database to completed");

              // Then save the generated clips
              try {
                const saveClipsResponse = await saveClipsToDatabase(
                  processingVideo.id,
                  processedClips
                );
                
                if (saveClipsResponse.ok) {
                  const saveClipsData = await saveClipsResponse.json();
                  console.log("Saved clips to database:", saveClipsData);
                  
                  // Refresh clips from database after saving
                  fetchClipsFromDatabase();
                  // Also refresh the uploaded video data
                  fetchUploadedVideosFromDatabase();
                } else {
                  console.error("Failed to save clips to database:", await saveClipsResponse.text());
                }
              } catch (clipSaveError) {
                console.error("Error saving clips to database:", clipSaveError);
              }
            }
          }
        } catch (dbError) {
          console.error("Failed to update video status in database:", dbError);
        }
      } else {
        console.error("Invalid job details response:", detailsData);

        // Show error toast
        toast({
          title: "Processing Failed",
          description: "Failed to process video: Invalid result format",
          variant: "destructive",
        });

        setUploadedVideo(prev => ({
          ...prev,
          status: "failed",
          error: "Failed to process video: Invalid result format"
        }));
      }
    } catch (error: any) {
      console.error("Error fetching job details:", error);

      // Show error toast
      toast({
        title: "Processing Error",
        description: error.message || "Failed to retrieve processing results",
        variant: "destructive",
      });

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
    setJobProgress(0);
    setUploadStatus("Starting processing...");

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
          
          // If we get a "No space left on device" error, handle it differently
          if (errorText.includes("No space left on device")) {
            setUploadStatus("External API server is out of disk space. Processing may be delayed.");
            // Don't throw an error, just continue polling with a warning message
            return;
          }
          
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Job status:', data);

        // Update progress bar based on status
        if (data.status === 'completed') {
          setJobProgress(100);
          setUploadStatus("Processing complete!");
        } else if (data.status === 'processing') {
          // If we have a progress value, use it
          if (data.progress && typeof data.progress === 'number') {
            setJobProgress(Math.max(0, Math.min(99, data.progress))); // Keep it under 100 until complete
          } else {
            // If no progress but still processing, increment progress slightly
            setJobProgress(prev => Math.min(prev + 2, 99)); // Increment but cap at 99%
          }
          
          // Update status message if provided
          if (data.status_message) {
            setUploadStatus(data.status_message);
          }
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
          setJobProgress(0);
        }
      } catch (error: any) {
        console.error("Error polling job status:", error);
        // Show the error but don't stop polling on temporary network errors
        setUploadStatus(`Checking status... (${error.message || "Network error"})`);
        
        // If we keep getting errors for more than 1 minute (12 attempts at 5-second intervals)
        // suggest that the server might be down
        pollingErrorCount = (pollingErrorCount || 0) + 1;
        if (pollingErrorCount > 12) {
          setUploadStatus("External API may be unavailable. Video is still processing in the background.");
          toast({
            title: "Processing Continues",
            description: "Your video is still processing in the background. You can check back later.",
            variant: "default",
          });
          // Save to DB that processing is ongoing, but we can't check status
          try {
            // Find the video in the database and mark it as still processing
            const videoRecords = await fetch(`/api/videos?status=processing`);
            const videoData = await videoRecords.json();
            
            if (videoData.videos && videoData.videos.length > 0) {
              // Look for any processing videos that match our job
              const processingVideo = videoData.videos.find(
                (v: any) => v.originalUrl && v.originalUrl.includes(jobId)
              );
              
              if (processingVideo) {
                // Just update the error message that API is unavailable
                await fetch(`/api/videos/${processingVideo.id}/status`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    error: "External API unavailable. Processing will continue in the background."
                  })
                });
              }
            }
            // Clear the interval but keep the UI in processing state
            clearInterval(intervalId);
            pollingIntervalRef.current = null;
          } catch (dbError) {
            console.error("Failed to update database with API status:", dbError);
          }
        }
      }
    }, 5000); // Poll every 5 seconds

    // Initialize error count tracking
    let pollingErrorCount = 0;

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

    try {
      // Check if user can upload
      const uploadCheckResponse = await fetch('/api/user/can-upload');
      const uploadCheckData = await uploadCheckResponse.json();

      if (!uploadCheckData.allowed) {
        // Show subscription required message with toast
        toast({
          title: "Subscription Required",
          description: uploadCheckData.message,
          variant: "destructive",
        });

        // Update UI with error
        setUploadedVideo({
          file,
          url: URL.createObjectURL(file),
          status: "failed",
          name: file.name,
          size: file.size,
          progress: 0,
          error: uploadCheckData.message
        });

        // Check if we need to redirect to pricing page
        if (uploadCheckData.redirectTo === '/dashboard/pricing') {
          // Set timeout to show the message briefly before redirecting
          setTimeout(() => {
            router.push('/dashboard/pricing');
          }, 1500);
        } else {
          // Just show the subscription dialog without redirect
          setShowSubscriptionDialog(true);
        }
        return;
      }

      // Show upload started toast
      toast({
        title: "Upload Started",
        description: "Your video is being uploaded and processed",
        variant: "default",
      });

      // Continue with existing upload logic
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

      // Get exact video duration using HTML5 Video API
      const getExactVideoDuration = (videoFile: File): Promise<number> => {
        return new Promise((resolve) => {
          const video = document.createElement('video');
          video.preload = 'metadata';
          video.onloadedmetadata = () => {
            window.URL.revokeObjectURL(video.src);
            resolve(video.duration);
          };
          video.src = URL.createObjectURL(videoFile);
        });
      };

      // Get exact duration in seconds
      const exactDuration = await getExactVideoDuration(file);
      console.log(`Exact video duration: ${exactDuration} seconds`);

      // Set initial progress and status message
      setJobProgress(10);
      setUploadStatus("Uploading video for processing...");

      console.log(`Creating video processing job with ${numClips} clips and silence removal: ${removeSilence}`);
      let jobResponse;
      try {
        console.log("Final removeSilence value before API call:", removeSilence);
        jobResponse = await createVideoProcessingJob(
          file, 
          numClips,
          removeSilence
        );
        console.log("Job creation response status:", jobResponse.status);
      } catch (apiError: any) {
        console.error("API request failed:", apiError);
        throw new Error(`API request failed: ${apiError.message}`);
      }

      // Set progress after request is sent
      setJobProgress(30);
      setUploadStatus("Video uploaded, starting job...");

      // Check if the request itself failed
      if (!jobResponse.ok) {
        const errorText = await jobResponse.text();
        console.error("API error:", errorText);
        throw new Error(`API error: ${jobResponse.status} ${jobResponse.statusText}`);
      }

      const jobData = await jobResponse.json();
      console.log("API Response:", jobData);

      // Check if the response contains an error
      if (jobData.error || jobData.detail) {
        const errorMessage = jobData.error || jobData.detail || "Unknown error";
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
      if (jobData.job_id) {
        // Set job ID to start polling
        setJobId(jobData.job_id);
        // Update status message with the estimated time
        const estimatedTime = jobData.estimated_completion_time || 60;
        setUploadStatus(`Processing started. Estimated time: ${Math.round(estimatedTime)} seconds`);
        // Set initial progress
        setJobProgress(40);

        // Show processing started toast
        toast({
          title: "Processing Started",
          description: `Estimated time: ${Math.round(estimatedTime)} seconds`,
          variant: "default",
        });

        // Make sure we have a user session before saving to database
        if (!user?.id) {
          // Try to fetch fresh session data
          try {
            console.log("No user ID found, fetching fresh session data");
            const sessionResponse = await fetch(`/api/user/session?t=${Date.now()}`);
            if (sessionResponse.ok) {
              const sessionData = await sessionResponse.json();
              if (sessionData.user?.id) {
                // Update user state
                setUser(sessionData.user);
                console.log("Retrieved user ID:", sessionData.user.id);

                // Save video with fresh user ID and exact duration
                console.log("Saving video to database with refreshed user ID");
                try {
                  const saveResponse = await saveVideoToDatabase(
                  sessionData.user.id,
                  file,
                  jobData.job_id,
                  exactDuration
                );
                  
                  console.log("Save response status:", saveResponse.status);
                  
                  if (!saveResponse.ok) {
                    const saveErrorText = await saveResponse.text();
                    console.error("Database save failed:", saveErrorText);
                    toast({
                      title: "Database Save Failed",
                      description: "Video is processing but could not be saved to database",
                      variant: "destructive",
                    });
              } else {
                    const savedData = await saveResponse.json();
                    console.log("Video saved to database successfully:", savedData);
                    
                    // Trigger a fetch of videos from database to update UI
                    setTimeout(fetchUploadedVideosFromDatabase, 1000);
                  }
                } catch (saveError: any) {
                  console.error("Exception during database save:", saveError);
                  toast({
                    title: "Database Error",
                    description: `Failed to save to database: ${saveError.message}`,
                    variant: "destructive",
                  });
                }
              } else {
                console.error("Session data doesn't contain user ID:", sessionData);
              }
            } else {
              console.error("Failed to fetch session data:", await sessionResponse.text());
            }
          } catch (sessionError: any) {
            console.error("Failed to refresh session:", sessionError);
          }
        } else {
          // Save video information to database with existing user ID
          try {
            console.log("Saving video to database for user:", user.id);
            const dbSaveResponse = await saveVideoToDatabase(
              user.id,
              file,
              jobData.job_id,
              exactDuration
            );

            console.log("Database save response status:", dbSaveResponse.status);

            if (!dbSaveResponse.ok) {
              const errorData = await dbSaveResponse.text();
              console.error("Failed to save video to database:", errorData);
              toast({
                title: "Database Save Failed",
                description: "Video is processing but could not be saved to database",
                variant: "destructive",
              });
            } else {
              const savedData = await dbSaveResponse.json();
              console.log("Video saved to database:", savedData);
              
              // Trigger a fetch of videos from database to update UI
              setTimeout(fetchUploadedVideosFromDatabase, 1000);
            }
          } catch (dbError: any) {
            console.error("Error saving video to database:", dbError);
            toast({
              title: "Database Error",
              description: `Failed to save to database: ${dbError.message}`,
              variant: "destructive",
            });
            // Don't fail the upload process if database save fails
          }
        }
      } else {
        throw new Error("Invalid API response: No job_id returned");
      }
    } catch (error: any) {
      console.error("Error:", error);

      // Show error toast
      toast({
        title: "Upload Failed",
        description: error.message || "Upload failed. Please try again.",
        variant: "destructive",
      });

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

        // Show cancelling toast
        toast({
          title: "Cancelling Job",
          description: "Your video processing job is being cancelled",
          variant: "default",
        });

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
        
        // Update video status in database
        try {
          const videoRecords = await fetch(`/api/videos?status=processing`);
          const videoData = await videoRecords.json();
          
          if (videoData.videos && videoData.videos.length > 0) {
            // Look for any processing videos that match our job
            const processingVideo = videoData.videos.find(
              (v: any) => v.originalUrl && v.originalUrl.includes(jobId)
            );
            
            if (processingVideo) {
              await fetch(`/api/videos/${processingVideo.id}/status`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  status: 'canceled',
                  error: "Job cancelled by user"
                })
              });
              console.log("Updated video status in database to canceled");
            }
          }
        } catch (dbError) {
          console.error("Failed to update video status in database:", dbError);
        }
        
        // Reset state
        setUploadedVideo(prev => ({ 
          ...prev, 
          status: "failed",
          error: "Job cancelled by user"
        }));
        setJobId(null);
        setJobProgress(0);
        setIsUploading(false);
        
        // Refresh videos from database
        fetchUploadedVideosFromDatabase();
        
        // Show cancelled toast
        toast({
          title: "Job Cancelled",
          description: "Your video processing job has been cancelled",
          variant: "default",
        });

      } catch (error: any) {
        console.error("Error cancelling job:", error);

        // Show error toast
        toast({
          title: "Cancellation Failed",
          description: error.message || "Failed to cancel job",
          variant: "destructive",
        });

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
      onClickHandler: () => { }
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
      onClickHandler: () => { }
    },
  ];

  const ErrorDisplay = ({ error }: { error: string | null | undefined }) => {
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

  // Add function to fetch videos from database
  const fetchUploadedVideosFromDatabase = async () => {
    try {
      setIsLoadingImported(true);
      
      // Make API request with pagination
      const response = await fetch(`/api/videos?page=${currentImportedPage}&limit=${clipsPerPage}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch videos: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Check if we got an indication that the external API is down
      if (data.externalApiStatus === "skipped") {
        if (!window.apiErrorToastShown) {
          toast({
            title: "API Server Issue",
            description: "External processing server is experiencing issues. Processing status may not be up-to-date.",
            variant: "destructive",
          });
          window.apiErrorToastShown = true;
        }
      } else {
        window.apiErrorToastShown = false;
      }
      
      // Update state with fetched videos
      setImportedVideos(data.videos || []);
      setTotalImportedPages(data.pagination.totalPages);
      
      // Only update uploadedVideo if there's no active upload
      if (!isUploading && (!uploadedVideo.status || uploadedVideo.status === "failed" || uploadedVideo.status === "completed")) {
        const lastUploadedVideo = data.videos?.[0];
        if (lastUploadedVideo) {
          setUploadedVideo({
            file: null,
            url: lastUploadedVideo.originalUrl,
            status: lastUploadedVideo.status,
            name: lastUploadedVideo.title,
            size: lastUploadedVideo.fileSize,
            error: lastUploadedVideo.error || null
          });
          
          if (lastUploadedVideo.status === "processing") {
            if (lastUploadedVideo.externalJobId) {
              setJobId(lastUploadedVideo.externalJobId);
              setJobProgress(40);
            } else {
              const jobIdMatch = lastUploadedVideo.originalUrl.match(/job_id=([^&]+)/);
              if (jobIdMatch && jobIdMatch[1]) {
                setJobId(jobIdMatch[1]);
                setJobProgress(40);
              }
            }
          }
        }
      }
      
      setVideosOpen(true);
      setIsLoadingImported(false);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({
        title: "Error Loading Videos",
        description: "Failed to load videos from database",
        variant: "destructive",
      });
      setIsLoadingImported(false);
    }
  };

  // Add pagination functions for imported videos
  const goToNextImportedPage = () => {
    if (currentImportedPage < totalImportedPages) {
      setCurrentImportedPage(prev => prev + 1);
    }
  };

  const goToPreviousImportedPage = () => {
    if (currentImportedPage > 1) {
      setCurrentImportedPage(prev => prev - 1);
    }
  };

  // Add effect to fetch videos when page changes
  useEffect(() => {
    fetchUploadedVideosFromDatabase();
  }, [currentImportedPage]);

  // Fetch edited videos when page changes
  useEffect(() => {
    fetchEditedVideosFromDatabase();
  }, [currentEditedVideoPage]);

  // Edited videos pagination functions
  const goToNextEditedVideoPage = () => {
    if (currentEditedVideoPage < Math.ceil(editedVideos.length / clipsPerPage)) {
      setCurrentEditedVideoPage(currentEditedVideoPage + 1);
    }
  };

  const goToPreviousEditedVideoPage = () => {
    if (currentEditedVideoPage > 1) {
      setCurrentEditedVideoPage(currentEditedVideoPage - 1);
    }
  };

  // Add function to fetch edited videos from database
  const fetchEditedVideosFromDatabase = async () => {
    try {
      setIsLoadingEditedVideos(true);

      // Make API request with pagination
      const response = await fetch(`/api/videos/edited?page=${currentEditedVideoPage}&limit=${clipsPerPage}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch edited videos: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Update state with fetched edited videos
      setEditedVideos(data.editedVideos || []);
      
      setIsLoadingEditedVideos(false);
    } catch (error) {
      console.error('Error fetching edited videos:', error);
      toast({
        title: "Error Loading Edited Videos",
        description: "Failed to load edited videos from database",
        variant: "destructive",
      });
      setIsLoadingEditedVideos(false);
    }
  };


  return (
    <div className="">
      <HomeHeader pageName={"Home"} />

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
            </div>
          </div>

          {/* My Shorts Section - Updated to support database fetching */}
          {isLoadingClips ? (
            <div className="flex justify-center items-center h-72 mt-6">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="ml-3 text-gray-700">Loading clips...</p>
            </div>
          ) : ((processedClips.length > 0 || clipsList.length > 0) ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
                {/* New API display (primary) */}
                {processedClips.length > 0 ?
                  currentProcessedClips.map((clip, index) => {
                    const actualIndex = index;
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
                            {videoResult.metadata.title
                              ? videoResult.metadata.title.split(" ").slice(0, 4).join(" ")
                              : `Short Clip ${actualIndex + 1}`}
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
                    const actualIndex = index;

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
              <div className="flex justify-center items-center mt-6 gap-4">
                {totalPages > 1 && (
                  <>
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
                  </>
                )}

                <span className="text-sm text-gray-500">Total shorts: {totalClips} / {clipsPerPage} shown per page</span>
              </div>
            </>
          ) : (
            <button
              onClick={() => setImportVideo(true)}
              className="w-full h-72 mt-6 p-6 flex flex-col gap-3 items-center justify-center border-2 border-dashed border-gray-300 bg-slate50 hover:bg-slateHover50 rounded-xl text-gray-400 cursor-pointer"
            >
              <UploadCloud size={24} className="font-semibold" /> No Shorts found, click here to import a Short
            </button>
          ))}
        </div>

        <hr className="my-6 border-gray-300" />

        {/* New Edited Videos Section */}
        <div className="">
          <div className="flex items-center justify-between mt-4">
            <div>
              <h6 className="text-lg font-medium">My Edited Videos</h6>
              <p className="text-sm mt-1">These are videos you edited and saved for later use.</p>
            </div>
          </div>

          {/* Edited Videos List */}
          {isLoadingEditedVideos ? (
            <div className="flex justify-center items-center h-72 mt-6">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="ml-3 text-gray-700">Loading edited videos...</p>
            </div>
          ) : editedVideos.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
                {editedVideos.map((video) => (
                  <div key={video.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="relative aspect-[9/16] bg-black">
                      <video
                        className="w-full h-full object-cover"
                        controls
                        src={video.filePath}
                        onError={(e) => {
                          console.error("Video loading error for:", video.title, e);
                        }}
                      />
                    </div>
                    <div className="p-2">
                      <h3 className="font-medium text-xs">
                        {video.title}
                      </h3>
                      <div className="flex justify-between items-center mt-2">
                        <a
                          href={video.filePath}
                          download={video.title}
                          className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium px-3 py-1.5 rounded-md transition-colors text-xs"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download size={14} />
                        </a>
                        <button
                          onClick={() => {
                            // Navigate to edit page with the video URL
                            router.push(`/dashboard/schedule`);
                          }}
                          className="flex items-center gap-1 bg-purple-50 hover:bg-purple-100 text-purple-600 font-medium px-3 py-1.5 rounded-md transition-colors text-xs"
                        >
                          <MdPublish />
                          Publish
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {Math.ceil(editedVideos.length / clipsPerPage) > 1 && (
                <div className="flex justify-center items-center mt-6 gap-4">
                  <button
                    onClick={goToPreviousEditedVideoPage}
                    disabled={currentEditedVideoPage === 1}
                    className={`p-2 rounded-md border ${currentEditedVideoPage === 1 ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <span className="text-sm font-medium">
                    {currentEditedVideoPage} of {Math.ceil(editedVideos.length / clipsPerPage)}
                  </span>

                  <button
                    onClick={goToNextEditedVideoPage}
                    disabled={currentEditedVideoPage === Math.ceil(editedVideos.length / clipsPerPage)}
                    className={`p-2 rounded-md border ${currentEditedVideoPage === Math.ceil(editedVideos.length / clipsPerPage) ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                  >
                    <ChevronRight size={18} />
                  </button>

                  <span className="text-sm text-gray-500">Videos per page: <span className="font-medium">6</span></span>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-60 mt-6 p-6 flex flex-col gap-3 items-center justify-center border-2 border-dashed border-gray-300 bg-slate50 rounded-xl text-gray-400">
              <Edit2 size={24} className="font-semibold" /> No edited videos found. Edit a video and save it to see it here.
            </div>
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
              {/* Processing Video Section */}
              {uploadedVideo.status === "processing" && (
                <div className="mt-6 mb-4">
                  <div className="border rounded-lg overflow-hidden bg-yellow-50/50">
                    <div className="flex items-center p-4 gap-4">
                      <div className="w-48 h-32 bg-black rounded-lg overflow-hidden">
                        <video
                          src={uploadedVideo.url}
                          className="w-full h-full object-cover"
                          controls
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{uploadedVideo.name}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {uploadedVideo.size ? `${(uploadedVideo.size / (1024 * 1024)).toFixed(2)} MB` : ''}
                            </p>
                          </div>
                          <button
                            onClick={handleCancelJob}
                            className="text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                        <div className="mt-3">
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-600 inline-flex items-center">
                              <span className="mr-1">⌛</span>
                              {uploadStatus || "Processing..."}
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div
                              className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${jobProgress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Processing: {jobProgress}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {uploadedVideo.status === "failed" && uploadedVideo.error && (
                <div className="mt-6 mb-4">
                  <div className="border rounded-lg overflow-hidden bg-red-50/50">
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
                          {uploadedVideo.size ? `${(uploadedVideo.size / (1024 * 1024)).toFixed(2)} MB` : ''}
                        </p>
                        <div className="mt-2">
                          <span className="text-red-600 inline-flex items-center">
                            <span className="mr-1">⚠️</span>
                            {uploadedVideo.error}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Imported Videos List */}
              {isLoadingImported ? (
                <div className="flex justify-center items-center h-72 mt-6">
                  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="ml-3 text-gray-700">Loading videos...</p>
                </div>
              ) : importedVideos.length > 0 ? (
                <div className="mt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {importedVideos.map((video, index) => (
                      <div key={video.id} className="border rounded-lg overflow-hidden">
                        <div className="flex items-center p-4 gap-4">
                          <div className="w-48 h-32 bg-black rounded-lg overflow-hidden">
                            <video
                              src={video.originalUrl}
                              className="w-full h-full object-cover"
                              controls
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{video.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {(video.fileSize / (1024 * 1024)).toFixed(2)} MB
                            </p>
                            {video.status === "completed" && (
                              <span className="text-green-500 inline-flex items-center mt-2">
                                <span className="mr-1">✓</span>
                                Completed
                              </span>
                            )}
                            {video.status === "failed" && (
                              <span className="text-red-500 inline-flex items-center mt-2">
                                <span className="mr-1">⚠️</span>
                                Failed: {video.error}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination Controls for Imported Videos */}
                  {totalImportedPages > 1 && (
                    <div className="flex justify-center items-center mt-6 gap-4">
                      <button
                        onClick={goToPreviousImportedPage}
                        disabled={currentImportedPage === 1}
                        className={`p-2 rounded-md border ${currentImportedPage === 1 ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                      >
                        <ChevronLeft size={18} />
                      </button>

                      <span className="text-sm font-medium">{currentImportedPage} of {totalImportedPages}</span>

                      <button
                        onClick={goToNextImportedPage}
                        disabled={currentImportedPage === totalImportedPages}
                        className={`p-2 rounded-md border ${currentImportedPage === totalImportedPages ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                      >
                        <ChevronRight size={18} />
                      </button>

                      <span className="text-sm text-gray-500">Videos per page: <span className="font-medium">{clipsPerPage}</span></span>
                    </div>
                  )}
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
                        className="bg-purple-600 h-2.5 rounded-full"
                        style={{ width: `${jobProgress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Number of Clips Selector */}
                <div className="mb-6">
                  <div className="flex justify-center items-center gap-4 mt-6">
                    <button
                      onClick={() => setNumClips(prev => Math.max(1, prev - 1))}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div className="text-center">
                      <span className="text-purple-600 font-medium text-lg">{numClips}</span>
                      <span className="text-gray-600 ml-1">clip{numClips !== 1 ? 's' : ''}</span>
                    </div>
                    <button
                      onClick={() => setNumClips(prev => Math.min(10, prev + 1))}
                      className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Select how many short clips you want to create from your video.
                  </p>
                </div>

                {/* Silence Removal Checkbox */}
                <div className="mb-6">
                  <label className="flex items-center justify-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={removeSilence}
                      onChange={(e) => {
                        const newValue = e.target.checked;
                        console.log("Checkbox changed to:", newValue);
                        setRemoveSilence(newValue);
                      }}
                      className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                    />
                    <span className="text-gray-700">Remove silence from video</span>
                  </label>
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Automatically remove silent parts from the video
                  </p>
                </div>

                {/* Drag & Drop Upload Section */}
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${isDragActive
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
              <input type="text" placeholder="Folder Name" className="px-2 py-1 border" />
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

      {/* Subscription required dialog */}
      {showSubscriptionDialog && (
        <div className="fixed inset-0 bg-gray-900/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-[#343434]">Subscription Required</h3>
              <button
                onClick={() => setShowSubscriptionDialog(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-[#343434] mb-4">
                {uploadedVideo.error || "You have used your free video. Subscribe to upload and edit more videos."}
              </p>

              <div className="bg-purple-50 p-3 rounded-md border border-purple-200 mb-4">
                <p className="text-sm text-purple-700">
                  Our subscription plans give you access to premium features and allow you to process multiple videos each month.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSubscriptionDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-[#343434] hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowSubscriptionDialog(false);
                  router.push('/dashboard/pricing');
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                View Plans
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 