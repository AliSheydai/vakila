import { Suspense } from 'react'
import { Apps } from '@/features/apps'

export default function AppsPage() {
  return (
    <Suspense fallback={null}>
      <Apps />
    </Suspense>
  )
}
