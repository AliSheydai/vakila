'use client'

import { Sparkles, type LucideIcon } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

export type PlaceholderHighlight = {
  title: string
  description: string
  icon: LucideIcon
}

export type PlaceholderStat = {
  label: string
  hint?: string
}

type SectionPlaceholderProps = {
  title: string
  description: string
  icon: LucideIcon
  emptyTitle: string
  emptyDescription: string
  stats?: PlaceholderStat[]
  highlights: PlaceholderHighlight[]
  badge?: string
}

export function SectionPlaceholder({
  title,
  description,
  icon: Icon,
  emptyTitle,
  emptyDescription,
  stats = [],
  highlights,
  badge = 'به‌زودی',
}: SectionPlaceholderProps) {
  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
      </Header>

      <Main className='flex flex-1 flex-col gap-6 sm:gap-8'>
        <div className='animate-in fade-in-0 slide-in-from-bottom-1 duration-300'>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div className='space-y-1.5'>
              <div className='flex items-center gap-2.5'>
                <span className='flex size-9 items-center justify-center rounded-xl border border-sidebar-border bg-sidebar text-sidebar-primary shadow-sm'>
                  <Icon className='size-4' strokeWidth={2} />
                </span>
                <h2 className='font-display text-2xl font-bold tracking-tight text-sidebar-foreground'>
                  {title}
                </h2>
              </div>
              <p className='max-w-xl text-sm text-muted-foreground sm:text-base'>
                {description}
              </p>
            </div>
            <span className='inline-flex items-center gap-1.5 rounded-full border border-sidebar-border bg-sidebar px-3 py-1 text-xs font-medium text-sidebar-primary'>
              <span className='relative flex size-1.5'>
                <span className='absolute inline-flex size-full animate-ping rounded-full bg-sidebar-primary opacity-40' />
                <span className='relative inline-flex size-1.5 rounded-full bg-sidebar-primary' />
              </span>
              {badge}
            </span>
          </div>
        </div>

        {stats.length > 0 && (
          <div
            className='grid grid-cols-2 gap-3 animate-in fade-in-0 slide-in-from-bottom-1 duration-300 sm:grid-cols-4'
            style={{ animationDelay: '60ms', animationFillMode: 'backwards' }}
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className='rounded-xl border border-sidebar-border bg-sidebar px-4 py-3.5 text-sidebar-foreground shadow-sm'
              >
                <p className='text-xs text-muted-foreground'>{stat.label}</p>
                <div className='mt-2.5 flex items-end justify-between gap-2'>
                  <div className='h-7 w-12 rounded-md bg-sidebar-accent' />
                  {stat.hint ? (
                    <span className='text-[10px] text-muted-foreground/80'>
                      {stat.hint}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          className='relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm animate-in fade-in-0 slide-in-from-bottom-1 duration-300'
          style={{ animationDelay: '120ms', animationFillMode: 'backwards' }}
        >
          <div
            aria-hidden
            className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,color-mix(in_oklab,var(--sidebar-primary)_12%,transparent),transparent)]'
          />
          <div
            aria-hidden
            className='pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-sidebar-primary/30 to-transparent'
          />

          <div className='relative flex flex-1 flex-col items-center justify-center gap-5 px-6 py-14 text-center sm:py-20'>
            <div className='relative'>
              <div className='absolute -inset-3 rounded-full bg-sidebar-primary/10 blur-md' />
              <div className='relative flex size-14 items-center justify-center rounded-2xl border border-sidebar-border bg-sidebar-accent shadow-sm ring-4 ring-sidebar-primary/10'>
                <Icon className='size-6 text-sidebar-primary' strokeWidth={1.75} />
              </div>
            </div>

            <div className='max-w-md space-y-2'>
              <h3 className='text-lg font-semibold tracking-tight sm:text-xl'>
                {emptyTitle}
              </h3>
              <p className='text-sm leading-relaxed text-muted-foreground'>
                {emptyDescription}
              </p>
            </div>

            <div className='mt-1 inline-flex items-center gap-2 rounded-full border border-sidebar-border bg-sidebar-accent/70 px-3.5 py-1.5 text-xs text-muted-foreground'>
              <Sparkles className='size-3.5 text-sidebar-primary' />
              این بخش در حال آماده‌سازی است
            </div>
          </div>
        </div>

        <div
          className='grid gap-3 animate-in fade-in-0 slide-in-from-bottom-1 duration-300 sm:grid-cols-3'
          style={{ animationDelay: '180ms', animationFillMode: 'backwards' }}
        >
          {highlights.map((item) => {
            const HighlightIcon = item.icon
            return (
              <div
                key={item.title}
                className='group rounded-xl border border-sidebar-border bg-sidebar/80 p-4 transition-colors hover:bg-sidebar-accent/50'
              >
                <div className='mb-3 flex size-8 items-center justify-center rounded-lg bg-sidebar-primary/10 text-sidebar-primary transition-transform duration-200 group-hover:scale-105'>
                  <HighlightIcon className='size-4' />
                </div>
                <p className='text-sm font-medium text-sidebar-foreground'>
                  {item.title}
                </p>
                <p className='mt-1 text-xs leading-relaxed text-muted-foreground'>
                  {item.description}
                </p>
              </div>
            )
          })}
        </div>
      </Main>
    </>
  )
}
