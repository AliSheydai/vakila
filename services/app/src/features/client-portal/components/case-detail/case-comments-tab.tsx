'use client'

import { useCallback, useRef, useState } from 'react'
import {
  Download,
  FileText,
  Loader2,
  Paperclip,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { RichTextContent } from '@/components/ui/rich-text-content'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { usePortalStore } from '../../stores/portal-store'
import type { CaseComment, ClientCase } from '../../types'
import { formatDateTime, formatFileSize } from '../../utils/format'
import { isEmptyHtml } from '../../utils/html'
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
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.txt',
]

type PendingFile = {
  key: string
  file: File
}

type CaseCommentsTabProps = {
  caseItem: ClientCase
}

export function CaseCommentsTab({ caseItem }: CaseCommentsTabProps) {
  const addCaseComment = usePortalStore((s) => s.addCaseComment)
  const [bodyHtml, setBodyHtml] = useState('')
  const [files, setFiles] = useState<PendingFile[]>([])
  const [sending, setSending] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const comments = [...(caseItem.comments ?? [])].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  const onPickFiles = useCallback((list: FileList | null) => {
    if (!list?.length) return
    const next: PendingFile[] = []
    for (const file of Array.from(list)) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`حجم فایل «${file.name}» بیشتر از ۱۰ مگابایت است.`)
        continue
      }
      const lower = file.name.toLowerCase()
      const ok = ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext))
      if (!ok) {
        toast.error(`نوع فایل «${file.name}» پشتیبانی نمی‌شود.`)
        continue
      }
      next.push({ key: `${file.name}-${file.size}-${file.lastModified}`, file })
    }
    setFiles((prev) => {
      const keys = new Set(prev.map((p) => p.key))
      return [...prev, ...next.filter((f) => !keys.has(f.key))]
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const handleSend = async () => {
    if (isEmptyHtml(bodyHtml) && files.length === 0) {
      toast.error('متن پیام یا پیوست الزامی است.')
      return
    }

    setSending(true)
    try {
      const result = await addCaseComment(caseItem.id, {
        bodyHtml: isEmptyHtml(bodyHtml) ? '' : bodyHtml,
        attachments: files.map(({ file }) => ({
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
        })),
      })

      if (!result.ok) {
        toast.error(result.error)
        return
      }

      const updated = usePortalStore.getState().getCase(caseItem.id)
      const last = updated?.comments[updated.comments.length - 1]
      if (last) {
        last.attachments.forEach((doc, index) => {
          const pending = files[index]
          if (pending) setDocumentSessionUrl(doc.id, pending.file)
        })
      }

      setBodyHtml('')
      setFiles([])
      toast.success('پیام ارسال شد.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className='space-y-4'>
      {comments.length === 0 ? (
        <p className='rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground'>
          هنوز پیامی در این پرونده ثبت نشده است. اولین پیام را بنویسید.
        </p>
      ) : (
        <ul className='space-y-3'>
          {comments.map((comment) => (
            <CommentBubble key={comment.id} comment={comment} />
          ))}
        </ul>
      )}

      <section className='space-y-3 rounded-xl border p-4 sm:p-5'>
        <h2 className='text-sm font-semibold'>ارسال پیام</h2>
        <RichTextEditor
          value={bodyHtml}
          onChange={setBodyHtml}
          placeholder='پیام خود را برای وکیل بنویسید…'
          disabled={sending}
          minHeightClassName='min-h-24'
        />

        <input
          ref={fileInputRef}
          type='file'
          multiple
          className='hidden'
          accept={ACCEPTED_EXTENSIONS.join(',')}
          onChange={(e) => onPickFiles(e.target.files)}
        />

        {files.length > 0 ? (
          <ul className='space-y-2'>
            {files.map((item) => (
              <li
                key={item.key}
                className='flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm'
              >
                <div className='min-w-0'>
                  <p className='truncate font-medium'>{item.file.name}</p>
                  <p className='text-xs text-muted-foreground'>
                    {formatFileSize(item.file.size)}
                  </p>
                </div>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='size-8 shrink-0'
                  aria-label='حذف فایل'
                  disabled={sending}
                  onClick={() =>
                    setFiles((prev) => prev.filter((f) => f.key !== item.key))
                  }
                >
                  <X className='size-4' />
                </Button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className='flex flex-col gap-2 sm:flex-row sm:justify-between'>
          <Button
            type='button'
            variant='outline'
            disabled={sending}
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className='size-4' />
            پیوست فایل
          </Button>
          <Button type='button' disabled={sending} onClick={handleSend}>
            {sending ? (
              <>
                <Loader2 className='size-4 animate-spin' />
                در حال ارسال…
              </>
            ) : (
              'ارسال پیام'
            )}
          </Button>
        </div>
      </section>
    </div>
  )
}

function CommentBubble({ comment }: { comment: CaseComment }) {
  const isClient = comment.authorRole === 'client'

  return (
    <li
      className={cn(
        'rounded-xl border p-4',
        isClient ? 'border-primary/20 bg-primary/5' : 'bg-muted/30'
      )}
    >
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex flex-wrap items-center gap-2'>
          <p className='font-medium'>{comment.authorName}</p>
          <span className='rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground'>
            {isClient ? 'موکل' : 'وکیل'}
          </span>
        </div>
        <p className='text-xs text-muted-foreground'>
          {formatDateTime(comment.createdAt)}
        </p>
      </div>
      <div className='mt-2'>
        <RichTextContent
          html={comment.bodyHtml}
          emptyLabel={
            comment.attachments.length > 0
              ? 'فقط فایل پیوست شده است.'
              : 'متنی ثبت نشده است.'
          }
        />
      </div>
      {comment.attachments.length > 0 ? (
        <ul className='mt-3 space-y-2'>
          {comment.attachments.map((doc) => {
            const canDownload = hasDocumentSessionUrl(doc.id)
            return (
              <li
                key={doc.id}
                className='flex items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2 text-sm'
              >
                <div className='flex min-w-0 items-center gap-2'>
                  <FileText className='size-4 shrink-0 text-muted-foreground' />
                  <div className='min-w-0'>
                    <p className='truncate font-medium'>{doc.name}</p>
                    <p className='text-xs text-muted-foreground'>
                      {formatFileSize(doc.size)}
                    </p>
                  </div>
                </div>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  disabled={!canDownload}
                  onClick={() => {
                    const url = getDocumentSessionUrl(doc.id)
                    if (!url) {
                      toast.message('دانلود فقط برای فایل‌های همین جلسه ممکن است.')
                      return
                    }
                    const a = document.createElement('a')
                    a.href = url
                    a.download = doc.name
                    a.click()
                  }}
                >
                  <Download className='size-4' />
                  دانلود
                </Button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </li>
  )
}
