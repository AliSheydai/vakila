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
import { useAuthStore } from '@/stores/auth-store'
import { usePortalStore } from '../../stores/portal-store'
import type { CaseDocument, ClientCase } from '../../types'
import { DocumentStatusBadge } from '../status-badges'
import {
  formatDate,
  formatFileSize,
  formatMimeTypeLabel,
} from '../../utils/format'
import {
  ALLOWED_EXTENSIONS,
  DEFAULT_MAX_FILE_BYTES,
  validateAttachmentMeta,
} from '@/lib/attachment-validation'
import { downloadPortalCaseDocument } from '@/features/cases/services/api-attachments-service'

type PendingUpload = {
  id: string
  name: string
  size: number
  mimeType: string
  status: 'uploading' | 'failed'
  error?: string
}

type CaseDocumentsTabProps = {
  caseItem: ClientCase
}

function validateFile(file: File): string | null {
  return validateAttachmentMeta({
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    maxBytes: DEFAULT_MAX_FILE_BYTES,
  })
}

export function CaseDocumentsTab({ caseItem }: CaseDocumentsTabProps) {
  const userId = useAuthStore((s) => s.auth.user?.id)
  const addCaseDocument = usePortalStore((s) => s.addCaseDocument)
  const deleteCaseDocument = usePortalStore((s) => s.deleteCaseDocument)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [pending, setPending] = useState<PendingUpload[]>([])
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [docToDelete, setDocToDelete] = useState<CaseDocument | null>(null)

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

        const result = await addCaseDocument(caseItem.id, file)

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
        toast.success(`«${file.name}» بارگذاری شد.`)
      }
    },
    [addCaseDocument, caseItem.id]
  )

  async function handleDownload(docId: string, name: string) {
    setDownloadingId(docId)
    const result = await downloadPortalCaseDocument(caseItem.id, docId)
    setDownloadingId(null)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    const anchor = document.createElement('a')
    anchor.href = result.data.url
    anchor.download = name
    anchor.click()
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    void processFiles(e.dataTransfer.files)
  }

  const documents = caseItem.documents ?? []

  return (
    <div className='space-y-4'>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-10 text-center transition-colors',
          dragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25'
        )}
      >
        <UploadCloud className='size-8 text-muted-foreground' />
        <p className='text-sm font-medium'>مدارک خود را اینجا رها کنید</p>
        <p className='text-xs text-muted-foreground'>
          حداکثر ۱۰ مگابایت — PDF، Word، تصویر و متن
        </p>
        <input
          ref={inputRef}
          type='file'
          multiple
          className='hidden'
          accept={ALLOWED_EXTENSIONS.join(',')}
          onChange={(e) => {
            void processFiles(e.target.files ?? [])
            if (inputRef.current) inputRef.current.value = ''
          }}
        />
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => inputRef.current?.click()}
        >
          انتخاب فایل
        </Button>
      </div>

      <ul className='divide-y rounded-lg border'>
        {pending.map((item) => (
          <li
            key={item.id}
            className='flex items-center gap-3 px-4 py-3 text-sm'
          >
            {item.status === 'uploading' ? (
              <Loader2 className='size-4 animate-spin text-muted-foreground' />
            ) : (
              <XCircle className='size-4 text-destructive' />
            )}
            <div className='min-w-0 flex-1'>
              <p className='truncate font-medium'>{item.name}</p>
              <p className='text-xs text-muted-foreground'>
                {formatMimeTypeLabel(item.mimeType)} · {formatFileSize(item.size)}
                {item.error ? ` · ${item.error}` : ''}
              </p>
            </div>
          </li>
        ))}

        {documents.map((doc) => {
          const isOwn = doc.uploadedBy === userId
          const canDelete = isOwn && !doc.seenByLawyerAt
          const pendingReview = isOwn && !doc.seenByLawyerAt

          return (
          <li
            key={doc.id}
            className='flex items-center justify-between gap-3 px-4 py-3'
          >
            <div className='flex min-w-0 items-center gap-3'>
              <FileText className='size-4 shrink-0 text-muted-foreground' />
              <div className='min-w-0'>
                <p className='truncate text-sm font-medium'>{doc.name}</p>
                <p className='text-xs text-muted-foreground'>
                  {formatMimeTypeLabel(doc.mimeType)} ·{' '}
                  {formatFileSize(doc.size)} · {formatDate(doc.uploadedAt)}
                  {pendingReview ? ' · در انتظار مشاهده وکیل' : null}
                  {isOwn && doc.seenByLawyerAt ? ' · مشاهده شده' : null}
                </p>
              </div>
              <DocumentStatusBadge status={doc.status} />
            </div>
            <div className='flex items-center gap-1'>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                disabled={downloadingId === doc.id}
                onClick={() => void handleDownload(doc.id, doc.name)}
              >
                {downloadingId === doc.id ? (
                  <Loader2 className='size-4 animate-spin' />
                ) : (
                  <Download className='size-4' />
                )}
              </Button>
              {canDelete ? (
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='text-destructive hover:text-destructive'
                  disabled={deletingId === doc.id}
                  onClick={() => setDocToDelete(doc)}
                  title='حذف مدرک'
                >
                  {deletingId === doc.id ? (
                    <Loader2 className='size-4 animate-spin' />
                  ) : (
                    <Trash2 className='size-4' />
                  )}
                </Button>
              ) : null}
            </div>
          </li>
          )
        })}

        {documents.length === 0 && pending.length === 0 ? (
          <li className='px-4 py-6 text-center text-sm text-muted-foreground'>
            هنوز مدرکی بارگذاری نشده است.
          </li>
        ) : null}
      </ul>

      <ConfirmDialog
        destructive
        open={Boolean(docToDelete)}
        onOpenChange={(open) => {
          if (!open) setDocToDelete(null)
        }}
        handleConfirm={() => {
          if (!docToDelete) return
          void (async () => {
            setDeletingId(docToDelete.id)
            const result = await deleteCaseDocument(caseItem.id, docToDelete.id)
            setDeletingId(null)
            setDocToDelete(null)
            if (!result.ok) {
              toast.error(result.error)
              return
            }
            toast.success('مدرک حذف شد.')
          })()
        }}
        className='max-w-md'
        title='حذف مدرک'
        desc='این مدرک حذف می‌شود. پس از مشاهده توسط وکیل، حذف امکان‌پذیر نیست.'
        confirmText='حذف مدرک'
      />
    </div>
  )
}
