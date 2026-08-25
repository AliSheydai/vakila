'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function UnauthorisedError() {
  const router = useRouter()
  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        <h1 className='text-[7rem] leading-tight font-bold'>۴۰۱</h1>
        <span className='font-medium text-lg'>نیاز به ورود به حساب</span>
        <p className='text-center text-muted-foreground'>
          برای مشاهده این بخش ابتدا وارد حساب کاربری خود شوید.
        </p>
        <div className='mt-6 flex gap-4'>
          <Button variant='outline' onClick={() => router.back()}>
            بازگشت
          </Button>
          <Button onClick={() => router.push('/sign-in')}>ورود به حساب</Button>
        </div>
      </div>
    </div>
  )
}
