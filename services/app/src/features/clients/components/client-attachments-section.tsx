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
import type { Attachment, Client } from '@/features/cases/types'
import { useCasesStore } from '@/features/cases/stores/cases-store'
import {
  formatDate,
  formatFileSize,
  formatMimeTypeLabel,
} from '@/features/cases/utils/format'
import {
  ALLOWED_EXTENSIONS,
  DEFAULT_MAX_FILE_BYTES,
  validateAttachmentMeta,
} from '@/lib/attachment-validation'
import { downloadClientAttachment } from '@/features/cases/services/api-attachments-service'

type PendingUpload = {
  id: string
  name: string
  size: number
  mimeType: string
  status: 'uploading' | 'failed'
  error?: string
}

type ClientAttachmentsSectionProps = {
  client: Client
}

function validateFile(file: File): string | null {
  return validateAttachmentMeta({
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    maxBytes: DEFAULT_MAX_FILE_BYTES,
  })
}

export function ClientAttachmentsSection({
  client,
}: ClientAttachmentsSectionProps) {
  const addClientAttachment = useCasesStore(
    (state) => state.addClientAttachment
  )
  const deleteClientAttachment = useCasesStore(
    (state) => state.deleteClientAttachment
  )
  const ownerId = useCasesStore((state) => state.ownerId)

  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [pending, setPending] = useState<PendingUpload[]>([])
  const [toDelete, setToDelete] = useState<Attachment | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const attachments = client.attachments ?? []

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

        // آپلود واقعی به RustFS
        const result = await addClientAttachment(client.id, {
          file,
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

        setPending((prev) => prev.filter((item) => item.id !== tempId))
        toast.success(`«${file.name}» اضافه شد.`)
      }
    },
    [addClientAttachment, client.id, ownerId]
  )

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    if (event.dataTransfer.files?.length) {
      void processFiles(event.dataTransfer.files)
    }
  }

  async function handleDownload(attachment: Attachment) {
    setDownloadingId(attachment.id)
    const result = await downloadClientAttachment(client.id, attachment.id)
    setDownloadingId(null)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    const anchor = document.createElement('a')
    anchor.href = result.data.url
    anchor.download = result.data.name
    anchor.click()
  }

  async function handleDeleteConfirm() {
    if (!toDelete) return

    const result = await deleteClientAttachment(client.id, toDelete.id)
    if (!result.ok) {
      toast.error(result.error)
      return
    }

    toast.success('فایل حذف شد.')
    setToDelete(null)
  }

  const isEmpty = attachments.length === 0 && pending.length === 0

  return (
    <section className='space-y-6'>
      <div>
        <h3 className='text-base font-semibold tracking-tight'>ضمائم موکل</h3>
        <p className='text-sm text-muted-foreground'>
          مدارک مربوط به خود شخص (مثل کارت ملی)، جدا از مدارک پرونده. فقط
          مشخصات در حافظه ذخیره می‌شود؛ محتوای فایل برای همین جلسه نگه داشته
          می‌شود.
        </p>
      </div>

      <div
        role='button'
        tabIndex={0}
        aria-label='بارگذاری فایل ضمیمه موکل'
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
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setDragging(false)
          }
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
          accept={ALLOWED_EXTENSIONS.join(',')}
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
          <p className='mt-3 text-sm font-medium'>هنوز ضمیمه‌ای ثبت نشده</p>
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

          {attachments.map((attachment) => (
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
                    disabled={downloadingId === attachment.id}
                    onClick={() => void handleDownload(attachment)}
                    title='دانلود'
                  >
                    {downloadingId === attachment.id ? (
                      <Loader2 className='size-4 animate-spin' />
                    ) : (
                      <Download className='size-4' />
                    )}
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
          ))}
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
        title='حذف ضمیمه'
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
    </section>
  )
}
