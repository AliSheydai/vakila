import { Suspense } from 'react'
import { ClientPaymentsPage } from '@/features/client-portal'

export default function PaymentsPage() {
  return (
    <Suspense fallback={null}>
      <ClientPaymentsPage />
    </Suspense>
  )
}
