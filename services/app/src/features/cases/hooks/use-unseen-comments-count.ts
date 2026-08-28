'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRealtimeSync } from '@/hooks/use-realtime'
import { api } from '@/lib/api-client'

export function useUnseenCommentsCount(caseId: string, enabled = true) {
  const [count, setCount] = useState(0)

  const load = useCallback(async () => {
    if (!enabled) return
    const result = await api<{ count: number }>(
      `/api/cases/${caseId}/comments/unseen`
    )
    if (result.ok) setCount(result.data.count)
  }, [caseId, enabled])

  useEffect(() => {
    void load()
  }, [load])

  useRealtimeSync(
    (event) => {
      if (!enabled) return
      if (event.table === 'case_comments') void load()
    },
    enabled
  )

  return { count, reload: load }
}
