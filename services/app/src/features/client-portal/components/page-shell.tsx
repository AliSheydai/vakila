'use client'

import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Skeleton } from '@/components/ui/skeleton'

type PageShellProps = {
  children: React.ReactNode
  title?: string
  description?: string
  actions?: React.ReactNode
}

export function PageShell({
  children,
  title,
  description,
  actions,
}: PageShellProps) {
  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        {(title || actions) && (
          <div className='flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between'>
            <div className='min-w-0'>
              {title ? (
                <h1 className='font-display text-xl font-bold tracking-tight sm:text-2xl'>
                  {title}
                </h1>
              ) : null}
              {description ? (
                <p className='mt-1 text-sm text-muted-foreground sm:text-base'>
                  {description}
                </p>
              ) : null}
            </div>
            {actions}
          </div>
        )}
        {children}
      </Main>
    </>
  )
}

export function PortalListSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
        {Array.from({ length: cards }).map((_, index) => (
          <Skeleton key={index} className='h-24 rounded-xl' />
        ))}
      </div>
      <Skeleton className='h-10 w-full max-w-md' />
      <Skeleton className='h-72 w-full rounded-xl' />
    </div>
  )
}

export function PortalDetailSkeleton() {
  return (
    <div className='space-y-4'>
      <Skeleton className='h-8 w-48' />
      <Skeleton className='h-24 w-full rounded-xl' />
      <Skeleton className='h-10 w-80 max-w-full' />
      <Skeleton className='h-64 w-full rounded-xl' />
    </div>
  )
}
