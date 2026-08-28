'use client'

import { MapPin, Pencil, Trash2, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useCasesStore } from '@/features/cases/stores/cases-store'
import {
  EVENT_STATUS_LABELS,
  type Event,
} from '../types'
import {
  formatEventDate,
  formatEventDuration,
  formatEventWeekday,
  formatTimeRange,
  getEventDurationMinutes,
  getTemporalStatus,
  isImportantEventType,
} from '../utils/datetime'
import { EventTypeBadge } from './event-type-badge'
import { JoinCallButton } from '@/features/video-call/components/join-call-button'
import { CALL_STATUS_LABELS } from '@/features/video-call/types'

type EventsDetailSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: Event | null
  onEdit: () => void
  onDelete: () => void
}

function DetailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className='contents'>
      <dt className='text-sm text-muted-foreground'>{label}</dt>
      <dd className='text-sm font-medium sm:col-start-2'>{children}</dd>
    </div>
  )
}

export function EventsDetailSheet({
  open,
  onOpenChange,
  event,
  onEdit,
  onDelete,
}: EventsDetailSheetProps) {
  const clients = useCasesStore((state) => state.clients)
  const cases = useCasesStore((state) => state.cases)

  if (!event) return null

  const client = event.clientId
    ? clients.find((item) => item.id === event.clientId)
    : null
  const caseItem = event.caseId
    ? cases.find((item) => item.id === event.caseId)
    : null
  const duration = getEventDurationMinutes(event)
  const temporal = getTemporalStatus(event)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex h-full w-full flex-col gap-0 p-0 sm:max-w-lg'>
        <SheetHeader className='border-b px-4 py-4 pe-12 text-start'>
          <div className='flex flex-wrap items-center gap-2'>
            <EventTypeBadge type={event.type} />
            {isImportantEventType(event.type) && (
              <Badge variant='outline' className='border-rose-300 text-rose-800 dark:border-rose-800 dark:text-rose-100'>
                مهم
              </Badge>
            )}
            {temporal === 'today' && (
              <Badge variant='secondary'>امروز</Badge>
            )}
            {temporal === 'past' && (
              <Badge variant='outline' className='opacity-70'>
                گذشته
              </Badge>
            )}
          </div>
          <SheetTitle className='text-xl leading-8'>{event.title}</SheetTitle>
          <SheetDescription>
            {formatEventWeekday(event.date)} — {formatEventDate(event.date)}
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-y-auto px-4 py-4'>
          <dl className='grid gap-x-3 gap-y-4 sm:grid-cols-[7rem_minmax(0,1fr)]'>
            <DetailRow label='ساعت'>
              <span className='tabular-nums'>
                {formatTimeRange(event.startTime, event.endTime)}
              </span>
            </DetailRow>
            <DetailRow label='مدت'>
              {formatEventDuration(duration)}
            </DetailRow>
            <DetailRow label='وضعیت'>
              {EVENT_STATUS_LABELS[event.status]}
            </DetailRow>
            {event.type === 'online_meeting' && event.meetingUrl ? (
              <>
                <DetailRow label='تماس تصویری'>
                  <span className='inline-flex items-center gap-1.5 text-primary'>
                    <Video className='size-3.5 shrink-0' />
                    فعال
                  </span>
                </DetailRow>
                {event.callStatus && event.callStatus !== 'idle' ? (
                  <DetailRow label='وضعیت تماس'>
                    {CALL_STATUS_LABELS[event.callStatus]}
                  </DetailRow>
                ) : null}
              </>
            ) : null}
            <DetailRow label='مکان'>
              {event.location ? (
                <span className='inline-flex items-center gap-1.5'>
                  <MapPin className='size-3.5 shrink-0 text-muted-foreground' />
                  {event.location}
                </span>
              ) : (
                <span className='text-muted-foreground'>ثبت نشده</span>
              )}
            </DetailRow>
            <DetailRow label='موکل'>
              {client?.name ?? (
                <span className='text-muted-foreground'>بدون موکل</span>
              )}
            </DetailRow>
            <DetailRow label='پرونده'>
              {caseItem ? (
                <span>
                  {caseItem.title}
                  <span className='ms-2 text-xs text-muted-foreground'>
                    ({caseItem.caseNumber})
                  </span>
                </span>
              ) : (
                <span className='text-muted-foreground'>بدون پرونده</span>
              )}
            </DetailRow>
          </dl>

          {event.description ? (
            <>
              <Separator className='my-5' />
              <div>
                <p className='mb-2 text-sm text-muted-foreground'>توضیحات</p>
                <p className='whitespace-pre-wrap text-sm leading-7'>
                  {event.description}
                </p>
              </div>
            </>
          ) : null}
        </div>

        <SheetFooter className='border-t px-4 py-4 sm:flex-row sm:flex-wrap'>
          {event.type === 'online_meeting' && event.meetingUrl ? (
            <JoinCallButton
              eventId={event.id}
              date={event.date}
              startTime={event.startTime}
              endTime={event.endTime}
              status={event.status}
              className='w-full sm:w-auto'
            />
          ) : null}
          <Button
            type='button'
            variant='outline'
            className='w-full text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto'
            onClick={onDelete}
          >
            <Trash2 className='size-4' />
            حذف
          </Button>
          <Button type='button' className='w-full sm:w-auto' onClick={onEdit}>
            <Pencil className='size-4' />
            ویرایش
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
