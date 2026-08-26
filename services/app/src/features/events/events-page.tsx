'use client'

import { useMemo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useCasesHydration } from '@/features/cases/hooks/use-cases-hydration'
import { useCasesStore } from '@/features/cases/stores/cases-store'
import { useEventsHydration } from './hooks/use-events-hydration'
import { useEventsStore } from './stores/events-store'
import { filterEvents } from './utils/filters'
import { EventsProvider, useEventsUi } from './components/events-provider'
import { EventsPrimaryButtons } from './components/events-primary-buttons'
import { EventsSummary } from './components/events-summary'
import { EventsEmptyState } from './components/events-empty-state'
import { EventsFiltersBar } from './components/events-filters-bar'
import { EventsFilteredEmpty } from './components/events-filtered-empty'
import { EventsToolbar } from './components/events-toolbar'
import { EventsCalendar } from './components/events-calendar'
import { EventsList } from './components/events-list'
import { EventsDialogs } from './components/events-dialogs'
import type { EventLookup } from './components/event-list-item'

function EventsContent() {
  const { hydrated: eventsHydrated } = useEventsHydration({ seedIfEmpty: true })
  const { hydrated: casesHydrated } = useCasesHydration()
  const events = useEventsStore((state) => state.events)
  const error = useEventsStore((state) => state.error)
  const cases = useCasesStore((state) => state.cases)
  const clients = useCasesStore((state) => state.clients)
  const { surface, toEventFilters, hasActiveFilters } = useEventsUi()

  const hydrated = eventsHydrated && casesHydrated

  const lookup = useMemo<EventLookup>(() => {
    const clientNameById: Record<string, string> = {}
    for (const client of clients) {
      clientNameById[client.id] = client.name
    }
    const caseTitleById: Record<string, string> = {}
    for (const caseItem of cases) {
      caseTitleById[caseItem.id] = caseItem.title
    }
    return { clientNameById, caseTitleById }
  }, [cases, clients])

  const filteredEvents = useMemo(
    () => filterEvents(events, toEventFilters(), lookup),
    [events, toEventFilters, lookup]
  )

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
              رویدادها
            </h2>
            <p className='mt-1 text-sm text-muted-foreground sm:text-base'>
              جلسات، دادگاه‌ها و مهلت‌های کاری را در یک نگاه مدیریت کنید.
            </p>
          </div>
          <EventsPrimaryButtons />
        </div>

        {!hydrated ? (
          <div className='space-y-4'>
            <div className='grid grid-cols-3 gap-3'>
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className='h-20 rounded-lg' />
              ))}
            </div>
            <Skeleton className='h-10 w-full max-w-xl' />
            <Skeleton className='h-80 w-full rounded-lg' />
          </div>
        ) : error ? (
          <div className='rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-6 text-sm text-destructive'>
            {error}
          </div>
        ) : events.length === 0 ? (
          <EventsEmptyState />
        ) : (
          <>
            <EventsSummary events={events} />
            <EventsFiltersBar />
            <EventsToolbar />
            {filteredEvents.length === 0 && hasActiveFilters ? (
              <EventsFilteredEmpty totalCount={events.length} />
            ) : surface === 'calendar' ? (
              <EventsCalendar events={filteredEvents} lookup={lookup} />
            ) : (
              <EventsList
                events={filteredEvents}
                lookup={lookup}
                scopeToAnchorMonth={!hasActiveFilters}
              />
            )}
          </>
        )}
      </Main>

      <EventsDialogs />
    </>
  )
}

export function EventsPage() {
  return (
    <EventsProvider>
      <EventsContent />
    </EventsProvider>
  )
}
