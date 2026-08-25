'use client'

import { useRef, useState } from 'react'
import {
  Download,
  FileText,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
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
  getAttachmentSessionUrl,
  revokeAttachmentSessionUrl,
  setAttachmentSessionUrl,
} from '@/features/cases/utils/attachment-session'

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

type ClientAttachmentsSectionProps = {
  client: Client
}

/**
 * نمایش و مدیریت پایه ضمائم موکل.
 * Drag & Drop و UX کامل آپلود در Phase 3.6 تکمیل می‌شود.
 */
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
  const [uploading, setUploading] = useState(false)
  const [toDelete, setToDelete] = useState<Attachment | null>(null)

  const attachments = client.attachments ?? []

  async function processFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList)
    if (files.length === 0) return

    setUploading(true)
    try {
      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`حجم فایل «${file.name}» بیشتر از ۱۰ مگابایت است.`)
          continue
        }

        const lower = file.name.toLowerCase()
        const okExt = ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext))
        if (!okExt && file.type === '') {
          toast.error(`نوع فایل «${file.name}» پشتیبانی نمی‌شود.`)
          continue
        }

        await new Promise((resolve) => setTimeout(resolve, 350))

        const beforeIds = new Set(
          (
            useCasesStore.getState().getClient(client.id)?.attachments ?? []
          ).map((item) => item.id)
        )

        const result = addClientAttachment(client.id, {
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          uploadedBy: ownerId ?? undefined,
        })

        if (!result.ok) {
          toast.error(result.error)
          continue
        }

        const created = result.data.attachments.find(
          (item) => !beforeIds.has(item.id)
        )
        if (created) {
          setAttachmentSessionUrl(created.id, file)
        }

        toast.success(`«${file.name}» اضافه شد.`)
      }
    } finally {
      setUploading(false)
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

    const result = deleteClientAttachment(client.id, toDelete.id)
    if (!result.ok) {
      toast.error(result.error)
      return
    }

    revokeAttachmentSessionUrl(toDelete.id)
    toast.success('فایل حذف شد.')
    setToDelete(null)
  }

  return (
    <section className='space-y-4'>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h3 className='text-base font-semibold tracking-tight'>
            ضمائم موکل
          </h3>
          <p className='text-sm text-muted-foreground'>
            مدارک مربوط به خود شخص (مثل کارت ملی)، جدا از مدارک پرونده.
          </p>
        </div>
        <Button
          size='sm'
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className='size-4 animate-spin' />
          ) : (
            <Plus className='size-4' />
          )}
          افزودن فایل
        </Button>
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

      {attachments.length === 0 ? (
        <div className='rounded-xl border border-dashed px-6 py-12 text-center'>
          <FileText className='mx-auto size-8 text-muted-foreground/60' />
          <p className='mt-3 text-sm font-medium'>هنوز ضمیمه‌ای ثبت نشده</p>
          <p className='mt-1 text-xs text-muted-foreground'>
            فقط مشخصات فایل ذخیره می‌شود؛ محتوای فایل برای همین جلسه نگه داشته
            می‌شود.
          </p>
        </div>
      ) : (
        <ul className='divide-y rounded-lg border'>
          {attachments.map((attachment) => (
            <li
              key={attachment.id}
              className='flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between'
            >
              <div className='min-w-0 space-y-1'>
                <p className='truncate text-sm font-medium'>{attachment.name}</p>
                <p className='text-xs text-muted-foreground'>
                  {formatMimeTypeLabel(attachment.mimeType)}
                  {' · '}
                  {formatFileSize(attachment.size)}
                  {' · '}
                  {formatDate(attachment.uploadedAt)}
                </p>
              </div>
              <div className='flex shrink-0 items-center gap-1'>
                <Button
                  variant='ghost'
                  size='icon'
                  className='size-8'
                  aria-label='دانلود'
                  onClick={() => handleDownload(attachment)}
                >
                  <Download className='size-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='size-8 text-destructive hover:text-destructive'
                  aria-label='حذف'
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
        destructive
        open={!!toDelete}
        onOpenChange={(open) => {
          if (!open) setToDelete(null)
        }}
        handleConfirm={handleDeleteConfirm}
        className='max-w-md'
        title='حذف ضمیمه'
        desc={
          <>
            فایل «<strong>{toDelete?.name}</strong>» حذف خواهد شد.
          </>
        }
        confirmText='حذف فایل'
      />
    </section>
  )
}
