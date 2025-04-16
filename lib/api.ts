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
      ...options.headers,
    },
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
    ? { ...options.headers }
    : { 
        'Content-Type': 'application/json',
        ...options.headers,
      };
  
  return fetch(url, {
    method: 'POST',
    headers,
    body: data instanceof FormData ? data : JSON.stringify(data),
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
 * Process a video file using the API
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