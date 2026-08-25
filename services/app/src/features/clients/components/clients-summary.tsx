'use client'

import type { Case, Client } from '@/features/cases/types'
import { summarizeClients } from '@/features/cases/utils/clients'

type ClientsSummaryProps = {
  clients: Client[]
  cases: Case[]
}

export function ClientsSummary({ clients, cases }: ClientsSummaryProps) {
  const summary = summarizeClients(clients, cases)

  const items = [
    { key: 'total', label: 'کل موکل‌ها', value: summary.total },
    {
      key: 'active',
      label: 'دارای پرونده فعال',
      value: summary.withActiveCase,
    },
    {
      key: 'without',
      label: 'بدون پرونده',
      value: summary.withoutCase,
    },
  ] as const

  return (
    <div className='grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3'>
      {items.map((item) => (
        <div
          key={item.key}
          className='rounded-lg border bg-background/60 px-3 py-3 sm:px-4'
        >
          <p className='text-[11px] text-muted-foreground sm:text-xs'>
            {item.label}
          </p>
          <p className='mt-1 text-xl font-semibold tracking-tight tabular-nums sm:text-2xl'>
            {item.value.toLocaleString('fa-IR')}
          </p>
        </div>
      ))}
    </div>
  )
}
