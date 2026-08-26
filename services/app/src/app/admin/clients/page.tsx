import { Suspense } from 'react'
import { ClientsPage } from '@/features/clients'

export default function AdminClientsPage() {
  return (
    <Suspense fallback={null}>
      <ClientsPage />
    </Suspense>
  )
}
