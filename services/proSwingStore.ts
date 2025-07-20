import { supabase } from '@/lib/supabase'
import { ProSwing } from '@/types/video'

const BUCKET_NAME = 'swinglab-pro-swings'

export interface ProSwingMetadata {
  player: string
  duration?: number
}

/**
 * Fetch all pro swing videos from Supabase Storage
 * Returns metadata with signed URLs for video access
 */
export async function listProSwings(): Promise<ProSwing[]> {
  try {
    // Query the pro_swings table directly
    const { data: proSwingsData, error: queryError } = await supabase
      .from('pro_swings')
      .select('*')
      .order('player_name')

    if (queryError) {
      console.error('Error querying pro swings:', queryError)
      // Fallback to static data if database query fails
      return getStaticProSwings()
    }

    if (!proSwingsData || proSwingsData.length === 0) {
      console.warn('No pro swing videos found in database, using static data')
      return getStaticProSwings()
    }

    // Convert database records to ProSwing objects with signed URLs
    const proSwings: ProSwing[] = []
    
    for (const record of proSwingsData) {
      try {
        // Get signed URL for the video file
        const { data: signedUrlData } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(record.file_name, 3600) // 1 hour expiry
        
        if (signedUrlData?.signedUrl) {
          proSwings.push({
            id: record.id,
            uri: signedUrlData.signedUrl,
            thumbnail: signedUrlData.signedUrl, // Use video as thumbnail for now
            name: record.player_name, // Use player name as the display name
            player: record.player_name,
            duration: record.duration_seconds,
          })
        }
      } catch (fileError) {
        console.warn(`Could not get signed URL for ${record.file_name}:`, fileError)
        // Continue with other files
      }
    }

    // If we got some videos from database, return them; otherwise fallback
    if (proSwings.length > 0) {
      console.log(`Loaded ${proSwings.length} pro swings from Supabase`)
      return proSwings
    } else {
      console.warn('No accessible video files found, using static data')
      return getStaticProSwings()
    }

  } catch (error) {
    console.error('Error fetching pro swings:', error)
    // Fallback to static data on any error
    return getStaticProSwings()
  }
}

/**
 * Upload a new pro swing video to Supabase Storage
 */
export async function uploadProSwing(
  file: Blob | File,
  metadata: ProSwingMetadata
): Promise<ProSwing | null> {
  try {
    // Generate filename from metadata
    const timestamp = Date.now()
    const filename = `${metadata.player.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.mp4`

    // Upload file to Supabase Storage
    // Temporarily disabled until Supabase is properly installed
    console.log('Upload temporarily disabled - would upload:', { file, metadata })
    return null
  } catch (error) {
    console.error('Error uploading pro swing:', error)
    return null
  }
  
  /*
  // Original Supabase upload code - commented out until dependency is installed
  try {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading pro swing:', uploadError)
      return null
    }

    // Get signed URL for the uploaded file
    const { data: signedUrlData } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filename, 3600)

    if (!signedUrlData?.signedUrl) {
      console.error('Error generating signed URL for uploaded file')
      return null
    }

    // Return ProSwing object
    return {
      id: uploadData.id || filename,
      uri: signedUrlData.signedUrl,
      thumbnail: signedUrlData.signedUrl,
      name: metadata.name,
      player: metadata.player,
      duration: metadata.duration,
    }

  } catch (error) {
    console.error('Error uploading pro swing:', error)
    return null
  }
  */
}

/**
 * Parse metadata from filename (fallback method)
 */
function parseMetadataFromFilename(filename: string): ProSwingMetadata {
  // Remove extension and split by underscores
  const parts = filename.replace('.mp4', '').split('_')
  
  return {
    player: parts[0]?.replace(/\_/g, ' ') || 'Professional',
    duration: undefined,
  }
}

/**
 * Fallback to static pro swings data when cloud storage is unavailable
 */
function getStaticProSwings(): ProSwing[] {
  return [
    {
      id: "1",
      uri: "https://assets.mixkit.co/videos/preview/mixkit-golf-player-hitting-the-ball-40107-large.mp4",
      thumbnail: "https://assets.mixkit.co/videos/preview/mixkit-golf-player-hitting-the-ball-40107-large.mp4",
      name: "Power Swing",
      player: "Mike Trout",
    },
    {
      id: "2",
      uri: "https://assets.mixkit.co/videos/preview/mixkit-golf-player-hitting-the-ball-40107-large.mp4",
      thumbnail: "https://assets.mixkit.co/videos/preview/mixkit-golf-player-hitting-the-ball-40107-large.mp4",
      name: "Contact Swing",
      player: "Mookie Betts",
    },
    {
      id: "3",
      uri: "https://assets.mixkit.co/videos/preview/mixkit-golf-player-hitting-the-ball-40107-large.mp4",
      thumbnail: "https://assets.mixkit.co/videos/preview/mixkit-golf-player-hitting-the-ball-40107-large.mp4",
      name: "Home Run Swing",
      player: "Aaron Judge",
    },
    {
      id: "4",
      uri: "https://assets.mixkit.co/videos/preview/mixkit-golf-player-hitting-the-ball-40107-large.mp4",
      thumbnail: "https://assets.mixkit.co/videos/preview/mixkit-golf-player-hitting-the-ball-40107-large.mp4",
      name: "Speed Swing",
      player: "Ronald Acuña Jr.",
    },
    {
      id: "5",
      uri: "https://assets.mixkit.co/videos/preview/mixkit-golf-player-hitting-the-ball-40107-large.mp4",
      thumbnail: "https://assets.mixkit.co/videos/preview/mixkit-golf-player-hitting-the-ball-40107-large.mp4",
      name: "Clutch Swing",
      player: "Freddie Freeman",
    },
  ]
}
