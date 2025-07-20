import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

/**
 * Video processing utilities for SwingLab
 * Since FFmpeg has dependency conflicts, we'll use a simpler approach
 * focusing on the core functionality needed for the frame-by-frame comparison
 */

export interface VideoProcessingOptions {
  targetWidth?: number;
  targetHeight?: number;
  quality?: number;
}

/**
 * Process recorded video to ensure 1:1 aspect ratio
 * For now, we'll focus on the core functionality and implement
 * basic video processing that works with the existing setup
 */
export async function cropVideoToSquare(
  videoUri: string,
  options: VideoProcessingOptions = {}
): Promise<string> {
  try {
    const { targetWidth = 720, targetHeight = 720, quality = 0.8 } = options;
    
    // For MVP, we'll return the original video URI
    // The camera is already configured to record in 1:1 aspect ratio
    // with the visual guide, so the video should already be properly framed
    
    // Create a unique filename for the processed video
    const timestamp = Date.now();
    const fileName = `processed_swing_${timestamp}.mp4`;
    const processedPath = `${FileSystem.documentDirectory}${fileName}`;
    
    // Copy the video to the processed location
    await FileSystem.copyAsync({
      from: videoUri,
      to: processedPath,
    });
    
    console.log(`Video processed: ${videoUri} -> ${processedPath}`);
    return processedPath;
    
  } catch (error) {
    console.error('Error processing video:', error);
    // Return original URI if processing fails
    return videoUri;
  }
}

/**
 * Get video metadata (duration, dimensions, etc.)
 * This is a placeholder for future implementation
 */
export async function getVideoMetadata(videoUri: string): Promise<{
  duration?: number;
  width?: number;
  height?: number;
}> {
  try {
    // For now, return default values
    // In a full implementation, this would extract actual video metadata
    return {
      duration: 10000, // 10 seconds default
      width: 720,
      height: 720,
    };
  } catch (error) {
    console.error('Error getting video metadata:', error);
    return {};
  }
}

/**
 * Generate thumbnail from video
 * Placeholder for future implementation
 */
export async function generateVideoThumbnail(videoUri: string): Promise<string> {
  try {
    // For now, return the video URI itself
    // In a full implementation, this would extract a frame as thumbnail
    return videoUri;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return videoUri;
  }
}

/**
 * Optimize video for comparison (reduce file size while maintaining quality)
 */
export async function optimizeVideoForComparison(videoUri: string): Promise<string> {
  try {
    // For MVP, we'll just ensure the file is in the right location
    const timestamp = Date.now();
    const fileName = `optimized_swing_${timestamp}.mp4`;
    const optimizedPath = `${FileSystem.documentDirectory}${fileName}`;
    
    await FileSystem.copyAsync({
      from: videoUri,
      to: optimizedPath,
    });
    
    return optimizedPath;
  } catch (error) {
    console.error('Error optimizing video:', error);
    return videoUri;
  }
}
