import { decrypt } from "@/lib/encryption";
import { refreshAccessToken } from "@/lib/social/oauth-service";
import { SocialMediaAccount } from "@prisma/client";
import fs from "fs";
import path from "path";

/**
 * Get information about the authorized YouTube channel
 */
export async function getUserInfo(account: SocialMediaAccount) {
  try {
    // First refresh token if needed
    const refreshedAccount = await refreshAccessToken(account);
    const accessToken = decrypt(refreshedAccount.accessToken);
    
    const response = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      throw new Error('No YouTube channel found');
    }
    
    return {
      id: data.items[0].id,
      name: data.items[0].snippet.title,
      thumbnail: data.items[0].snippet.thumbnails.default.url
    };
  } catch (error) {
    console.error('Error fetching YouTube user info:', error);
    throw error;
  }
}

/**
 * Upload a video to YouTube
 */
export async function uploadVideo(
  account: SocialMediaAccount, 
  videoPath: string, 
  title: string,
  description: string = "",
  tags: string[] = []
) {
  try {
    // First refresh token if needed
    const refreshedAccount = await refreshAccessToken(account);
    const accessToken = decrypt(refreshedAccount.accessToken);
    
    // Check if file exists
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video file not found: ${videoPath}`);
    }
    
    const fileSize = fs.statSync(videoPath).size;
    
    // Step 1: Start resumable upload session
    const startResponse = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Length': fileSize.toString(),
        'X-Upload-Content-Type': 'video/mp4'
      },
      body: JSON.stringify({
        snippet: {
          title,
          description,
          tags,
          categoryId: "22" // People & Blogs category
        },
        status: {
          privacyStatus: "public"
        }
      })
    });
    
    if (!startResponse.ok) {
      const errorText = await startResponse.text();
      throw new Error(`Failed to start YouTube upload: ${errorText}`);
    }
    
    const uploadUrl = startResponse.headers.get('Location');
    if (!uploadUrl) {
      throw new Error('Failed to get YouTube upload URL');
    }
    
    // Step 2: Upload the file
    const fileStream = fs.createReadStream(videoPath);
    
    // In a real implementation, we'd handle chunked uploads with proper error handling
    // This is a simplified version that works for smaller files
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Length': fileSize.toString(),
        'Content-Type': 'video/mp4'
      },
      body: fileStream,
      duplex: 'half' // Required for Node.js streaming uploads
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Failed to upload video to YouTube: ${errorText}`);
    }
    
    const responseData = await uploadResponse.json();
    
    // Return video details
    return {
      id: responseData.id,
      url: `https://www.youtube.com/watch?v=${responseData.id}`
    };
  } catch (error) {
    console.error('Error uploading to YouTube:', error);
    throw error;
  }
} 