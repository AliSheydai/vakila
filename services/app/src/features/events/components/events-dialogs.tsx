'use client'

import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useEventsStore } from '../stores/events-store'
import { EventsMutateDrawer } from './events-mutate-drawer'
import { EventsDetailSheet } from './events-detail-sheet'
import { useEventsUi } from './events-provider'

export function EventsDialogs() {
  const {
    open,
    setOpen,
    currentRow,
    setCurrentRow,
    createDefaults,
    setCreateDefaults,
    openEdit,
    openDelete,
  } = useEventsUi()
  const deleteEvent = useEventsStore((state) => state.deleteEvent)

  return (
    <>
      <EventsMutateDrawer
        key='event-create'
        open={open === 'create'}
        createDefaults={createDefaults}
        onOpenChange={() => {
          setOpen('create')
          setCreateDefaults(null)
        }}
      />

      {currentRow && (
        <>
          <EventsDetailSheet
            key={`event-detail-${currentRow.id}`}
            open={open === 'detail'}
            event={currentRow}
            onOpenChange={() => {
              setOpen('detail')
              setTimeout(() => setCurrentRow(null), 500)
            }}
            onEdit={() => openEdit(currentRow)}
            onDelete={() => openDelete(currentRow)}
          />

          <EventsMutateDrawer
            key={`event-update-${currentRow.id}`}
            open={open === 'update'}
            currentRow={currentRow}
            onOpenChange={() => {
              setOpen('update')
              setTimeout(() => setCurrentRow(null), 500)
            }}
          />

          <ConfirmDialog
            destructive
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
              setTimeout(() => setCurrentRow(null), 500)
            }}
            handleConfirm={() => {
              void (async () => {
                const result = await deleteEvent(currentRow.id)
                if (!result.ok) {
                  toast.error(result.error)
                  return
                }
                toast.success('رویداد حذف شد.')
                setOpen(null)
                setTimeout(() => setCurrentRow(null), 500)
              })()
            }}
            className='max-w-md'
            title='حذف رویداد'
            desc={
              <>
                رویداد «<strong>{currentRow.title}</strong>» حذف خواهد شد. این
                عملیات قابل بازگشت نیست.
              </>
            }
            confirmText='حذف رویداد'
          />
        </>
      )}
    </>
  )
}
