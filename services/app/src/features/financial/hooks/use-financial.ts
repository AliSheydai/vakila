'use client'

import { useMemo } from 'react'
import { useCasesHydration } from '@/features/cases/hooks/use-cases-hydration'
import { useCasesStore } from '@/features/cases/stores/cases-store'
import {
  createFinancialDateRange,
  createFinancialPayload,
} from '../services/financial-service'
import type { FinancialFilters, FinancialPreset } from '../types'
import { DEFAULT_FINANCIAL_FILTERS } from '../types'

type UseFinancialOptions = {
  preset: FinancialPreset
  customRange?: { from: Date; to: Date }
  filters?: FinancialFilters
}

export function useFinancial(options: UseFinancialOptions) {
  const { hydrated, ownerId } = useCasesHydration()

  const clients = useCasesStore((state) => state.clients)
  const cases = useCasesStore((state) => state.cases)
  const hydrateCases = useCasesStore((state) => state.hydrate)
  const error = useCasesStore((state) => state.error)

  const filters = options.filters ?? DEFAULT_FINANCIAL_FILTERS

  const range = useMemo(
    () =>
      createFinancialDateRange(options.preset, {
        custom: options.customRange,
      }),
    [options.customRange, options.preset]
  )

  const financial = useMemo(
    () =>
      createFinancialPayload(
        {
          clients,
          cases,
        },
        range,
        filters
      ),
    [cases, clients, filters, range]
  )

  const retry = () => {
    hydrateCases(ownerId)
  }

  return {
    hydrated,
    range,
    financial,
    error,
    retry,
    cases,
    clients,
  }
}
