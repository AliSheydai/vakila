'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useCasesStore } from '@/features/cases/stores/cases-store'
import { useCasesHydration } from '@/features/cases/hooks/use-cases-hydration'
import { ClientsProvider } from './components/clients-provider'
import { ClientsPrimaryButtons } from './components/clients-primary-buttons'
import { ClientsDialogs } from './components/clients-dialogs'
import { ClientsSummary } from './components/clients-summary'
import { ClientsEmptyState } from './components/clients-empty-state'
import { ClientsTable } from './components/clients-table'

function ClientsContent() {
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
            <h2 className='font-display text-xl font-bold tracking-tight sm:text-2xl'>
              موکل‌ها
            </h2>
            <p className='mt-1 text-sm text-muted-foreground sm:text-base'>
              اطلاعات تماس، پرونده‌ها و مدارک موکل‌های خود را مدیریت کنید.
            </p>
          </div>
          <ClientsPrimaryButtons />
        </div>

        {!hydrated ? (
          <div className='space-y-4'>
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
              {Array.from({ length: 3 }).map((_, index) => (
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
        ) : clients.length === 0 ? (
          <ClientsEmptyState />
        ) : (
          <>
            <ClientsSummary clients={clients} cases={cases} />
            <ClientsTable clients={clients} cases={cases} />
          </>
        )}
      </Main>

      <ClientsDialogs />
    </>
  )
}

export function ClientsPage() {
  return (
    <ClientsProvider>
      <ClientsContent />
    </ClientsProvider>
  )
}
