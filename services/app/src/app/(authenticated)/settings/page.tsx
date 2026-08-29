import { Suspense } from 'react'
import { SettingsClientPage } from '@/features/settings-client'

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SettingsClientPage />
    </Suspense>
  )
}
