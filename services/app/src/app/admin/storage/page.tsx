import { Suspense } from 'react'
import { StorageAdminPage } from '@/features/storage-admin'

export default function AdminStoragePage() {
  return (
    <Suspense fallback={null}>
      <StorageAdminPage />
    </Suspense>
  )
}
