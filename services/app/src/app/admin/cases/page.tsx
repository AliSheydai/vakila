import { Suspense } from 'react'
import { Cases } from '@/features/cases'

export default function AdminCasesPage() {
  return (
    <Suspense fallback={null}>
      <Cases />
    </Suspense>
  )
}
