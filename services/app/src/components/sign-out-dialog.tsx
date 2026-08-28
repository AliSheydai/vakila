'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useCasesStore } from '@/features/cases/stores/cases-store'
import { useEventsStore } from '@/features/events/stores/events-store'
import { usePortalStore } from '@/features/client-portal/stores/portal-store'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const router = useRouter()
  const pathname = usePathname()
  const logout = useAuthStore((s) => s.auth.logout)
  const resetCases = useCasesStore((state) => state.reset)
  const resetEvents = useEventsStore((state) => state.reset)
  const resetPortal = usePortalStore((state) => state.reset)
  const [loading, setLoading] = useState(false)

  const handleSignOut = () => {
    void (async () => {
      setLoading(true)
      try {
        await logout()
        resetCases()
        resetEvents()
        resetPortal()
        router.replace(`/sign-in?next=${encodeURIComponent(pathname)}`)
      } finally {
        setLoading(false)
        onOpenChange(false)
      }
    })()
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='خروج از حساب کاربری'
      desc='آیا برای خروج از حساب خود اطمینان دارید؟ برای دسترسی مجدد نیاز به ورود خواهید داشت.'
      confirmText='خروج'
      cancelBtnText='انصراف'
      destructive
      isLoading={loading}
      handleConfirm={handleSignOut}
      className='sm:max-w-sm'
    />
  )
}
