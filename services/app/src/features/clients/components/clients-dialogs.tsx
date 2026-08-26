'use client'

import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useCasesStore } from '@/features/cases/stores/cases-store'
import { useClientsDialogs } from './clients-provider'
import { ClientsMutateDrawer } from './clients-mutate-drawer'

export function ClientsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useClientsDialogs()
  const deleteClient = useCasesStore((state) => state.deleteClient)
  const getClientCases = useCasesStore((state) => state.getClientCases)

  const closeDelete = () => {
    setOpen(null)
    setTimeout(() => setCurrentRow(null), 500)
  }

  const linkedCount =
    open === 'delete' && currentRow
      ? getClientCases(currentRow.id).length
      : 0
  const isBlocked = linkedCount > 0

  return (
    <>
      <ClientsMutateDrawer
        key='client-create'
        open={open === 'create'}
        onOpenChange={() => setOpen('create')}
      />

      {currentRow && (
        <>
          <ClientsMutateDrawer
            key={`client-update-${currentRow.id}`}
            open={open === 'update'}
            onOpenChange={() => {
              setOpen('update')
              setTimeout(() => setCurrentRow(null), 500)
            }}
            currentRow={currentRow}
          />

          <ConfirmDialog
            destructive={!isBlocked}
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
              setTimeout(() => setCurrentRow(null), 500)
            }}
            handleConfirm={() => {
              if (isBlocked) {
                closeDelete()
                return
              }

              const result = deleteClient(currentRow.id)
              if (!result.ok) {
                toast.error(result.error)
                return
              }
              toast.success('موکل حذف شد.')
              closeDelete()
            }}
            className='max-w-md'
            title={isBlocked ? 'حذف امکان‌پذیر نیست' : 'حذف موکل'}
            cancelBtnText={isBlocked ? 'بستن' : 'انصراف'}
            desc={
              isBlocked ? (
                <>
                  موکل «<strong>{currentRow.name}</strong>» به{' '}
                  <strong>{linkedCount.toLocaleString('fa-IR')}</strong> پرونده
                  متصل است. برای حذف، ابتدا ارتباط پرونده‌ها را قطع کنید.
                  پرونده‌ها حذف نمی‌شوند.
                </>
              ) : (
                <>
                  موکل «<strong>{currentRow.name}</strong>» حذف خواهد شد. این عمل
                  قابل بازگشت نیست.
                </>
              )
            }
            confirmText={isBlocked ? 'متوجه شدم' : 'حذف موکل'}
          />
        </>
      )}
    </>
  )
}
