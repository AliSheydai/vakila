import { Suspense } from 'react'
import { UsersAdminPage } from '@/features/users-admin'

export default function AdminUsersPage() {
  return (
    <Suspense fallback={null}>
      <UsersAdminPage />
    </Suspense>
  )
}
