import { Suspense } from 'react'
import { LobbyPageClient } from '@/features/video-call/components/lobby-page-client'

type PageProps = {
  params: Promise<{ eventId: string }>
}

export default async function CallLobbyPage({ params }: PageProps) {
  const { eventId } = await params

  return (
    <Suspense fallback={null}>
      <LobbyPageClient eventId={eventId} />
    </Suspense>
  )
}
