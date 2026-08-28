'use client'

import type { ConsultationRequest } from '../types'
import { summarizeConsultationRequests } from '../stores/consultation-requests-store'

type RequestsSummaryProps = {
  requests: ConsultationRequest[]
}

export function RequestsSummary({ requests }: RequestsSummaryProps) {
  const summary = summarizeConsultationRequests(requests)

  const cards = [
    {
      label: 'درخواست‌های جدید',
      value: summary.newCount,
      hint: 'هنوز بررسی نشده',
    },
    {
      label: 'در انتظار تماس',
      value: summary.pendingContactCount,
      hint: 'جدید یا در حال بررسی',
    },
    {
      label: 'این هفته',
      value: summary.thisWeekCount,
      hint: 'ثبت‌شده در ۷ روز اخیر',
    },
  ]

  return (
    <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
      {cards.map((card) => (
        <div
          key={card.label}
          className='rounded-lg border bg-card px-4 py-3 shadow-sm'
        >
          <p className='text-sm text-muted-foreground'>{card.label}</p>
          <p className='mt-1 font-display text-2xl font-bold tabular-nums'>
            {card.value}
          </p>
          <p className='mt-1 text-xs text-muted-foreground'>{card.hint}</p>
        </div>
      ))}
    </div>
  )
}
