'use client'

import { useCallback, useRef, useState } from 'react'
import {
  Download,
  FileText,
  Loader2,
  UploadCloud,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { usePortalStore } from '../../stores/portal-store'
import type { ClientCase } from '../../types'
import {
  DocumentStatusBadge,
} from '../status-badges'
import {
  formatDate,
  formatFileSize,
  formatMimeTypeLabel,
} from '../../utils/format'
import {
  getDocumentSessionUrl,
  hasDocumentSessionUrl,
  setDocumentSessionUrl,
} from '../../utils/document-session'

const MAX_FILE_SIZE = 10 * 1024 * 1024
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

type CaseDocumentsTabProps = {
  caseItem: ClientCase
}

function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `حجم فایل «${file.name}» بیشتر از ۱۰ مگابایت است.`
  }
  const lower = file.name.toLowerCase()
  const okExt = ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext))
  if (!okExt) {
    return `نوع فایل «${file.name}» پشتیبانی نمی‌شود.`
  }
  return null
}

export function CaseDocumentsTab({ caseItem }: CaseDocumentsTabProps) {
  const addCaseDocument = usePortalStore((s) => s.addCaseDocument)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [pending, setPending] = useState<PendingUpload[]>([])

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

        await new Promise((resolve) => setTimeout(resolve, 400))

        const result = await addCaseDocument(caseItem.id, {
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
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

        setDocumentSessionUrl(result.data.id, file)
        setPending((prev) => prev.filter((item) => item.id !== tempId))
        toast.success(`«${file.name}» بارگذاری شد.`)
      }
    },
    [addCaseDocument, caseItem.id]
  )

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    void processFiles(e.dataTransfer.files)
  }

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
          accept={ACCEPTED_EXTENSIONS.join(',')}
          onChange={(e) => {
            void processFiles(e.target.files ?? [])
            if (inputRef.current) inputRef.current.value = ''
          }}
        />
        <Button
          type='button'
          variant='outline'
          size='sm'
          className='mt-2'
          onClick={() => inputRef.current?.click()}
        >
          انتخاب فایل
        </Button>
      </div>

      {pending.length > 0 ? (
        <ul className='space-y-2'>
          {pending.map((item) => (
            <li
              key={item.id}
              className='flex items-center justify-between gap-3 rounded-xl border px-4 py-3'
            >
              <div className='min-w-0'>
                <p className='truncate text-sm font-medium'>{item.name}</p>
                <p className='text-xs text-muted-foreground'>
                  {formatFileSize(item.size)}
                  {item.error ? ` · ${item.error}` : null}
                </p>
              </div>
              {item.status === 'uploading' ? (
                <Loader2 className='size-4 animate-spin text-muted-foreground' />
              ) : (
                <XCircle className='size-4 text-destructive' />
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {(caseItem.documents?.length ?? 0) === 0 && pending.length === 0 ? (
        <p className='rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground'>
          مدرکی برای این پرونده ثبت نشده است.
        </p>
      ) : (
        <ul className='divide-y rounded-xl border'>
          {(caseItem.documents ?? []).map((doc) => {
            const sessionAvailable = hasDocumentSessionUrl(doc.id)

            return (
              <li
                key={doc.id}
                className='flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between'
              >
                <div className='flex min-w-0 items-start gap-3'>
                  <div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted'>
                    <FileText className='size-4 text-muted-foreground' />
                  </div>
                  <div className='min-w-0 space-y-1'>
                    <p className='truncate font-medium'>{doc.name}</p>
                    <p className='text-xs text-muted-foreground'>
                      {formatMimeTypeLabel(doc.mimeType)} ·{' '}
                      {formatFileSize(doc.size)} · {formatDate(doc.uploadedAt)}
                    </p>
                    <DocumentStatusBadge status={doc.status} />
                  </div>
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={doc.status !== 'available'}
                  onClick={() => {
                    const url = getDocumentSessionUrl(doc.id)
                    if (url) {
                      const a = document.createElement('a')
                      a.href = url
                      a.download = doc.name
                      a.click()
                      return
                    }
                    window.alert(
                      sessionAvailable
                        ? `دانلود «${doc.name}» آماده است.`
                        : `در نسخه نمونه، دانلود «${doc.name}» فقط برای فایل‌های بارگذاری‌شده در همین جلسه ممکن است؛ فایل‌های نمونه شبیه‌سازی می‌شوند.`
                    )
                  }}
                >
                  <Download className='size-4' />
                  دانلود
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
