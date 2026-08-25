import { Suspense } from 'react'
import { ClientCasesPage } from '@/features/client-portal'

export default function CasesPage() {
  return (
    <Suspense fallback={null}>
      <ClientCasesPage />
    </Suspense>
  )
}
