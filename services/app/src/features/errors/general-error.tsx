'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type GeneralErrorProps = React.HTMLAttributes<HTMLDivElement> & {
  minimal?: boolean
}

export function GeneralError({
  className,
  minimal = false,
}: GeneralErrorProps) {
  const router = useRouter()
  return (
    <div className={cn('h-svh w-full', className)}>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        {!minimal && (
          <h1 className='text-[7rem] leading-tight font-bold'>۵۰۰</h1>
        )}
        <span className='font-medium text-lg'>خطایی در سرور رخ داده است!</span>
        <p className='text-center text-muted-foreground'>
          از بروز این مشکل متاسفیم. <br /> لطفاً دقایقی دیگر مجدداً تلاش کنید.
        </p>
        {!minimal && (
          <div className='mt-6 flex gap-4'>
            <Button variant='outline' onClick={() => router.back()}>
              بازگشت
            </Button>
            <Button onClick={() => router.push('/')}>صفحه اصلی</Button>
          </div>
        )}
      </div>
    </div>
  )
}
