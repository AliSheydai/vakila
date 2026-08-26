import { Suspense } from 'react'
import { ClientDetailPage } from '@/features/clients/client-detail-page'

type PageProps = {
  params: Promise<{ clientId: string }>
}

export default async function AdminClientDetailRoute({ params }: PageProps) {
  const { clientId } = await params

  return (
    <Suspense fallback={null}>
      <ClientDetailPage clientId={clientId} />
    </Suspense>
  )
}
