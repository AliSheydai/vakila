'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type SummaryCardProps = {
  title: string
  value: string | number
  icon: LucideIcon
  href?: string
  hint?: string
  className?: string
}

export function SummaryCard({
  title,
  value,
  icon: Icon,
  href,
  hint,
  className,
}: SummaryCardProps) {
  const content = (
    <>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <p className='text-xs text-muted-foreground sm:text-sm'>{title}</p>
          <p className='mt-1 text-2xl font-semibold tracking-tight tabular-nums'>
            {typeof value === 'number' ? value.toLocaleString('fa-IR') : value}
          </p>
          {hint ? (
            <p className='mt-1 text-[11px] text-muted-foreground sm:text-xs'>
              {hint}
            </p>
          ) : null}
        </div>
        <div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted'>
          <Icon className='size-4 text-muted-foreground' aria-hidden />
        </div>
      </div>
    </>
  )

  const classes = cn(
    'rounded-xl border bg-background/60 p-4 transition-colors',
    href && 'hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    className
  )

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={`${title}: ${value}`}>
        {content}
      </Link>
    )
  }

  return <div className={classes}>{content}</div>
}
