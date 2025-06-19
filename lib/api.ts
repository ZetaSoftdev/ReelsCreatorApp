/**
 * API utility functions for making requests to the external API for video processing
 */

// API endpoint from environment variables
const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || 'https://api.editur.ai/api/v1';

// Helper function to ensure URLs are properly formatted with the API endpoint
const formatApiUrl = (url: string): string => {
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

/**
 * Create a new video processing job
 * @param file - The video file to process
 * @param numClips - Number of clips to generate (default: 3)
 * @param removeSilence - Whether to remove silence from the video (default: false)
 * @param silenceThreshold - Threshold for silence detection in dB (default: -40)
 * @param minSilenceDuration - Minimum silence duration in seconds (default: 0.5)
 * @returns The API response with job ID and status
 */
export async function createVideoProcessingJob(
  file: File, 
  numClips: number = 3,
  removeSilence: boolean = false,
  silenceThreshold: number = -30,
  minSilenceDuration: number = 500
): Promise<Response> {
  const formData = new FormData();
  formData.append("video", file);
  formData.append("num_clips", numClips.toString());
  // Convert boolean to string 'true' or 'false' for the API
  formData.append("remove_silence", removeSilence.toString());
  console.log("Sending remove_silence value to API:", removeSilence.toString());
  formData.append("min_silence_len", minSilenceDuration.toString());
  formData.append("silence_thresh", silenceThreshold.toString());
  
  return fetch(`${API_ENDPOINT}/jobs/video`, {
    method: 'POST',
    headers: {
      'X-API-Key': 'test-key-123'
    },
    body: formData
  });
}

/**
 * Save video info to database after upload
 * This function should be called after successful video upload
 * @param userId - User ID
 * @param file - The uploaded video file
 * @param jobId - Job ID returned from the API
 * @param exactDuration - Exact video duration in seconds (if available)
 * @returns Response with the created video record
 */
export async function saveVideoToDatabase(
  userId: string,
  file: File,
  jobId: string,
  exactDuration?: number
): Promise<Response> {
  // Use exact duration if provided, otherwise estimate based on file size
  const duration = exactDuration !== undefined 
    ? exactDuration 
    : Math.round(file.size / (1024 * 1024) * 10); // ~10 seconds per MB
  
  const videoData = {
    userId: userId,
    title: file.name,
    description: `Uploaded on ${new Date().toLocaleDateString()}`,
    originalUrl: `${API_ENDPOINT}/jobs/${jobId}/video`,
    duration: duration,
    fileSize: file.size,
    status: 'processing',
    uploadPath: `/uploads/${jobId}/${file.name}`,
    externalJobId: jobId // Add job ID for tracking
  };
  
  return fetch('/api/videos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(videoData)
  });
}

/**
 * Get the status of a job
 * @param jobId - The job ID to check
 * @returns The API response with job status
 */
export async function getJobStatus(jobId: string): Promise<Response> {
  return fetch(`/api/jobs/status/${jobId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Get the detailed results of a completed job
 * @param jobId - The job ID to get results for
 * @returns The API response with job details and results
 */
export async function getJobDetails(jobId: string): Promise<Response> {
  return fetch(`${API_ENDPOINT}/jobs/${jobId}/details`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'test-key-123'
    }
  });
}

/**
 * Cancel a job
 * @param jobId - The job ID to cancel
 * @returns The API response
 */
export async function cancelJob(jobId: string): Promise<Response> {
  return fetch(`${API_ENDPOINT}/jobs/${jobId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'test-key-123'
    }
  });
}

/**
 * Get a video URL from the API
 * @param filename - The video filename
 * @returns The complete video URL
 */
export function getVideoUrl(filename: string): string {
  // Handle case where filename is already a complete URL or path
  if (filename.startsWith('http://') || filename.startsWith('https://') || filename.startsWith('/api/v1/')) {
    return formatApiUrl(filename);
  }
  return formatApiUrl(`videos/${encodeURIComponent(filename)}`);
}

/**
 * Get a subtitle URL from the API
 * @param filename - The subtitle filename
 * @returns The complete subtitle URL
 */
export function getSubtitleUrl(filename: string): string {
  // Handle case where filename is already a complete URL or path
  if (filename.startsWith('http://') || filename.startsWith('https://') || filename.startsWith('/api/v1/')) {
    return formatApiUrl(filename);
  }
  return formatApiUrl(`subtitles/${encodeURIComponent(filename)}`);
}

/**
 * Get word timestamps URL from the API
 * @param filename - The video filename
 * @returns The word timestamps URL
 */
export function getWordTimestampsUrl(filename: string): string {
  // Handle case where filename is already a complete URL or path
  if (filename.startsWith('http://') || filename.startsWith('https://') || filename.startsWith('/api/v1/')) {
    return formatApiUrl(filename);
  }
  return formatApiUrl(`word-timestamps/${encodeURIComponent(filename)}`);
}

/**
 * Save processed clips to database
 * @param videoId - The parent video ID in our database
 * @param clips - Array of processed clips with video, subtitle, and word timestamp results
 * @returns Response from the API
 */
export async function saveClipsToDatabase(
  videoId: string,
  clips: any[]
): Promise<Response> {
  return fetch('/api/clips', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      videoId,
      clips
    })
  });
}

/**
 * Save edited video to database
 * @param userId - User ID
 * @param videoData - Information about the edited video
 * @returns Response from the API
 */
export async function saveEditedVideoToDatabase(
  userId: string,
  videoData: {
    title: string;
    sourceType: string;
    sourceId: string;
    fileSize: number;
    duration: number;
    filePath: string;
    captionStyle?: any;
  }
): Promise<Response> {
  const editedVideoData = {
    userId,
    ...videoData
  };
  
  return fetch('/api/videos/edited', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(editedVideoData)
  });
}