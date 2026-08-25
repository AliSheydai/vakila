'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function NotFoundError() {
  const router = useRouter()
  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        <h1 className='text-[7rem] leading-tight font-bold'>۴۰۴</h1>
        <span className='font-medium text-lg'>صفحه مورد نظر یافت نشد!</span>
        <p className='text-center text-muted-foreground'>
          به نظر می‌رسد صفحه‌ای که به دنبال آن هستید وجود ندارد <br />
          یا منتقل شده است.
        </p>
        <div className='mt-6 flex gap-4'>
          <Button variant='outline' onClick={() => router.back()}>
            بازگشت
          </Button>
          <Button onClick={() => router.push('/')}>صفحه اصلی</Button>
        </div>
      </div>
    </div>
  )
}
