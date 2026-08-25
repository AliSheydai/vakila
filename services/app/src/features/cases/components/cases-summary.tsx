'use client'

import type { Case } from '../types'

type CasesSummaryProps = {
  cases: Case[]
}

const items = [
  {
    key: 'total',
    label: 'کل پرونده‌ها',
    getValue: (cases: Case[]) => cases.length,
  },
  {
    key: 'active',
    label: 'فعال',
    getValue: (cases: Case[]) =>
      cases.filter((item) => item.status === 'active').length,
  },
  {
    key: 'awaiting',
    label: 'در انتظار اقدام',
    getValue: (cases: Case[]) =>
      cases.filter((item) => item.status === 'awaiting_action').length,
  },
  {
    key: 'closed',
    label: 'بسته‌شده',
    getValue: (cases: Case[]) =>
      cases.filter((item) => item.status === 'closed').length,
  },
] as const

export function CasesSummary({ cases }: CasesSummaryProps) {
  return (
    <div className='grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4'>
      {items.map((item) => (
        <div
          key={item.key}
          className='rounded-lg border bg-background/60 px-3 py-3 sm:px-4'
        >
          <p className='text-[11px] text-muted-foreground sm:text-xs'>
            {item.label}
          </p>
          <p className='mt-1 text-xl font-semibold tracking-tight tabular-nums sm:text-2xl'>
            {item.getValue(cases).toLocaleString('fa-IR')}
          </p>
        </div>
      ))}
    </div>
  )
}
