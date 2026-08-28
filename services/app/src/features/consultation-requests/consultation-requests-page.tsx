'use client'

import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useConsultationRequestsHydration } from './hooks/use-consultation-requests-hydration'
import { useConsultationRequestsStore } from './stores/consultation-requests-store'
import type { ConsultationRequest } from './types'
import { RequestDetailSheet } from './components/request-detail-sheet'
import { RequestsEmptyState } from './components/requests-empty-state'
import { RequestsSummary } from './components/requests-summary'
import { RequestsTable } from './components/requests-table'

export function ConsultationRequestsPage() {
  const { hydrated } = useConsultationRequestsHydration(true)
  const requests = useConsultationRequestsStore((state) => state.requests)
  const error = useConsultationRequestsStore((state) => state.error)
  const [selected, setSelected] = useState<ConsultationRequest | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  function handleSelect(request: ConsultationRequest) {
    setSelected(request)
    setDetailOpen(true)
  }

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='min-w-0'>
          <h2 className='font-display text-xl font-bold tracking-tight sm:text-2xl'>
            درخواست‌ها
          </h2>
          <p className='mt-1 text-sm text-muted-foreground sm:text-base'>
            درخواست‌های مشاوره از لندینگ را بررسی کنید و با متقاضیان تماس
            بگیرید.
          </p>
        </div>

        {!hydrated ? (
          <div className='space-y-4'>
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className='h-20 rounded-lg' />
              ))}
            </div>
            <Skeleton className='h-64 w-full rounded-lg' />
          </div>
        ) : error ? (
          <div className='rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-6 text-sm text-destructive'>
            {error}
          </div>
        ) : requests.length === 0 ? (
          <RequestsEmptyState />
        ) : (
          <>
            <RequestsSummary requests={requests} />
            <RequestsTable requests={requests} onSelect={handleSelect} />
          </>
        )}
      </Main>

      <RequestDetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        request={selected}
      />
    </>
  )
}
