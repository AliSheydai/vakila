'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ErrorStateProps = {
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  message = 'بارگذاری اطلاعات با مشکل مواجه شد. لطفاً دوباره تلاش کنید.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role='alert'
      className='flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center'
    >
      <AlertCircle className='mb-3 size-8 text-destructive' aria-hidden />
      <p className='max-w-md text-sm text-destructive'>{message}</p>
      {onRetry ? (
        <Button variant='outline' className='mt-4' onClick={onRetry}>
          <RefreshCw className='size-4' />
          تلاش مجدد
        </Button>
      ) : null}
    </div>
  )
}
