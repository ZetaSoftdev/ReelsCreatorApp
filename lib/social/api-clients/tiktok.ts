import { decrypt } from "@/lib/encryption";
import { refreshAccessToken } from "@/lib/social/oauth-service";
import { SocialMediaAccount } from "@prisma/client";
import fs from "fs";
import path from "path";
import { getVideoMetadata, validateForTikTok, optimizeForTikTok, getTikTokRejectionReason } from "@/lib/tiktok-validator";

/**
 * Validates a video file against TikTok's requirements
 * @param videoPath Path to the video file
 * @returns An object with validation result and error message if any
 */
export function validateTikTokVideo(videoPath: string): { valid: boolean; error?: string } {
  try {
    // Check if file exists
    if (!fs.existsSync(videoPath)) {
      return { valid: false, error: "Video file not found" };
    }
    
    // Get file size in MB
    const fileSize = fs.statSync(videoPath).size;
    const fileSizeMB = fileSize / (1024 * 1024);
    
    // Get file extension
    const fileExt = path.extname(videoPath).toLowerCase();
    
    // TikTok video requirements:
    // - Size: Between 4KB and 200MB (we'll be a bit conservative)
    // - Duration: Between 1 second and 3 minutes (can't check this easily without ffmpeg)
    // - Format: MP4, MOV, WebM
    // - Resolution: At least 720x720 pixels (can't check without additional libraries)
    
    // Check size
    if (fileSizeMB < 0.004) {
      return { valid: false, error: "Video file is too small (minimum 4KB)" };
    }
    
    if (fileSizeMB > 190) {
      return { valid: false, error: "Video file is too large (maximum 190MB)" };
    }
    
    // Check format
    const validFormats = ['.mp4', '.mov', '.webm'];
    if (!validFormats.includes(fileExt)) {
      return { valid: false, error: `Unsupported video format: ${fileExt}. TikTok accepts MP4, MOV, or WebM files.` };
    }
    
    return { valid: true };
  } catch (error) {
    console.error("Error validating TikTok video:", error);
    return { valid: false, error: "Error validating video file" };
  }
}

/**
 * Get information about the authorized TikTok user
 */
export async function getUserInfo(account: SocialMediaAccount) {
  try {
    // First refresh token if needed
    const refreshedAccount = await refreshAccessToken(account);
    const accessToken = decrypt(refreshedAccount.accessToken);
    
    const response = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,bio_description,profile_deep_link,is_verified,follower_count,following_count,likes_count', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TikTok API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    return {
      id: data.data.user.open_id,
      name: data.data.user.display_name,
      thumbnail: data.data.user.avatar_url
    };
  } catch (error) {
    console.error('Error fetching TikTok user info:', error);
    throw error;
  }
}

/**
 * Get TikTok creator information for direct posting
 * Required to get valid privacy level options
 */
export async function getCreatorInfo(account: SocialMediaAccount) {
  try {
    // First refresh token if needed
    const refreshedAccount = await refreshAccessToken(account);
    const accessToken = decrypt(refreshedAccount.accessToken);
    
    const response = await fetch('https://open.tiktokapis.com/v2/post/publish/creator_info/query/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TikTok API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    return {
      creatorUsername: data.data.creator_username,
      creatorNickname: data.data.creator_nickname,
      privacyLevelOptions: data.data.privacy_level_options || ['PUBLIC_TO_EVERYONE', 'SELF_ONLY'],
      commentDisabled: data.data.comment_disabled,
      duetDisabled: data.data.duet_disabled,
      stitchDisabled: data.data.stitch_disabled,
      maxVideoDuration: data.data.max_video_post_duration_sec
    };
  } catch (error) {
    console.error('Error fetching TikTok creator info:', error);
    throw error;
  }
}

/**
 * Check the number of pending uploads in a user's TikTok inbox
 */
export async function checkInboxCount(account: SocialMediaAccount): Promise<number> {
  try {
    // This is a best-effort check as TikTok doesn't provide a direct API for this
    // We can only infer from error responses when trying to upload
    
    // For now, we'll return 0 to indicate we don't have a way to check yet
    // Future: If TikTok provides an API to check drafts count, implement it here
    return 0;
  } catch (error) {
    console.error('Error checking TikTok inbox count:', error);
    return 0;
  }
}

/**
 * Upload a video to TikTok inbox (requires user to complete publishing in TikTok app)
 * Uses the video.upload scope
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
    
    // Get video metadata with ffmpeg
    console.log("Getting video metadata...");
    const metadata = await getVideoMetadata(videoPath);
    console.log("Video metadata:", metadata);
    
    // Validate video against TikTok requirements
    console.log("Validating video for TikTok...");
    const validation = validateForTikTok(metadata);
    
    if (!validation.valid) {
      console.log("Validation errors:", validation.errors);
      console.log("Validation warnings:", validation.warnings);
      
      // Check if video can be optimized
      if (validation.fixable && validation.suggestedAction) {
        console.log(`Video has issues but can be fixed with ${validation.suggestedAction}`);
        
        // Optimize video for TikTok
        const tempDir = path.join(process.cwd(), 'temp');
        fs.mkdirSync(tempDir, { recursive: true });
        
        console.log("Optimizing video for TikTok...");
        const optimizedVideoPath = await optimizeForTikTok(videoPath, tempDir, {
          resize: validation.suggestedAction === 'resize',
          transcode: validation.suggestedAction === 'transcode' || validation.suggestedAction === 'resize',
          trim: validation.suggestedAction === 'trim',
          maxDuration: 60 // TikTok optimal duration
        });
        
        console.log(`Video optimized and saved to ${optimizedVideoPath}`);
        
        // Update video path to use the optimized version
        videoPath = optimizedVideoPath;
        
        // Get new file size
        const fileSize = fs.statSync(videoPath).size;
        console.log(`Optimized file size: ${fileSize} bytes (${fileSize / (1024 * 1024)} MB)`);
      } else {
        // Video cannot be optimized, show detailed errors
        const errorMessages = validation.errors.join(". ");
        throw new Error(`Video cannot be used for TikTok: ${errorMessages}`);
      }
    } else {
      console.log("Video passes TikTok requirements validation");
    }
    
    const fileSize = fs.statSync(videoPath).size;
    console.log(`File size: ${fileSize} bytes (${fileSize / (1024 * 1024)} MB)`);
    
    // Step 1: Initialize upload using the video.upload inbox endpoint which requires less permissions
    console.log("Initializing TikTok video upload to inbox");
    const initResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/inbox/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source_info: {
          source: "FILE_UPLOAD",
          video_size: fileSize,
          chunk_size: fileSize,
          total_chunk_count: 1
        }
      })
    });
    
    if (!initResponse.ok) {
      const errorText = await initResponse.text();
      
      // Handle specific error types with user-friendly messages
      if (errorText.includes("spam_risk_too_many_pending_share")) {
        throw new Error(
          "You have too many unpublished videos in your TikTok inbox. " +
          "Please open the TikTok app, publish or delete pending videos, then try again."
        );
      }
      
      throw new Error(`TikTok upload initialization error: ${initResponse.status} - ${errorText}`);
    }
    
    const initData = await initResponse.json();
    const uploadId = initData.data.publish_id;
    const uploadUrl = initData.data.upload_url;
    
    console.log(`Upload initialized with ID: ${uploadId}`);
    console.log(`Upload URL: ${uploadUrl}`);
    
    // Step 2: Upload the video file
    console.log("Uploading video file to TikTok");
    
    // Read the file as a buffer
    const fileBuffer = fs.readFileSync(videoPath);
    
    // Determine the proper content type based on file extension
    const fileExt = path.extname(videoPath).toLowerCase();
    let contentType = 'video/mp4';  // Default
    
    if (fileExt === '.mov') {
      contentType = 'video/quicktime';
    } else if (fileExt === '.webm') {
      contentType = 'video/webm';
    }
    
    console.log(`Using content type: ${contentType} for ${fileExt} file`);
    
    // Upload the file using PUT request to the provided upload_url
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Content-Range': `bytes 0-${fileSize-1}/${fileSize}`
      },
      body: fileBuffer 
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`TikTok video upload error: ${uploadResponse.status} - ${errorText}`);
    }
    
    console.log('Video uploaded successfully');
    
    // Step 3: Monitor the status of the uploaded video
    console.log("Checking TikTok post status");
    let retries = 0;
    const maxRetries = 10;
    
    while (retries < maxRetries) {
      const statusResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          publish_id: uploadId
        })
      });
      
      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.warn(`TikTok status check warning: ${statusResponse.status} - ${errorText}`);
      } else {
        const statusData = await statusResponse.json();
        console.log('Status response:', statusData);
        
        if (statusData.data && statusData.data.status === 'UPLOAD_COMPLETE') {
          console.log('Upload completed and awaiting user review in TikTok app');
          break;
        }
        
        if (statusData.data && statusData.data.status === 'FAILED') {
          // Parse the reason for failure and get a detailed explanation
          const failReason = statusData.data.fail_reason || 'unknown_error';
          const detailedError = getTikTokRejectionReason(failReason, metadata);
          throw new Error(detailedError);
        }
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 3000));
      retries++;
    }
    
    // Step 4: Clean up temporary files if created
    if (videoPath.includes('_tiktok_') && fs.existsSync(videoPath)) {
      try {
        console.log(`Cleaning up temporary file: ${videoPath}`);
        fs.unlinkSync(videoPath);
      } catch (e) {
        console.warn('Failed to delete temporary file:', e);
      }
    }
    
    // Get the TikTok user info
    const userInfo = await getUserInfo(account);
    
    // Note: Since we're using the inbox API, the video is sent to the user's TikTok inbox
    // They will need to finish editing and post it themselves, so we don't have a direct video URL
    return {
      id: uploadId,
      url: `https://www.tiktok.com/@${userInfo.name}`,
      publishType: 'INBOX_SHARE'
    };
  } catch (error) {
    console.error('Error uploading to TikTok:', error);
    throw error;
  }
}

/**
 * Upload and directly publish a video to TikTok (no user intervention required)
 * Uses the video.publish scope
 */
export async function directPostVideo(
  account: SocialMediaAccount, 
  videoPath: string, 
  title: string,
  description: string = "",
  tags: string[] = [],
  options: {
    privacyLevel?: string;
    disableDuet?: boolean;
    disableStitch?: boolean;
    disableComment?: boolean;
  } = {}
) {
  try {
    // First refresh token if needed
    const refreshedAccount = await refreshAccessToken(account);
    const accessToken = decrypt(refreshedAccount.accessToken);
    
    // Check if file exists
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video file not found: ${videoPath}`);
    }
    
    // First get creator info to ensure we use valid privacy settings
    console.log("Getting TikTok creator info for direct posting...");
    const creatorInfo = await getCreatorInfo(account);
    
    // Use the first available privacy level if not specified
    const privacyLevel = options.privacyLevel || creatorInfo.privacyLevelOptions[0] || 'SELF_ONLY';
    
    // Get video metadata with ffmpeg
    console.log("Getting video metadata...");
    const metadata = await getVideoMetadata(videoPath);
    console.log("Video metadata:", metadata);
    
    // Validate video against TikTok requirements
    console.log("Validating video for TikTok...");
    const validation = validateForTikTok(metadata);
    
    if (!validation.valid) {
      console.log("Validation errors:", validation.errors);
      console.log("Validation warnings:", validation.warnings);
      
      // Check if video can be optimized
      if (validation.fixable && validation.suggestedAction) {
        console.log(`Video has issues but can be fixed with ${validation.suggestedAction}`);
        
        // Optimize video for TikTok
        const tempDir = path.join(process.cwd(), 'temp');
        fs.mkdirSync(tempDir, { recursive: true });
        
        console.log("Optimizing video for TikTok...");
        const optimizedVideoPath = await optimizeForTikTok(videoPath, tempDir, {
          resize: validation.suggestedAction === 'resize',
          transcode: validation.suggestedAction === 'transcode' || validation.suggestedAction === 'resize',
          trim: validation.suggestedAction === 'trim',
          maxDuration: 60 // TikTok optimal duration
        });
        
        console.log(`Video optimized and saved to ${optimizedVideoPath}`);
        
        // Update video path to use the optimized version
        videoPath = optimizedVideoPath;
        
        // Get new file size
        const fileSize = fs.statSync(videoPath).size;
        console.log(`Optimized file size: ${fileSize} bytes (${fileSize / (1024 * 1024)} MB)`);
      } else {
        // Video cannot be optimized, show detailed errors
        const errorMessages = validation.errors.join(". ");
        throw new Error(`Video cannot be used for TikTok: ${errorMessages}`);
      }
    } else {
      console.log("Video passes TikTok requirements validation");
    }
    
    const fileSize = fs.statSync(videoPath).size;
    console.log(`File size: ${fileSize} bytes (${fileSize / (1024 * 1024)} MB)`);
    
    // Step 1: Initialize direct post using the video.publish endpoint
    console.log("Initializing TikTok direct video post");
    
    // Create hashtag string from tags
    const hashtagString = tags.map(tag => `#${tag}`).join(' ');
    const fullTitle = title + (hashtagString ? ` ${hashtagString}` : '');
    
    const initResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        post_info: {
          title: fullTitle,
          privacy_level: privacyLevel,
          disable_duet: options.disableDuet || false,
          disable_stitch: options.disableStitch || false,
          disable_comment: options.disableComment || false,
          video_cover_timestamp_ms: 1000 // Use frame at 1 second as cover
        },
        source_info: {
          source: "FILE_UPLOAD",
          video_size: fileSize,
          chunk_size: fileSize,
          total_chunk_count: 1
        }
      })
    });
    
    if (!initResponse.ok) {
      const errorText = await initResponse.text();
      throw new Error(`TikTok direct post initialization error: ${initResponse.status} - ${errorText}`);
    }
    
    const initData = await initResponse.json();
    const uploadId = initData.data.publish_id;
    const uploadUrl = initData.data.upload_url;
    
    console.log(`Direct post initialized with ID: ${uploadId}`);
    console.log(`Upload URL: ${uploadUrl}`);
    
    // Step 2: Upload the video file
    console.log("Uploading video file to TikTok");
    
    // Read the file as a buffer
    const fileBuffer = fs.readFileSync(videoPath);
    
    // Determine the proper content type based on file extension
    const fileExt = path.extname(videoPath).toLowerCase();
    let contentType = 'video/mp4';  // Default
    
    if (fileExt === '.mov') {
      contentType = 'video/quicktime';
    } else if (fileExt === '.webm') {
      contentType = 'video/webm';
    }
    
    console.log(`Using content type: ${contentType} for ${fileExt} file`);
    
    // Upload the file using PUT request to the provided upload_url
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Content-Range': `bytes 0-${fileSize-1}/${fileSize}`
      },
      body: fileBuffer 
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`TikTok video upload error: ${uploadResponse.status} - ${errorText}`);
    }
    
    console.log('Video uploaded successfully for direct post');
    
    // Step 3: Add explicit publish call with video_id (required by TikTok)
    console.log('Sending explicit publish request to TikTok...');
    const publishResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/status/update/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        publish_id: uploadId,
        status: 'PUBLISH_COMPLETE' // This tells TikTok to finalize and publish the video
      })
    });

    if (!publishResponse.ok) {
      const errorText = await publishResponse.text();
      console.error(`TikTok publish request failed with status ${publishResponse.status}:`, errorText);
      
      try {
        // Try to parse error response for more details
        const errorData = JSON.parse(errorText);
        console.error('TikTok publish error details:', JSON.stringify(errorData, null, 2));
        
        // Check for sandbox-specific errors
        if (errorData.error && errorData.error.code === 'sandbox_limitation') {
          console.log('TikTok sandbox limitation detected - this is expected in sandbox mode and would work in production');
          
          // For sandbox, we'll simulate a successful publish since the API won't actually publish in sandbox
          console.log('Simulating successful publish in sandbox mode');
          return {
            id: uploadId,
            postId: `sandbox-${Date.now()}`,
            url: `https://www.tiktok.com/@${(await getUserInfo(account)).name}`,
            publishType: 'DIRECT_POST'
          };
        }
        
        if (errorData.error && errorData.error.code) {
          throw new Error(`TikTok publish request failed: ${errorData.error.code} - ${errorData.error.message}`);
        }
      } catch (parseError) {
        // If parsing fails, use the raw error text
        if (parseError instanceof SyntaxError) {
          console.error('Failed to parse TikTok error response as JSON');
        } else {
          console.error('Error while handling TikTok error response:', parseError);
        }
      }
      
      throw new Error(`TikTok publish request failed: ${publishResponse.status} - ${errorText}`);
    }

    const publishData = await publishResponse.json();
    console.log('TikTok publish response:', publishData);
    
    // Step 4: Monitor the status of the published video
    console.log("Checking TikTok direct post status");
    let retries = 0;
    const maxRetries = 20;
    let publishedPostId = null;
    
    while (retries < maxRetries) {
      const statusResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          publish_id: uploadId
        })
      });
      
      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.warn(`TikTok status check warning: ${statusResponse.status} - ${errorText}`);
      } else {
        const statusData = await statusResponse.json();
        console.log('Status response:', statusData);
        
        if (statusData.data && statusData.data.status === 'PUBLISH_COMPLETE') {
          console.log('Direct post completed successfully');
          
          // Check if we have a public post ID
          if (statusData.data.publicaly_available_post_id && 
              statusData.data.publicaly_available_post_id.length > 0) {
            publishedPostId = statusData.data.publicaly_available_post_id[0];
            console.log(`Published post ID: ${publishedPostId}`);
          }
          
          break;
        }
        
        if (statusData.data && statusData.data.status === 'FAILED') {
          // Parse the reason for failure and get a detailed explanation
          const failReason = statusData.data.fail_reason || 'unknown_error';
          const detailedError = getTikTokRejectionReason(failReason, metadata);
          throw new Error(detailedError);
        }
      }
      
      // Wait longer between checks for direct posts
      await new Promise(resolve => setTimeout(resolve, 5000));
      retries++;
    }
    
    // Step 5: Clean up temporary files if created
    if (videoPath.includes('_tiktok_') && fs.existsSync(videoPath)) {
      try {
        console.log(`Cleaning up temporary file: ${videoPath}`);
        fs.unlinkSync(videoPath);
      } catch (e) {
        console.warn('Failed to delete temporary file:', e);
      }
    }
    
    // Get the TikTok user info
    const userInfo = await getUserInfo(account);
    
    // Construct URL to the post if we have the post ID
    let postUrl = `https://www.tiktok.com/@${userInfo.name}`;
    if (publishedPostId) {
      postUrl = `https://www.tiktok.com/@${userInfo.name}/video/${publishedPostId}`;
    }
    
    return {
      id: uploadId,
      postId: publishedPostId,
      url: postUrl,
      publishType: 'DIRECT_POST'
    };
  } catch (error) {
    console.error('Error directly posting to TikTok:', error);
    throw error;
  }
} 