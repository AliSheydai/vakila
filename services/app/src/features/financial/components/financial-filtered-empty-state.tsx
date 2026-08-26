'use client'

import Link from 'next/link'
import { FilterX, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'

type FinancialFilteredEmptyStateProps = {
  onClearFilters: () => void
}

export function FinancialFilteredEmptyState({
  onClearFilters,
}: FinancialFilteredEmptyStateProps) {
  return (
    <div
      role='status'
      className='flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center'
    >
      <div className='mb-3 flex size-10 items-center justify-center rounded-full bg-muted'>
        <FilterX className='size-4 text-muted-foreground' aria-hidden />
      </div>
      <h3 className='text-base font-semibold tracking-tight'>
        نتیجه‌ای با این فیلتر یافت نشد
      </h3>
      <p className='mt-2 max-w-md text-sm leading-6 text-muted-foreground'>
        فیلترها را تغییر دهید یا پاک کنید تا تراکنش‌های بیشتری نمایش داده شود.
      </p>
      <Button
        type='button'
        variant='outline'
        className='mt-5'
        onClick={onClearFilters}
      >
        پاک‌کردن فیلترها
      </Button>
    </div>
  )
}

type FinancialRangeEmptyStateProps = {
  href?: string
}

export function FinancialRangeEmptyState({
  href = '/admin/cases',
}: FinancialRangeEmptyStateProps) {
  return (
    <div
      role='status'
      className='flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center'
    >
      <div className='mb-3 flex size-10 items-center justify-center rounded-full bg-muted'>
        <Wallet className='size-4 text-muted-foreground' aria-hidden />
      </div>
      <h3 className='text-base font-semibold tracking-tight'>
        در این بازه تراکنشی نیست
      </h3>
      <p className='mt-2 max-w-md text-sm leading-6 text-muted-foreground'>
        بازه دیگری را امتحان کنید یا از تب مالی پرونده‌ها دریافت و هزینه ثبت کنید.
      </p>
      <Button asChild variant='outline' className='mt-5'>
        <Link href={href}>رفتن به پرونده‌ها</Link>
      </Button>
    </div>
  )
}
