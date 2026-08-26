'use client'

import { Skeleton } from '@/components/ui/skeleton'

export function FinancialLoadingState() {
  return (
    <div
      className='space-y-4'
      aria-busy='true'
      aria-live='polite'
      aria-label='در حال بارگذاری مالی'
    >
      <p className='sr-only'>در حال بارگذاری دفتر مالی...</p>
      <Skeleton className='h-28 w-full rounded-xl' />
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'>
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className='h-28 rounded-xl' />
        ))}
      </div>
      <div className='grid gap-4 lg:grid-cols-2'>
        <Skeleton className='h-72 w-full rounded-xl' />
        <Skeleton className='h-72 w-full rounded-xl' />
      </div>
      <Skeleton className='h-40 w-full rounded-xl' />
      <Skeleton className='h-64 w-full rounded-xl' />
    </div>
  )
}
