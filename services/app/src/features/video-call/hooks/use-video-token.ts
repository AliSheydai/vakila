'use client'

import { useCallback, useEffect, useState } from 'react'
import type { VideoTokenResponse } from '../types'

type UseVideoTokenOptions = {
  eventId: string
  skipWaiting?: boolean
  enabled?: boolean
}

type UseVideoTokenResult = {
  data: VideoTokenResponse | null
  error: string | null
  loading: boolean
  refetch: () => Promise<void>
}

export function useVideoToken({
  eventId,
  skipWaiting = false,
  enabled = true,
}: UseVideoTokenOptions): UseVideoTokenResult {
  const [data, setData] = useState<VideoTokenResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const refetch = useCallback(async () => {
    if (!enabled || !eventId) return
    setLoading(true)
    setError(null)
    try {
      const params = skipWaiting ? '?skipWaiting=1' : ''
      const res = await fetch(`/api/events/${eventId}/video-token${params}`, {
        credentials: 'include',
      })
      const json = (await res.json()) as {
        ok: boolean
        data?: VideoTokenResponse
        error?: string
      }
      if (!json.ok || !json.data) {
        setError(json.error ?? 'دریافت توکن تماس ناموفق بود.')
        setData(null)
        return
      }
      setData(json.data)
    } catch {
      setError('خطا در اتصال به سرور.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [enabled, eventId, skipWaiting])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { data, error, loading, refetch }
}
