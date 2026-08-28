'use client'

import { useCallback, useEffect, useState } from 'react'
import type { CaseComment } from '@/features/client-portal/types'
import { useRealtimeSync } from '@/hooks/use-realtime'
import * as apiCases from '../services/api-cases-service'

export function useCaseComments(caseId: string, enabled = true) {
  const [comments, setComments] = useState<CaseComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!enabled) return
    const result = await apiCases.listCaseComments(caseId)
    if (!result.ok) {
      setError(result.error)
      setLoading(false)
      return
    }
    setComments(result.data)
    setError(null)
    setLoading(false)
  }, [caseId, enabled])

  useEffect(() => {
    if (!enabled) return
    setLoading(true)
    void load()
  }, [enabled, load])

  useRealtimeSync(
    (event) => {
      if (!enabled) return
      if (event.table === 'case_comments' || event.table === 'attachments') {
        void load()
      }
    },
    enabled
  )

  return { comments, loading, error, reload: load }
}
