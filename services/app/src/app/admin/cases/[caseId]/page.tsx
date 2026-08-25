import { Suspense } from 'react'
import { CaseDetailPage } from '@/features/cases/case-detail-page'

type PageProps = {
  params: Promise<{ caseId: string }>
}

export default async function AdminCaseDetailRoute({ params }: PageProps) {
  const { caseId } = await params

  return (
    <Suspense fallback={null}>
      <CaseDetailPage caseId={caseId} />
    </Suspense>
  )
}
