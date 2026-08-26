'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

type StatsErrorStateProps = {
  message: string
  onRetry?: () => void
}

export function StatsErrorState({ message, onRetry }: StatsErrorStateProps) {
  return (
    <div
      role='alert'
      className='flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center'
    >
      <AlertCircle className='mb-3 size-8 text-destructive' aria-hidden />
      <h3 className='text-base font-semibold text-destructive'>
        بارگذاری آمار با مشکل مواجه شد
      </h3>
      <p className='mt-2 max-w-md text-sm leading-6 text-destructive/90'>
        {message}
      </p>
      {onRetry ? (
        <Button type='button' variant='outline' className='mt-5' onClick={onRetry}>
          <RefreshCw className='size-4' />
          تلاش مجدد
        </Button>
      ) : null}
    </div>
  )
}
