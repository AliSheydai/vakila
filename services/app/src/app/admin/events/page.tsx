import { Suspense } from 'react'
import { EventsPage } from '@/features/events'

export default function AdminEventsPage() {
  return (
    <Suspense fallback={null}>
      <EventsPage />
    </Suspense>
  )
}
