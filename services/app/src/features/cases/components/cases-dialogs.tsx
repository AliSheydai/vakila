'use client'

import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useCasesStore } from '../stores/cases-store'
import { CasesMutateDrawer } from './cases-mutate-drawer'
import { useCasesDialogs } from './cases-provider'

export function CasesDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useCasesDialogs()
  const deleteCase = useCasesStore((state) => state.deleteCase)

  return (
    <>
      <CasesMutateDrawer
        key='case-create'
        open={open === 'create'}
        onOpenChange={() => setOpen('create')}
      />

      {currentRow && (
        <>
          <CasesMutateDrawer
            key={`case-update-${currentRow.id}`}
            open={open === 'update'}
            onOpenChange={() => {
              setOpen('update')
              setTimeout(() => setCurrentRow(null), 500)
            }}
            currentRow={currentRow}
          />

          <ConfirmDialog
            destructive
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
              setTimeout(() => setCurrentRow(null), 500)
            }}
            handleConfirm={() => {
              const result = deleteCase(currentRow.id)
              if (!result.ok) {
                toast.error(result.error)
                return
              }
              toast.success('پرونده حذف شد.')
              setOpen(null)
              setTimeout(() => setCurrentRow(null), 500)
            }}
            className='max-w-md'
            title='حذف پرونده'
            desc={
              <>
                پرونده «<strong>{currentRow.title}</strong>» با شماره{' '}
                <strong>{currentRow.caseNumber}</strong> حذف خواهد شد. این عمل
                قابل بازگشت نیست.
              </>
            }
            confirmText='حذف پرونده'
          />
        </>
      )}
    </>
  )
}
