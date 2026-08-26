'use client'

import Link from 'next/link'
import { Briefcase, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function FinancialEmptyState() {
  return (
    <div
      role='status'
      className='flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center sm:py-20'
    >
      <div className='mb-4 flex size-12 items-center justify-center rounded-full bg-muted'>
        <Wallet className='size-5 text-muted-foreground' aria-hidden />
      </div>
      <h3 className='text-lg font-semibold tracking-tight'>
        هنوز تراکنش مالی ثبت نشده
      </h3>
      <p className='mt-2 max-w-lg text-sm leading-6 text-muted-foreground'>
        با ثبت دریافت یا هزینه در تب مالی هر پرونده، خلاصه درآمد، مالیات
        محاسبه‌شده، هزینه و سود اینجا نمایش داده می‌شود.
      </p>
      <div className='mt-6 flex w-full max-w-md flex-col gap-2 sm:flex-row sm:justify-center'>
        <Button asChild className='w-full sm:w-auto'>
          <Link href='/admin/cases'>
            <Briefcase className='size-4' aria-hidden />
            رفتن به پرونده‌ها
          </Link>
        </Button>
      </div>
    </div>
  )
}
