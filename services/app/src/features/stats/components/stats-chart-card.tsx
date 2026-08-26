'use client'

import type { ReactNode } from 'react'

type StatsChartCardProps = {
  title: string
  description?: string
  children: ReactNode
}

export function StatsChartCard({
  title,
  description,
  children,
}: StatsChartCardProps) {
  return (
    <section className='min-w-0 rounded-xl border bg-background/60 p-4 sm:p-5'>
      <div className='mb-4 space-y-1'>
        <h3 className='text-sm font-semibold tracking-tight sm:text-base'>
          {title}
        </h3>
        {description ? (
          <p className='text-xs leading-5 text-muted-foreground sm:text-sm'>
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

export function StatsChartEmpty({
  message = 'داده‌ای برای این بازه وجود ندارد.',
}: {
  message?: string
}) {
  return (
    <div
      role='status'
      className='flex h-48 items-center justify-center rounded-lg border border-dashed px-4 text-center text-sm text-muted-foreground'
    >
      {message}
    </div>
  )
}

/** ظرف نمودار: جهت LTR برای خوانایی محور عددی در صفحه RTL */
export function StatsChartFrame({
  children,
  ariaLabel,
  className = 'h-64',
}: {
  children: ReactNode
  ariaLabel: string
  className?: string
}) {
  return (
    <div
      dir='ltr'
      role='img'
      aria-label={ariaLabel}
      className={`w-full min-w-0 overflow-hidden ${className}`}
    >
      {children}
    </div>
  )
}
