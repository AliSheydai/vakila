import { Suspense } from 'react'
import { CallPageClient } from '@/features/video-call/components/call-page-client'

type PageProps = {
  params: Promise<{ eventId: string }>
}

export default async function CallPage({ params }: PageProps) {
  const { eventId } = await params

  return (
    <Suspense fallback={null}>
      <CallPageClient eventId={eventId} />
    </Suspense>
  )
}
