'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useCasesStore } from './stores/cases-store'
import { useCasesHydration } from './hooks/use-cases-hydration'
import { CasesProvider } from './components/cases-provider'
import { CasesPrimaryButtons } from './components/cases-primary-buttons'
import { CasesDialogs } from './components/cases-dialogs'
import { CasesSummary } from './components/cases-summary'
import { CasesEmptyState } from './components/cases-empty-state'
import { CasesTable } from './components/cases-table'

function CasesContent() {
  const { hydrated } = useCasesHydration()
  const cases = useCasesStore((state) => state.cases)
  const clients = useCasesStore((state) => state.clients)
  const error = useCasesStore((state) => state.error)

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between'>
          <div className='min-w-0'>
            <h2 className='text-xl font-bold tracking-tight sm:text-2xl'>
              پرونده‌ها
            </h2>
            <p className='mt-1 text-sm text-muted-foreground sm:text-base'>
              مدیریت پرونده‌های حقوقی، موکل‌ها و وضعیت مالی از یک نقطه واحد.
            </p>
          </div>
          <CasesPrimaryButtons />
        </div>

        {!hydrated ? (
          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className='h-20 rounded-lg' />
              ))}
            </div>
            <Skeleton className='h-10 w-full max-w-md' />
            <Skeleton className='h-64 w-full rounded-lg' />
          </div>
        ) : error ? (
          <div className='rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-6 text-sm text-destructive'>
            {error}
          </div>
        ) : cases.length === 0 ? (
          <CasesEmptyState />
        ) : (
          <>
            <CasesSummary cases={cases} />
            <CasesTable cases={cases} clients={clients} />
          </>
        )}
      </Main>

      <CasesDialogs />
    </>
  )
}

export function Cases() {
  return (
    <CasesProvider>
      <CasesContent />
    </CasesProvider>
  )
}
