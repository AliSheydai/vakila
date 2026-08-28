import { Suspense } from 'react'
import { SettingsAdminPage } from '@/features/settings-admin'

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsAdminPage />
    </Suspense>
  )
}
