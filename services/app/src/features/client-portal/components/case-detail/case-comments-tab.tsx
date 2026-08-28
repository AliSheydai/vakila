'use client'

import { useCallback, useRef, useState } from 'react'
import {
  Download,
  FileText,
  Loader2,
  Paperclip,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { RichTextContent } from '@/components/ui/rich-text-content'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { useAuthStore } from '@/stores/auth-store'
import { usePortalStore } from '../../stores/portal-store'
import type { CaseComment, ClientCase } from '../../types'
import { formatDateTime, formatFileSize } from '../../utils/format'
import { isEmptyHtml } from '../../utils/html'
import {
  ALLOWED_EXTENSIONS,
  DEFAULT_MAX_FILE_BYTES,
  validateAttachmentMeta,
} from '@/lib/attachment-validation'
import {
  uploadPortalCaseDocument,
  downloadPortalCaseDocument,
} from '@/features/cases/services/api-attachments-service'

type PendingFile = {
  key: string
  file: File
}

type CaseCommentsTabProps = {
  caseItem: ClientCase
}

export function CaseCommentsTab({ caseItem }: CaseCommentsTabProps) {
  const userId = useAuthStore((s) => s.auth.user?.id)
  const addCaseComment = usePortalStore((s) => s.addCaseComment)
  const deleteCaseComment = usePortalStore((s) => s.deleteCaseComment)
  const [bodyHtml, setBodyHtml] = useState('')
  const [files, setFiles] = useState<PendingFile[]>([])
  const [sending, setSending] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [commentToDelete, setCommentToDelete] = useState<CaseComment | null>(
    null
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const comments = [...(caseItem.comments ?? [])].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  const onPickFiles = useCallback((list: FileList | null) => {
    if (!list?.length) return
    const next: PendingFile[] = []
    for (const file of Array.from(list)) {
      const err = validateAttachmentMeta({
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        maxBytes: DEFAULT_MAX_FILE_BYTES,
      })
      if (err) {
        toast.error(err)
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
      const attachmentIds: string[] = []
      for (const { file } of files) {
        const upload = await uploadPortalCaseDocument(caseItem.id, file)
        if (!upload.ok) {
          toast.error(upload.error)
          return
        }
        attachmentIds.push(upload.data.id)
      }

      const result = await addCaseComment(caseItem.id, {
        bodyHtml: isEmptyHtml(bodyHtml) ? '' : bodyHtml,
        attachmentIds,
      })

      if (!result.ok) {
        toast.error(result.error)
        return
      }

      setBodyHtml('')
      setFiles([])
      toast.success('پیام ارسال شد.')
    } finally {
      setSending(false)
    }
  }

  async function handleDownload(caseId: string, docId: string, name: string) {
    setDownloadingId(docId)
    const result = await downloadPortalCaseDocument(caseId, docId)
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

  return (
    <div className='flex flex-col gap-4'>
      <div className='space-y-3'>
        {comments.length === 0 ? (
          <p className='text-sm text-muted-foreground'>
            هنوز پیامی ثبت نشده است.
          </p>
        ) : (
          comments.map((comment) => (
            <CommentBubble
              key={comment.id}
              comment={comment}
              caseId={caseItem.id}
              currentUserId={userId}
              downloadingId={downloadingId}
              deletingCommentId={deletingCommentId}
              onDownload={handleDownload}
              onDeleteRequest={setCommentToDelete}
            />
          ))
        )}
      </div>

      <div className='rounded-lg border bg-muted/30 p-3'>
        <RichTextEditor
          value={bodyHtml}
          onChange={setBodyHtml}
          placeholder='پیام خود را بنویسید…'
          minHeightClassName='min-h-[100px]'
        />
        {files.length > 0 ? (
          <ul className='mt-2 space-y-1'>
            {files.map((item) => (
              <li
                key={item.key}
                className='flex items-center justify-between gap-2 text-xs'
              >
                <span className='truncate'>{item.file.name}</span>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='size-6'
                  onClick={() =>
                    setFiles((prev) => prev.filter((f) => f.key !== item.key))
                  }
                >
                  <X className='size-3' />
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className='mt-2 flex items-center justify-between gap-2'>
          <input
            ref={fileInputRef}
            type='file'
            multiple
            className='hidden'
            accept={ALLOWED_EXTENSIONS.join(',')}
            onChange={(e) => onPickFiles(e.target.files)}
          />
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className='size-4' />
            پیوست
          </Button>
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

      <ConfirmDialog
        destructive
        open={Boolean(commentToDelete)}
        onOpenChange={(open) => {
          if (!open) setCommentToDelete(null)
        }}
        handleConfirm={() => {
          if (!commentToDelete) return
          void (async () => {
            setDeletingCommentId(commentToDelete.id)
            const result = await deleteCaseComment(
              caseItem.id,
              commentToDelete.id
            )
            setDeletingCommentId(null)
            setCommentToDelete(null)
            if (!result.ok) {
              toast.error(result.error)
              return
            }
            toast.success('پیام حذف شد.')
          })()
        }}
        className='max-w-md'
        title='حذف پیام'
        desc='این پیام و پیوست‌های آن حذف می‌شود. پس از مشاهده توسط وکیل، حذف امکان‌پذیر نیست.'
        confirmText='حذف پیام'
      />
    </div>
  )
}

function CommentBubble({
  comment,
  caseId,
  currentUserId,
  downloadingId,
  deletingCommentId,
  onDownload,
  onDeleteRequest,
}: {
  comment: CaseComment
  caseId: string
  currentUserId?: string
  downloadingId: string | null
  deletingCommentId: string | null
  onDownload: (caseId: string, docId: string, name: string) => void
  onDeleteRequest: (comment: CaseComment) => void
}) {
  const isOwn = comment.authorRole === 'client' && comment.authorId === currentUserId
  const canDelete = isOwn && !comment.seenByLawyerAt
  const pendingReview = isOwn && !comment.seenByLawyerAt

  return (
    <article
      className={cn(
        'rounded-lg border px-3 py-2 text-sm',
        comment.authorRole === 'client'
          ? 'ms-8 bg-primary/5'
          : 'me-8 bg-muted/50'
      )}
    >
      <header className='mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground'>
        <div className='flex min-w-0 items-center gap-2'>
          <span className='font-medium text-foreground'>{comment.authorName}</span>
          {pendingReview ? (
            <span className='shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400'>
              در انتظار مشاهده وکیل
            </span>
          ) : isOwn ? (
            <span className='shrink-0 text-[10px] text-muted-foreground'>
              مشاهده شده
            </span>
          ) : null}
        </div>
        <div className='flex shrink-0 items-center gap-1'>
          <time>{formatDateTime(comment.createdAt)}</time>
          {canDelete ? (
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='size-6 text-destructive hover:text-destructive'
              disabled={deletingCommentId === comment.id}
              onClick={() => onDeleteRequest(comment)}
              title='حذف پیام'
            >
              {deletingCommentId === comment.id ? (
                <Loader2 className='size-3 animate-spin' />
              ) : (
                <Trash2 className='size-3' />
              )}
            </Button>
          ) : null}
        </div>
      </header>
      {!isEmptyHtml(comment.bodyHtml) ? (
        <RichTextContent html={comment.bodyHtml} className='text-sm' />
      ) : null}
      {comment.attachments.length > 0 ? (
        <ul className='mt-2 space-y-1 border-t pt-2'>
          {comment.attachments.map((doc) => (
            <li key={doc.id} className='flex items-center justify-between gap-2'>
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
                onClick={() => void onDownload(caseId, doc.id, doc.name)}
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
  )
}
