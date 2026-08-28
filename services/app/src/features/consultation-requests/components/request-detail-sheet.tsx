'use client'

import { useEffect, useState } from 'react'
import { Phone } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { useConsultationRequestsStore } from '../stores/consultation-requests-store'
import {
  CONSULTATION_REQUEST_STATUS_LABELS,
  type ConsultationRequest,
  type ConsultationRequestStatus,
} from '../types'
import { formatAbsoluteDate, formatRelativeDate } from '../utils/format'
import { RequestStatusBadge } from './request-status-badge'

type RequestDetailSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: ConsultationRequest | null
}

const STATUS_OPTIONS: ConsultationRequestStatus[] = [
  'new',
  'in_review',
  'contacted',
  'closed',
]

export function RequestDetailSheet({
  open,
  onOpenChange,
  request,
}: RequestDetailSheetProps) {
  const updateRequest = useConsultationRequestsStore(
    (state) => state.updateRequest
  )
  const [status, setStatus] = useState<ConsultationRequestStatus>('new')
  const [lawyerNotes, setLawyerNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!request) return
    setStatus(request.status)
    setLawyerNotes(request.lawyerNotes ?? '')
  }, [request])

  if (!request) return null

  async function handleSave() {
    if (!request) return
    setSaving(true)
    const result = await updateRequest(request.id, {
      status,
      lawyerNotes: lawyerNotes.trim() || null,
      contactedAt:
        status === 'contacted' && !request.contactedAt
          ? new Date().toISOString()
          : request.contactedAt,
    })
    setSaving(false)

    if (!result.ok) {
      toast.error(result.error)
      return
    }

    toast.success('درخواست به‌روزرسانی شد')
    onOpenChange(false)
  }

  async function markContacted() {
    if (!request) return
    setSaving(true)
    const result = await updateRequest(request.id, {
      status: 'contacted',
      lawyerNotes: lawyerNotes.trim() || null,
      contactedAt: new Date().toISOString(),
    })
    setSaving(false)

    if (!result.ok) {
      toast.error(result.error)
      return
    }

    toast.success('تماس ثبت شد')
    onOpenChange(false)
  }

  const createdRelative = formatRelativeDate(request.createdAt)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex h-full w-full min-w-0 flex-col gap-0 overflow-hidden p-0 sm:max-w-lg'>
        <SheetHeader className='border-b px-4 py-4 pe-12 text-start'>
          <div className='flex flex-wrap items-center gap-2'>
            <RequestStatusBadge status={request.status} />
            {request.requesterUserId && (
              <Badge variant='outline'>کاربر ثبت‌نام‌شده</Badge>
            )}
          </div>
          <SheetTitle className='text-xl leading-8'>{request.name}</SheetTitle>
          <SheetDescription>{createdRelative}</SheetDescription>
        </SheetHeader>

        <div className='flex-1 min-w-0 space-y-5 overflow-x-hidden overflow-y-auto px-4 py-4'>
          <div className='min-w-0 space-y-2'>
            <Label>شماره تماس</Label>
            <a
              href={`tel:${request.phone}`}
              className='inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm tabular-nums hover:bg-muted'
              dir='ltr'
            >
              <Phone className='size-4 shrink-0' />
              {request.phone}
            </a>
          </div>

          <div className='min-w-0 space-y-2'>
            <Label>شرح درخواست</Label>
            <p className='max-w-full rounded-md border bg-muted/30 px-3 py-3 text-sm leading-7 break-words whitespace-pre-wrap [overflow-wrap:anywhere]'>
              {request.message}
            </p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='request-status'>وضعیت</Label>
            <Select
              value={status}
              onValueChange={(value) =>
                setStatus(value as ConsultationRequestStatus)
              }
            >
              <SelectTrigger id='request-status'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {CONSULTATION_REQUEST_STATUS_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='min-w-0 space-y-2'>
            <Label htmlFor='lawyer-notes'>یادداشت وکیل</Label>
            <Textarea
              id='lawyer-notes'
              value={lawyerNotes}
              onChange={(event) => setLawyerNotes(event.target.value)}
              placeholder='یادداشت داخلی برای پیگیری تماس یا قرارداد…'
              rows={4}
              className='max-h-48'
            />
          </div>

          {request.contactedAt && (
            <p className='text-xs text-muted-foreground'>
              آخرین تماس: {formatAbsoluteDate(request.contactedAt)}
            </p>
          )}
        </div>

        <SheetFooter className='flex-col gap-2 border-t px-4 py-4 sm:flex-row'>
          <Button
            type='button'
            variant='outline'
            className='w-full sm:w-auto'
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            بستن
          </Button>
          {request.status !== 'contacted' && request.status !== 'closed' && (
            <Button
              type='button'
              variant='secondary'
              className='w-full sm:w-auto'
              disabled={saving}
              onClick={() => void markContacted()}
            >
              تماس گرفته شد
            </Button>
          )}
          <Button
            type='button'
            className='w-full sm:w-auto'
            disabled={saving}
            onClick={() => void handleSave()}
          >
            {saving ? 'در حال ذخیره…' : 'ذخیره تغییرات'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
