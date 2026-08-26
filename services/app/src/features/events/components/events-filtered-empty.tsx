'use client'

import { SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEventsUi } from './events-provider'

type EventsFilteredEmptyProps = {
  totalCount: number
}

export function EventsFilteredEmpty({ totalCount }: EventsFilteredEmptyProps) {
  const { resetFilters } = useEventsUi()

  return (
    <div className='flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-14 text-center'>
      <div className='mb-3 flex size-10 items-center justify-center rounded-full bg-muted'>
        <SearchX className='size-4 text-muted-foreground' />
      </div>
      <h3 className='text-base font-semibold tracking-tight'>
        نتیجه‌ای یافت نشد
      </h3>
      <p className='mt-1 max-w-sm text-sm text-muted-foreground'>
        با فیلتر یا جستجوی فعلی هیچ رویدادی دیده نمی‌شود. از میان{' '}
        {totalCount.toLocaleString('fa-IR')} رویداد ذخیره‌شده، موردی با این
        شرایط نیست.
      </p>
      <Button type='button' variant='outline' className='mt-5' onClick={resetFilters}>
        پاک کردن فیلترها
      </Button>
    </div>
  )
}
