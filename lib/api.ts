/**
 * API utility functions for making requests to the external API
 */

// Get the API endpoint from environment variables
export const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://localhost:8000/api/v1';

/**
 * Generate a full URL for the external API
 * @param path - The path to append to the API endpoint
 * @returns The complete URL
 */
export function getApiUrl(path: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${API_ENDPOINT}/${cleanPath}`;
}

/**
 * Make a GET request to the external API
 * @param path - The API path
 * @param options - Additional fetch options
 * @returns The fetch response
 */
export async function apiGet(path: string, options: RequestInit = {}) {
  const url = getApiUrl(path);
  return fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'test-key-123', // Your API key here
      ...options.headers,
    },
    mode: 'cors', // Explicitly set CORS mode
    credentials: 'same-origin',
    ...options,
  });
}

/**
 * Make a POST request to the external API
 * @param path - The API path
 * @param data - The data to send
 * @param options - Additional fetch options
 * @returns The fetch response
 */
export async function apiPost(path: string, data: any, options: RequestInit = {}) {
  const url = getApiUrl(path);
  
  // If data is FormData, don't set Content-Type (browser will set it with boundary)
  const headers = data instanceof FormData 
    ? { 
        'X-API-Key': 'test-key-123', // Your API key here
        ...options.headers 
      }
    : { 
        'Content-Type': 'application/json',
        'X-API-Key': 'test-key-123', // Your API key here
        ...options.headers,
      };
  
  return fetch(url, {
    method: 'POST',
    headers,
    body: data instanceof FormData ? data : JSON.stringify(data),
    mode: 'cors', // Explicitly set CORS mode
    credentials: 'same-origin',
    ...options,
  });
}

/**
 * Make a DELETE request to the external API
 * @param path - The API path
 * @param options - Additional fetch options
 * @returns The fetch response
 */
export async function apiDelete(path: string, options: RequestInit = {}) {
  const url = getApiUrl(path);
  return fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'test-key-123', // Your API key here
      ...options.headers,
    },
    ...options,
  });
}

/**
 * Get a video URL from the API
 * @param filename - The video filename
 * @returns The complete video URL
 */
export function getVideoUrl(filename: string): string {
  return getApiUrl(`videos/${encodeURIComponent(filename)}`);
}

/**
 * Get a subtitle URL from the API
 * @param filename - The subtitle filename
 * @returns The complete subtitle URL
 */
export function getSubtitleUrl(filename: string): string {
  return getApiUrl(`subtitles/${encodeURIComponent(filename)}`);
}

/**
 * Get word timestamps URL from the API
 * @param filename - The video filename
 * @returns The word timestamps URL
 */
export function getWordTimestampsUrl(filename: string): string {
  return getApiUrl(`word-timestamps/${encodeURIComponent(filename)}`);
}

/**
 * Process a video file using the legacy API
 * @param file - The video file to process
 * @param numClips - Number of clips to generate
 * @returns The API response
 */
export async function processVideo(file: File, numClips: number = 3) {
  const formData = new FormData();
  formData.append("video", file);
  formData.append("num_clips", numClips.toString());
  
  return apiPost('process-video', formData);
}

/**
 * Create a new video processing job with the new API
 * @param file - The video file to process
 * @param numClips - Number of clips to generate
 * @param autocaption - Whether to add captions to clips
 * @param generateSrt - Whether to generate SRT subtitle files
 * @returns The API response with job ID and status
 */
export async function createVideoProcessingJob(
  file: File, 
  numClips: number = 3, 
  autocaption: boolean = true,
  generateSrt: boolean = true
) {
  const formData = new FormData();
  formData.append("video", file);
  formData.append("num_clips", numClips.toString());
  formData.append("autocaption", autocaption.toString());
  formData.append("generate_srt", generateSrt.toString());
  
  return apiPost('jobs/video', formData);
}

/**
 * Get the status of a job
 * @param jobId - The job ID to check
 * @returns The API response with job status
 */
export async function getJobStatus(jobId: string) {
  return apiGet(`jobs/${jobId}`);
}

/**
 * Get the detailed results of a completed job
 * @param jobId - The job ID to get results for
 * @returns The API response with job details and results
 */
export async function getJobDetails(jobId: string) {
  return apiGet(`jobs/${jobId}/details`);
}

/**
 * List all jobs with optional filtering
 * @param status - Optional filter by job status (pending, processing, completed, failed)
 * @param limit - Maximum number of jobs to return
 * @param offset - Offset for pagination
 * @returns The API response with job list
 */
export async function listJobs(status?: string, limit: number = 20, offset: number = 0) {
  let queryParams = '';
  
  if (status) {
    queryParams += `status=${status}`;
  }
  
  if (limit !== 20) {
    queryParams += queryParams ? '&' : '';
    queryParams += `limit=${limit}`;
  }
  
  if (offset !== 0) {
    queryParams += queryParams ? '&' : '';
    queryParams += `offset=${offset}`;
  }
  
  const path = queryParams ? `jobs?${queryParams}` : 'jobs';
  return apiGet(path);
}

/**
 * Cancel a job
 * @param jobId - The job ID to cancel
 * @returns The API response
 */
export async function cancelJob(jobId: string) {
  return apiDelete(`jobs/${jobId}`);
}