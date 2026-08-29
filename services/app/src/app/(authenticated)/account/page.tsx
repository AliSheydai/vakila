import { Suspense } from 'react'
import { Settings } from '@/features/settings'

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Settings />
    </Suspense>
  )
}
