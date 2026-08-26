'use client'

import { Skeleton } from '@/components/ui/skeleton'

export function StatsLoadingState() {
  return (
    <div className='space-y-4' aria-busy='true' aria-label='در حال بارگذاری آمار'>
      <Skeleton className='h-28 w-full rounded-xl' />
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'>
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className='h-28 rounded-xl' />
        ))}
      </div>
      <Skeleton className='h-40 w-full rounded-xl' />
    </div>
  )
}
