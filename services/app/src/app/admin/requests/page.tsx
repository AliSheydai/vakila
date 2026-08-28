import { Suspense } from 'react'
import { ConsultationRequestsPage } from '@/features/consultation-requests'

export default function AdminConsultationRequestsPage() {
  return (
    <Suspense fallback={null}>
      <ConsultationRequestsPage />
    </Suspense>
  )
}
