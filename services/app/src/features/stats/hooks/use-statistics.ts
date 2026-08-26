'use client'

import { useMemo } from 'react'
import { useCasesHydration } from '@/features/cases/hooks/use-cases-hydration'
import { useCasesStore } from '@/features/cases/stores/cases-store'
import { useEventsHydration } from '@/features/events/hooks/use-events-hydration'
import { useEventsStore } from '@/features/events/stores/events-store'
import {
  createStatisticsDateRange,
  createStatisticsPayload,
} from '../services/statistics-service'
import type { StatisticsPreset } from '../types'

type UseStatisticsOptions = {
  preset: StatisticsPreset
  customRange?: { from: Date; to: Date }
}

export function useStatistics(options: UseStatisticsOptions) {
  const { hydrated: casesHydrated } = useCasesHydration()
  const { hydrated: eventsHydrated } = useEventsHydration({ seedIfEmpty: false })

  const clients = useCasesStore((state) => state.clients)
  const cases = useCasesStore((state) => state.cases)
  const events = useEventsStore((state) => state.events)

  const range = useMemo(
    () =>
      createStatisticsDateRange(options.preset, {
        custom: options.customRange,
      }),
    [options.customRange, options.preset]
  )

  const payload = useMemo(
    () =>
      createStatisticsPayload(
        {
          clients,
          cases,
          events,
        },
        range
      ),
    [cases, clients, events, range]
  )

  return {
    hydrated: casesHydrated && eventsHydrated,
    range,
    statistics: payload,
  }
}
