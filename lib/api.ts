/**
 * API utility functions for making requests to the external API for video processing
 */

// API endpoint from environment variables
const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://reels-creator-alb-555953912.us-west-1.elb.amazonaws.com/api/v1';

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
 * @returns The API response with job ID and status
 */
export async function createVideoProcessingJob(
  file: File, 
  numClips: number = 3
): Promise<Response> {
  const formData = new FormData();
  formData.append("video", file);
  formData.append("num_clips", numClips.toString());
  
  return fetch(`${API_ENDPOINT}/jobs/video`, {
    method: 'POST',
    headers: {
      'X-API-Key': 'test-key-123'
    },
    body: formData
  });
}

/**
 * Get the status of a job
 * @param jobId - The job ID to check
 * @returns The API response with job status
 */
export async function getJobStatus(jobId: string): Promise<Response> {
  return fetch(`${API_ENDPOINT}/jobs/${jobId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'test-key-123'
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