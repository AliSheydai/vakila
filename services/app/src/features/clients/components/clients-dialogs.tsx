'use client'

import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useCasesStore } from '@/features/cases/stores/cases-store'
import { useClientsDialogs } from './clients-provider'

/**
 * فرم ایجاد/ویرایش در Phase 3.4 اضافه می‌شود.
 * در این فاز فقط حذف با تأیید پیاده‌سازی شده است.
 */
export function ClientsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useClientsDialogs()
  const deleteClient = useCasesStore((state) => state.deleteClient)
  const getClientCases = useCasesStore((state) => state.getClientCases)

  if (!currentRow || open !== 'delete') {
    return null
  }

  const linkedCount = getClientCases(currentRow.id).length
  const isBlocked = linkedCount > 0

  const close = () => {
    setOpen(null)
    setTimeout(() => setCurrentRow(null), 500)
  }

  return (
    <ConfirmDialog
      destructive={!isBlocked}
      open={open === 'delete'}
      onOpenChange={() => {
        setOpen('delete')
        setTimeout(() => setCurrentRow(null), 500)
      }}
      handleConfirm={() => {
        if (isBlocked) {
          close()
          return
        }

        const result = deleteClient(currentRow.id)
        if (!result.ok) {
          toast.error(result.error)
          return
        }
        toast.success('موکل حذف شد.')
        close()
      }}
      className='max-w-md'
      title={isBlocked ? 'حذف امکان‌پذیر نیست' : 'حذف موکل'}
      cancelBtnText={isBlocked ? 'بستن' : 'انصراف'}
      desc={
        isBlocked ? (
          <>
            موکل «<strong>{currentRow.name}</strong>» به{' '}
            <strong>{linkedCount.toLocaleString('fa-IR')}</strong> پرونده متصل
            است. برای حذف، ابتدا ارتباط پرونده‌ها را قطع کنید. پرونده‌ها حذف
            نمی‌شوند.
          </>
        ) : (
          <>
            موکل «<strong>{currentRow.name}</strong>» حذف خواهد شد. این عمل قابل
            بازگشت نیست.
          </>
        )
      }
      confirmText={isBlocked ? 'متوجه شدم' : 'حذف موکل'}
    />
  )
}
