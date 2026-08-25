import { Suspense } from 'react'
import { ClientCaseDetailPage } from '@/features/client-portal'

type PageProps = {
  params: Promise<{ caseId: string }>
}

export default async function CaseDetailRoutePage({ params }: PageProps) {
  const { caseId } = await params

  return (
    <Suspense fallback={null}>
      <ClientCaseDetailPage caseId={caseId} />
    </Suspense>
  )
}
