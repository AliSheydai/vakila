'use client'

import Link from 'next/link'
import { BarChart3, Briefcase, CalendarDays, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function StatsEmptyState() {
  return (
    <div className='flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center sm:py-20'>
      <div className='mb-4 flex size-12 items-center justify-center rounded-full bg-muted'>
        <BarChart3 className='size-5 text-muted-foreground' />
      </div>
      <h3 className='text-lg font-semibold tracking-tight'>
        هنوز داده‌ای برای نمایش وجود ندارد
      </h3>
      <p className='mt-2 max-w-lg text-sm leading-6 text-muted-foreground'>
        با ثبت موکل، پرونده، جلسه و تراکنش، آمار عملکرد شما به‌صورت خودکار در این
        بخش نمایش داده می‌شود.
      </p>
      <div className='mt-6 flex w-full max-w-md flex-col gap-2 sm:flex-row sm:justify-center'>
        <Button asChild className='w-full sm:w-auto'>
          <Link href='/admin/clients'>
            <Users className='size-4' />
            ایجاد موکل
          </Link>
        </Button>
        <Button asChild variant='outline' className='w-full sm:w-auto'>
          <Link href='/admin/cases'>
            <Briefcase className='size-4' />
            ایجاد پرونده
          </Link>
        </Button>
        <Button asChild variant='outline' className='w-full sm:w-auto'>
          <Link href='/admin/events'>
            <CalendarDays className='size-4' />
            مشاهده رویدادها
          </Link>
        </Button>
      </div>
    </div>
  )
}
