'use client'

import { MessageSquarePlus } from 'lucide-react'

export function RequestsEmptyState() {
  return (
    <div className='flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center'>
      <div className='mb-4 flex size-12 items-center justify-center rounded-full bg-muted'>
        <MessageSquarePlus className='size-6 text-muted-foreground' />
      </div>
      <h3 className='text-base font-semibold'>درخواستی ثبت نشده</h3>
      <p className='mt-2 max-w-sm text-sm text-muted-foreground'>
        درخواست‌های مشاوره از لندینگ اینجا نمایش داده می‌شوند تا بتوانید با
        متقاضیان تماس بگیرید.
      </p>
    </div>
  )
}
