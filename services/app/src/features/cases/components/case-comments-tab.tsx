'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Download,
  FileText,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { RichTextContent } from '@/components/ui/rich-text-content'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { Skeleton } from '@/components/ui/skeleton'
import type { Case } from '../types'
import { useCaseComments } from '../hooks/use-case-comments'
import * as apiCases from '../services/api-cases-service'
import { downloadCaseAttachment } from '../services/api-attachments-service'
import { formatDateTime, formatFileSize } from '@/features/client-portal/utils/format'
import { isEmptyHtml } from '@/features/client-portal/utils/html'

type CaseCommentsTabProps = {
  caseItem: Case
  onSeen?: () => void
}

export function CaseCommentsTab({ caseItem, onSeen }: CaseCommentsTabProps) {
  const { comments, loading, error, reload } = useCaseComments(caseItem.id)
  const seenNotified = useRef(false)
  const [bodyHtml, setBodyHtml] = useState('')
  const [sending, setSending] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (loading || seenNotified.current) return
    seenNotified.current = true
    onSeen?.()
  }, [loading, onSeen])

  const sorted = [...comments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  const handleSend = async () => {
    if (isEmptyHtml(bodyHtml)) {
      toast.error('متن پیام الزامی است.')
      return
    }

    setSending(true)
    try {
      const result = await apiCases.addCaseComment(caseItem.id, bodyHtml)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setBodyHtml('')
      toast.success('پیام ارسال شد.')
      await reload()
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    } finally {
      setSending(false)
    }
  }

  async function handleDownload(docId: string, name: string) {
    setDownloadingId(docId)
    const result = await downloadCaseAttachment(caseItem.id, docId)
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

  if (loading) {
    return (
      <div className='space-y-3'>
        <Skeleton className='h-20 w-full' />
        <Skeleton className='h-20 w-full' />
      </div>
    )
  }

  if (error) {
    return (
      <p className='text-sm text-destructive'>{error}</p>
    )
  }

  return (
    <div className='flex flex-col gap-4'>
      <div className='space-y-3'>
        {sorted.length === 0 ? (
          <p className='text-sm text-muted-foreground'>
            هنوز پیامی ثبت نشده است.
          </p>
        ) : (
          sorted.map((comment) => (
            <article
              key={comment.id}
              className={cn(
                'rounded-lg border px-3 py-2 text-sm',
                comment.authorRole === 'client'
                  ? 'ms-8 bg-primary/5'
                  : 'me-8 bg-muted/50'
              )}
            >
              <header className='mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground'>
                <div className='flex items-center gap-2'>
                  <span className='font-medium text-foreground'>
                    {comment.authorName}
                  </span>
                  {comment.authorRole === 'client' && !comment.seenByLawyerAt ? (
                    <span className='rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400'>
                      جدید
                    </span>
                  ) : null}
                </div>
                <time>{formatDateTime(comment.createdAt)}</time>
              </header>
              {!isEmptyHtml(comment.bodyHtml) ? (
                <RichTextContent html={comment.bodyHtml} className='text-sm' />
              ) : null}
              {comment.attachments.length > 0 ? (
                <ul className='mt-2 space-y-1 border-t pt-2'>
                  {comment.attachments.map((doc) => (
                    <li
                      key={doc.id}
                      className='flex items-center justify-between gap-2'
                    >
                      <div className='flex min-w-0 items-center gap-2'>
                        <FileText className='size-3.5 shrink-0' />
                        <span className='truncate text-xs'>{doc.name}</span>
                        <span className='text-xs text-muted-foreground'>
                          {formatFileSize(doc.size)}
                        </span>
                      </div>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='size-7'
                        disabled={downloadingId === doc.id}
                        onClick={() =>
                          void handleDownload(doc.id, doc.name)
                        }
                      >
                        {downloadingId === doc.id ? (
                          <Loader2 className='size-3.5 animate-spin' />
                        ) : (
                          <Download className='size-3.5' />
                        )}
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className='rounded-lg border bg-muted/30 p-3'>
        <RichTextEditor
          value={bodyHtml}
          onChange={setBodyHtml}
          placeholder='پاسخ خود را بنویسید…'
          minHeightClassName='min-h-[100px]'
        />
        <div className='mt-2 flex items-center justify-end gap-2'>
          <Button
            type='button'
            size='sm'
            disabled={sending}
            onClick={() => void handleSend()}
          >
            {sending ? (
              <Loader2 className='size-4 animate-spin' />
            ) : (
              'ارسال'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
