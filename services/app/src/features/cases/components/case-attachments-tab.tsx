'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
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
  ALLOWED_EXTENSIONS,
  DEFAULT_MAX_FILE_BYTES,
  validateAttachmentMeta,
} from '@/lib/attachment-validation'
import { downloadCaseAttachment } from '../services/api-attachments-service'
import * as apiCases from '../services/api-cases-service'

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
  onSeen?: () => void
}

function validateFile(file: File): string | null {
  return validateAttachmentMeta({
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    maxBytes: DEFAULT_MAX_FILE_BYTES,
  })
}

export function CaseAttachmentsTab({ caseItem, onSeen }: CaseAttachmentsTabProps) {
  const addAttachment = useCasesStore((state) => state.addAttachment)
  const deleteAttachment = useCasesStore((state) => state.deleteAttachment)
  const ownerId = useCasesStore((state) => state.ownerId)

  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [pending, setPending] = useState<PendingUpload[]>([])
  const [toDelete, setToDelete] = useState<Attachment | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    void apiCases.markClientDocumentsSeen(caseItem.id).then(() => onSeen?.())
  }, [caseItem.id, onSeen])

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

        const result = await addAttachment(caseItem.id, {
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
    [addAttachment, caseItem.id, ownerId]
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
    const result = await downloadCaseAttachment(caseItem.id, attachment.id)
    setDownloadingId(null)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    const anchor = document.createElement('a')
    anchor.href = result.data.url
    anchor.download = result.data.name
    anchor.rel = 'noopener noreferrer'
    anchor.click()
  }

  async function confirmDelete() {
    if (!toDelete) return
    const result = await deleteAttachment(caseItem.id, toDelete.id)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    toast.success('فایل حذف شد.')
    setToDelete(null)
  }

  const isEmpty =
    caseItem.attachments.length === 0 && pending.length === 0

  return (
    <div className='space-y-4'>
      <div
        role='button'
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 transition-colors',
          dragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50'
        )}
      >
        <input
          ref={inputRef}
          type='file'
          multiple
          className='hidden'
          accept={ALLOWED_EXTENSIONS.join(',')}
          onChange={(e) => {
            if (e.target.files?.length) void processFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <UploadCloud className='size-5 text-muted-foreground' />
        <p className='text-sm text-muted-foreground'>
          فایل را بکشید و رها کنید یا کلیک کنید
        </p>
        <p className='text-xs text-muted-foreground'>
          PDF، Word، Excel، تصویر — حداکثر ۱۰ مگابایت
        </p>
      </div>

      {isEmpty ? (
        <p className='text-center text-sm text-muted-foreground'>
          هنوز فایلی پیوست نشده است.
        </p>
      ) : (
        <ul className='divide-y rounded-lg border'>
          {pending.map((item) => (
            <li
              key={item.id}
              className='flex items-center justify-between gap-3 px-4 py-3'
            >
              <div className='flex min-w-0 items-center gap-3'>
                {item.status === 'uploading' ? (
                  <Loader2 className='size-4 shrink-0 animate-spin text-muted-foreground' />
                ) : (
                  <XCircle className='size-4 shrink-0 text-destructive' />
                )}
                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium'>{item.name}</p>
                  <p className='text-xs text-muted-foreground'>
                    {formatMimeTypeLabel(item.mimeType)} ·{' '}
                    {formatFileSize(item.size)}
                    {item.error ? ` · ${item.error}` : ''}
                  </p>
                </div>
              </div>
            </li>
          ))}

          {caseItem.attachments.map((attachment) => (
            <li
              key={attachment.id}
              className='flex items-center justify-between gap-3 px-4 py-3'
            >
              <div className='flex min-w-0 items-center gap-3'>
                <FileText className='size-4 shrink-0 text-muted-foreground' />
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
              </div>
              <div className='flex shrink-0 items-center gap-1'>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  disabled={downloadingId === attachment.id}
                  onClick={() => void handleDownload(attachment)}
                >
                  {downloadingId === attachment.id ? (
                    <Loader2 className='size-4 animate-spin' />
                  ) : (
                    <Download className='size-4' />
                  )}
                </Button>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='text-destructive hover:text-destructive'
                  onClick={() => setToDelete(attachment)}
                >
                  <Trash2 className='size-4' />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && setToDelete(null)}
        title='حذف فایل'
        desc={
          toDelete
            ? `آیا از حذف «${toDelete.name}» مطمئن هستید؟ این عمل قابل بازگشت نیست.`
            : ''
        }
        confirmText='حذف'
        destructive
        handleConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
