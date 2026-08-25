import { Suspense } from 'react'
import { ClientSessionDetailPage } from '@/features/client-portal'

type PageProps = {
  params: Promise<{ sessionId: string }>
}

export default async function SessionDetailRoutePage({ params }: PageProps) {
  const { sessionId } = await params

  return (
    <Suspense fallback={null}>
      <ClientSessionDetailPage sessionId={sessionId} />
    </Suspense>
  )
}
