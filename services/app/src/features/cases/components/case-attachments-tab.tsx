'use client'

import { useCallback, useRef, useState } from 'react'
import {
  Download,
  FileText,
  Loader2,
  Trash2,
  UploadCloud,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import type { Attachment, Case } from '../types'
import { useCasesStore } from '../stores/cases-store'
import {
  formatDate,
  formatFileSize,
  formatMimeTypeLabel,
} from '../utils/format'
import {
  getAttachmentSessionUrl,
  hasAttachmentSessionUrl,
  revokeAttachmentSessionUrl,
  setAttachmentSessionUrl,
} from '../utils/attachment-session'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB — فقط برای UX prototype

const ACCEPTED_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.txt',
]

type PendingUpload = {
  id: string
  name: string
  size: number
  mimeType: string
  status: 'uploading' | 'failed'
  error?: string
}

type CaseAttachmentsTabProps = {
  caseItem: Case
}

function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `حجم فایل «${file.name}» بیشتر از ۱۰ مگابایت است.`
  }
  const lower = file.name.toLowerCase()
  const okExt = ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext))
  if (!okExt && file.type === '') {
    return `نوع فایل «${file.name}» پشتیبانی نمی‌شود.`
  }
  return null
}

export function CaseAttachmentsTab({ caseItem }: CaseAttachmentsTabProps) {
  const addAttachment = useCasesStore((state) => state.addAttachment)
  const deleteAttachment = useCasesStore((state) => state.deleteAttachment)
  const ownerId = useCasesStore((state) => state.ownerId)

  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [pending, setPending] = useState<PendingUpload[]>([])
  const [toDelete, setToDelete] = useState<Attachment | null>(null)

  const processFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList)
      if (files.length === 0) return

      for (const file of files) {
        const validationError = validateFile(file)
        const tempId = `pending_${crypto.randomUUID()}`

        if (validationError) {
          setPending((prev) => [
            ...prev,
            {
              id: tempId,
              name: file.name,
              size: file.size,
              mimeType: file.type || 'application/octet-stream',
              status: 'failed',
              error: validationError,
            },
          ])
          toast.error(validationError)
          continue
        }

        setPending((prev) => [
          ...prev,
          {
            id: tempId,
            name: file.name,
            size: file.size,
            mimeType: file.type || 'application/octet-stream',
            status: 'uploading',
          },
        ])

        // شبیه‌سازی آپلود برای UX
        await new Promise((resolve) => setTimeout(resolve, 450))

        const beforeIds = new Set(
          (
            useCasesStore.getState().getCase(caseItem.id)?.attachments ?? []
          ).map((item) => item.id)
        )
        const result = addAttachment(caseItem.id, {
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          uploadedBy: ownerId ?? undefined,
        })

        if (!result.ok) {
          setPending((prev) =>
            prev.map((item) =>
              item.id === tempId
                ? { ...item, status: 'failed', error: result.error }
                : item
            )
          )
          toast.error(result.error)
          continue
        }

        const created = result.data.attachments.find(
          (item) => !beforeIds.has(item.id)
        )
        if (created) {
          setAttachmentSessionUrl(created.id, file)
        }

        setPending((prev) => prev.filter((item) => item.id !== tempId))
        toast.success(`«${file.name}» اضافه شد.`)
      }
    },
    [addAttachment, caseItem.id, ownerId]
  )

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    if (event.dataTransfer.files?.length) {
      void processFiles(event.dataTransfer.files)
    }
  }

  function handleDownload(attachment: Attachment) {
    const url = getAttachmentSessionUrl(attachment.id)
    if (!url) {
      toast.message('دانلود فقط برای فایل‌های همین جلسه در دسترس است.', {
        description:
          'محتوای فایل در حافظه مرورگر ذخیره نمی‌شود؛ پس از رفرش فقط مشخصات باقی می‌ماند.',
      })
      return
    }

    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = attachment.name
    anchor.click()
  }

  function handleDeleteConfirm() {
    if (!toDelete) return

    const result = deleteAttachment(caseItem.id, toDelete.id)
    if (!result.ok) {
      toast.error(result.error)
      return
    }

    revokeAttachmentSessionUrl(toDelete.id)
    toast.success('فایل حذف شد.')
    setToDelete(null)
  }

  const isEmpty =
    caseItem.attachments.length === 0 && pending.length === 0

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-base font-semibold tracking-tight'>
          مدارک و ضمیمه‌ها
        </h3>
        <p className='text-sm text-muted-foreground'>
          فایل‌ها به‌صورت Prototype مدیریت می‌شوند؛ فقط مشخصات در حافظه ذخیره
          می‌شود و محتوای فایل برای همین جلسه نگه داشته می‌شود.
        </p>
      </div>

      <div
        role='button'
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            inputRef.current?.click()
          }
        }}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          setDragging(false)
        }}
        onDrop={onDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center transition-colors',
          dragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/40 hover:bg-muted/30'
        )}
      >
        <div className='mb-3 flex size-11 items-center justify-center rounded-full bg-muted'>
          <UploadCloud className='size-5 text-muted-foreground' />
        </div>
        <p className='text-sm font-medium'>
          فایل را اینجا رها کنید یا برای انتخاب کلیک کنید
        </p>
        <p className='mt-1 text-xs text-muted-foreground'>
          حداکثر ۱۰ مگابایت — PDF، Word، Excel، تصویر و متن
        </p>
        <input
          ref={inputRef}
          type='file'
          multiple
          className='hidden'
          accept={ACCEPTED_EXTENSIONS.join(',')}
          onChange={(event) => {
            if (event.target.files) {
              void processFiles(event.target.files)
              event.target.value = ''
            }
          }}
        />
      </div>

      {isEmpty ? (
        <div className='rounded-lg border border-dashed px-4 py-10 text-center'>
          <FileText className='mx-auto size-8 text-muted-foreground/60' />
          <p className='mt-3 text-sm font-medium'>هنوز مدرکی اضافه نشده است</p>
          <p className='mt-1 text-xs text-muted-foreground'>
            اولین فایل را با کشیدن یا انتخاب اضافه کنید.
          </p>
        </div>
      ) : (
        <ul className='divide-y rounded-lg border'>
          {pending.map((item) => (
            <li
              key={item.id}
              className='flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between'
            >
              <div className='min-w-0'>
                <p className='truncate text-sm font-medium'>{item.name}</p>
                <p className='text-xs text-muted-foreground'>
                  {formatMimeTypeLabel(item.mimeType)} ·{' '}
                  {formatFileSize(item.size)}
                </p>
                {item.status === 'failed' && item.error ? (
                  <p className='mt-1 text-xs text-destructive'>{item.error}</p>
                ) : null}
              </div>
              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                {item.status === 'uploading' ? (
                  <>
                    <Loader2 className='size-4 animate-spin' />
                    در حال بارگذاری
                  </>
                ) : (
                  <>
                    <XCircle className='size-4 text-destructive' />
                    ناموفق
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-7'
                      onClick={() =>
                        setPending((prev) =>
                          prev.filter((row) => row.id !== item.id)
                        )
                      }
                    >
                      بستن
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}

          {caseItem.attachments.map((attachment) => {
            const canDownload = hasAttachmentSessionUrl(attachment.id)
            return (
              <li
                key={attachment.id}
                className='flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between'
              >
                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium'>
                    {attachment.name}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {formatMimeTypeLabel(attachment.mimeType)} ·{' '}
                    {formatFileSize(attachment.size)} ·{' '}
                    {formatDate(attachment.uploadedAt)}
                  </p>
                </div>
                <div className='flex items-center gap-1'>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-8'
                    onClick={() => handleDownload(attachment)}
                    title={
                      canDownload
                        ? 'دانلود'
                        : 'فقط در جلسه فعلی قابل دانلود است'
                    }
                  >
                    <Download className='size-4' />
                    دانلود
                  </Button>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-8 text-destructive hover:text-destructive'
                    onClick={() => setToDelete(attachment)}
                  >
                    <Trash2 className='size-4' />
                    حذف
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <ConfirmDialog
        destructive
        open={!!toDelete}
        onOpenChange={(open) => {
          if (!open) setToDelete(null)
        }}
        handleConfirm={handleDeleteConfirm}
        className='max-w-md'
        title='حذف مدرک'
        desc={
          toDelete ? (
            <>
              فایل «<strong>{toDelete.name}</strong>» حذف خواهد شد.
            </>
          ) : (
            ''
          )
        }
        confirmText='حذف فایل'
      />
    </div>
  )
}
