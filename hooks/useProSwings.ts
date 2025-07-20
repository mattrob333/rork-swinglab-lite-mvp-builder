import { useState, useEffect } from 'react'
import { listProSwings } from '@/services/proSwingStore'
import { ProSwing } from '@/types/video'

/**
 * Simple React hook for fetching pro swing videos
 * Provides loading states and error handling without React Query
 */
export function useProSwings() {
  const [data, setData] = useState<ProSwing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchProSwings = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const swings = await listProSwings()
        
        if (isMounted) {
          setData(swings)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch pro swings'))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchProSwings()

    return () => {
      isMounted = false
    }
  }, [])

  return {
    data,
    isLoading,
    error,
    refetch: () => {
      // Simple refetch implementation
      setIsLoading(true)
      listProSwings().then(setData).catch(setError).finally(() => setIsLoading(false))
    }
  }
}

/**
 * Hook for uploading new pro swing videos
 * Simple implementation without React Query mutations
 */
export function useUploadProSwing() {
  const [isUploading, setIsUploading] = useState(false)
  
  return {
    uploadProSwing: async () => {
      setIsUploading(true)
      // TODO: Implement actual upload logic
      setIsUploading(false)
    },
    isUploading
  }
}
