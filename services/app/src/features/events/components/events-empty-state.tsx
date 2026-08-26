'use client'

import { CalendarDays, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useEventsUi } from './events-provider'

export function EventsEmptyState() {
  const { setOpen } = useEventsUi()

  return (
    <div className='flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center sm:py-20'>
      <div className='mb-4 flex size-12 items-center justify-center rounded-full bg-muted'>
        <CalendarDays className='size-5 text-muted-foreground' />
      </div>
      <h3 className='text-lg font-semibold tracking-tight'>
        هنوز رویدادی ثبت نکرده‌اید
      </h3>
      <p className='mt-2 max-w-md text-sm leading-6 text-muted-foreground'>
        جلسات، دادگاه‌ها و مهلت‌های مهم خود را ثبت کنید تا برنامه کاری شما همیشه
        مرتب باشد.
      </p>
      <Button
        className='mt-6 w-full sm:w-auto'
        onClick={() => {
          setOpen('create')
          toast.message('فرم ایجاد رویداد در فاز بعدی فعال می‌شود.')
        }}
      >
        <Plus className='size-4' />
        ایجاد رویداد
      </Button>
    </div>
  )
}
