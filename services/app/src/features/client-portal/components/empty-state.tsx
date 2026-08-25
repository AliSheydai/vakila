'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  actionHref?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className='flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center sm:py-20'>
      <div className='mb-4 flex size-12 items-center justify-center rounded-full bg-muted'>
        <Icon className='size-5 text-muted-foreground' aria-hidden />
      </div>
      <h3 className='text-lg font-semibold tracking-tight'>{title}</h3>
      <p className='mt-2 max-w-md text-sm leading-6 text-muted-foreground'>
        {description}
      </p>
      {actionLabel && actionHref ? (
        <Button className='mt-6 w-full sm:w-auto' asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : actionLabel && onAction ? (
        <Button className='mt-6 w-full sm:w-auto' onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
