import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import util from 'util';
import { v4 as uuidv4 } from 'uuid';

const execPromise = util.promisify(exec);

// TikTok video requirements based on documentation
const TIKTOK_REQUIREMENTS = {
  minDuration: 5, // seconds
  maxDuration: 60, // seconds (for optimal performance)
  minWidth: 720,
  minHeight: 1280,
  minAspectRatio: 9/16, // minimum aspect ratio (height/width)
  maxAspectRatio: 9/16, // maximum aspect ratio (height/width)
  preferredAspectRatio: 9/16,
  minFileSize: 4 * 1024, // 4KB
  maxFileSize: 190 * 1024 * 1024, // 190MB (slightly conservative from 200MB)
  supportedFormats: ['.mp4', '.mov', '.webm'],
  preferredFormat: '.mp4',
  minFrameRate: 24,
  preferredFrameRate: 30,
  preferredBitrate: '4M' // 4Mbps
};

interface VideoMetadata {
  width: number;
  height: number;
  duration: number;
  format: string;
  fileSize: number;
  frameRate: number;
  bitrate: number;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: VideoMetadata;
  fixable: boolean;
  suggestedAction?: 'resize' | 'transcode' | 'trim' | null;
}

/**
 * Get video metadata using FFmpeg
 */
export async function getVideoMetadata(filePath: string): Promise<VideoMetadata> {
  try {
    // Make sure file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Get file size
    const fileSize = fs.statSync(filePath).size;
    
    // Get format from extension
    const format = path.extname(filePath).toLowerCase();

    // Use FFmpeg to get video metadata
    const ffprobeCmd = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration,r_frame_rate,bit_rate -show_entries format=duration -of json "${filePath}"`;
    
    console.log(`Running ffprobe: ${ffprobeCmd}`);
    const { stdout } = await execPromise(ffprobeCmd);
    
    const data = JSON.parse(stdout);
    const stream = data.streams[0];
    
    // Parse frame rate (usually in format "30/1")
    let frameRate = 30;
    if (stream.r_frame_rate) {
      const fpsValues = stream.r_frame_rate.split('/');
      frameRate = parseInt(fpsValues[0]) / parseInt(fpsValues[1] || '1');
    }

    // Get duration from stream or format section
    const duration = parseFloat(stream.duration || data.format.duration || '0');
    
    // Get bitrate (convert to number)
    const bitrate = parseInt(stream.bit_rate || data.format.bit_rate || '0');
    
    return {
      width: stream.width,
      height: stream.height,
      duration,
      format,
      fileSize,
      frameRate,
      bitrate
    };
  } catch (error) {
    console.error('Error getting video metadata:', error);
    throw new Error(`Failed to get video metadata: ${error}`);
  }
}

/**
 * Validate video against TikTok requirements
 */
export function validateForTikTok(metadata: VideoMetadata): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let fixable = false;
  let suggestedAction: 'resize' | 'transcode' | 'trim' | null = null;

  // Check file size
  if (metadata.fileSize < TIKTOK_REQUIREMENTS.minFileSize) {
    errors.push(`Video file size too small (${(metadata.fileSize / 1024).toFixed(2)} KB). TikTok requires at least 4 KB.`);
  } else if (metadata.fileSize > TIKTOK_REQUIREMENTS.maxFileSize) {
    errors.push(`Video file size too large (${(metadata.fileSize / (1024 * 1024)).toFixed(2)} MB). TikTok accepts up to 200 MB.`);
    warnings.push('Large files may encounter upload problems or extended processing time.');
    fixable = true;
    suggestedAction = 'transcode';
  }

  // Check duration
  if (metadata.duration < TIKTOK_REQUIREMENTS.minDuration) {
    errors.push(`Video duration too short (${metadata.duration.toFixed(2)} seconds). TikTok requires at least ${TIKTOK_REQUIREMENTS.minDuration} seconds.`);
    fixable = false; // Can't fix too short videos
  } else if (metadata.duration > TIKTOK_REQUIREMENTS.maxDuration) {
    warnings.push(`Video is longer than ${TIKTOK_REQUIREMENTS.maxDuration} seconds, which may not be optimal for TikTok engagement.`);
    fixable = true;
    suggestedAction = 'trim';
  }

  // Check dimensions and aspect ratio
  const aspectRatio = metadata.height / metadata.width;
  
  if (metadata.width < TIKTOK_REQUIREMENTS.minWidth || metadata.height < TIKTOK_REQUIREMENTS.minHeight) {
    errors.push(`Video resolution (${metadata.width}x${metadata.height}) is too low. TikTok requires at least 720x1280 pixels.`);
    fixable = false; // Can't increase original resolution
  }
  
  if (Math.abs(aspectRatio - TIKTOK_REQUIREMENTS.preferredAspectRatio) > 0.01) {
    warnings.push(`Video aspect ratio (${aspectRatio.toFixed(2)}) is not optimal for TikTok. 9:16 (${TIKTOK_REQUIREMENTS.preferredAspectRatio}) is recommended.`);
    fixable = true;
    suggestedAction = 'resize';
  }

  // Check format
  if (!TIKTOK_REQUIREMENTS.supportedFormats.includes(metadata.format)) {
    errors.push(`Video format (${metadata.format}) not supported by TikTok. Supported formats: ${TIKTOK_REQUIREMENTS.supportedFormats.join(', ')}`);
    fixable = true;
    suggestedAction = 'transcode';
  } else if (metadata.format !== TIKTOK_REQUIREMENTS.preferredFormat) {
    warnings.push(`${metadata.format} format is supported but .mp4 is recommended for best compatibility.`);
    fixable = true;
    suggestedAction = 'transcode';
  }

  // Check frame rate
  if (metadata.frameRate < TIKTOK_REQUIREMENTS.minFrameRate) {
    warnings.push(`Frame rate (${metadata.frameRate.toFixed(2)} fps) is lower than recommended. At least ${TIKTOK_REQUIREMENTS.minFrameRate} fps is better.`);
    fixable = true;
    suggestedAction = 'transcode';
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    metadata,
    fixable,
    suggestedAction: errors.length > 0 || warnings.length > 0 ? suggestedAction : null
  };
}

/**
 * Process video to meet TikTok requirements
 */
export async function optimizeForTikTok(
  inputPath: string, 
  outputDir: string = path.dirname(inputPath),
  options: {
    resize?: boolean;
    transcode?: boolean;
    trim?: boolean;
    maxDuration?: number;
  } = {}
): Promise<string> {
  try {
    // Generate output filename
    const inputExt = path.extname(inputPath);
    const baseName = path.basename(inputPath, inputExt);
    const outputFilename = `${baseName}_tiktok_${uuidv4().substring(0, 8)}.mp4`;
    const outputPath = path.join(outputDir, outputFilename);
    
    // Get metadata
    const metadata = await getVideoMetadata(inputPath);
    
    // Build FFmpeg command
    let ffmpegArgs: string[] = [];
    
    // Input file
    ffmpegArgs.push(`-i "${inputPath}"`);
    
    // Video codec and quality settings
    ffmpegArgs.push('-c:v libx264 -preset medium -crf 23');
    
    // Audio codec
    ffmpegArgs.push('-c:a aac -b:a 128k');
    
    // Resize if needed and requested
    if (options.resize) {
      // Calculate dimensions maintaining 9:16 aspect ratio
      const targetWidth = 1080;
      const targetHeight = 1920;
      
      // Use the pad filter to add black bars if needed while preserving original content
      ffmpegArgs.push(`-vf "scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2:black"`);
    }
    
    // Trim if needed and requested
    if (options.trim && options.maxDuration && metadata.duration > options.maxDuration) {
      ffmpegArgs.push(`-t ${options.maxDuration}`);
    }
    
    // Framerate adjustment if needed
    if (metadata.frameRate < TIKTOK_REQUIREMENTS.preferredFrameRate) {
      ffmpegArgs.push(`-r ${TIKTOK_REQUIREMENTS.preferredFrameRate}`);
    }
    
    // Output file
    ffmpegArgs.push(`-y "${outputPath}"`);
    
    // Execute FFmpeg command
    const ffmpegCmd = `ffmpeg ${ffmpegArgs.join(' ')}`;
    console.log(`Running FFmpeg: ${ffmpegCmd}`);
    
    const { stdout, stderr } = await execPromise(ffmpegCmd);
    if (stderr) console.log('FFmpeg stderr:', stderr);
    
    // Verify the output file exists
    if (!fs.existsSync(outputPath)) {
      throw new Error('FFmpeg processing failed: output file not created.');
    }
    
    return outputPath;
  } catch (error) {
    console.error('Error optimizing video for TikTok:', error);
    throw new Error(`Failed to optimize video for TikTok: ${error}`);
  }
}

/**
 * Get detailed information about why a video might have been rejected by TikTok
 */
export function getTikTokRejectionReason(
  rejectionCode: string,
  metadata?: VideoMetadata
): string {
  switch (rejectionCode) {
    case 'picture_size_check_failed':
      return `Your video was rejected because it doesn't meet TikTok's size requirements. ${
        metadata 
          ? `Your video resolution is ${metadata.width}x${metadata.height}, aspect ratio ${(metadata.height/metadata.width).toFixed(2)}. ` 
          : ''
      }TikTok requires a resolution of at least 720x1280 with a 9:16 aspect ratio (portrait mode).`;
      
    case 'file_format_check_failed':
      return `Your video format ${metadata?.format || ''} is not supported by TikTok. Please use MP4 with H.264 encoding.`;
      
    case 'duration_check_failed':
      return `Your video duration ${metadata?.duration.toFixed(2) || ''} seconds doesn't meet TikTok requirements. Videos should be between 5 and 60 seconds for optimal performance.`;
      
    case 'frame_rate_check_failed':
      return `Your video frame rate of ${metadata?.frameRate.toFixed(2) || ''} fps is not supported by TikTok. Please use at least 24 fps, preferably 30 fps.`;
      
    case 'video_length_too_short':
      return 'Your video is too short for TikTok. Videos must be at least 5 seconds long.';
      
    case 'video_length_too_long':
      return 'Your video is too long for TikTok. While TikTok supports videos up to 10 minutes, shorter videos often perform better.';
      
    case 'video_resolution_too_low':
      return 'Your video resolution is too low for TikTok. Videos should have a resolution of at least 720x1280 pixels.';
      
    default:
      return `TikTok rejected the video (reason: ${rejectionCode}). Please ensure your video meets TikTok requirements.`;
  }
} 