'use client'

import type { Notification } from '../types'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import {
  formatNotificationTime,
  getNotificationIcon,
} from '../utils/format'

type NotificationListItemProps = {
  notification: Notification
  onRead: (id: string) => Promise<void>
}

export function NotificationListItem({
  notification,
  onRead,
}: NotificationListItemProps) {
  const router = useRouter()
  const Icon = getNotificationIcon(notification.type)
  const isUnread = !notification.readAt

  const handleActivate = () => {
    void (async () => {
      if (isUnread) {
        await onRead(notification.id)
      }
      if (notification.href) {
        router.push(notification.href)
      }
    })()
  }

  const content = (
    <>
      <div
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-xl',
          isUnread ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
        )}
      >
        <Icon className='size-5' />
      </div>
      <div className='min-w-0 flex-1 space-y-1'>
        <div className='flex items-start gap-2'>
          {isUnread ? (
            <span className='mt-1.5 size-2 shrink-0 rounded-full bg-primary' />
          ) : null}
          <p
            className={cn(
              'text-sm leading-snug',
              isUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground/90'
            )}
          >
            {notification.title}
          </p>
        </div>
        <p className='text-sm leading-relaxed text-muted-foreground'>
          {notification.body}
        </p>
        <p className='text-xs tabular-nums text-muted-foreground/80'>
          {formatNotificationTime(notification.createdAt)}
        </p>
      </div>
    </>
  )

  if (notification.href) {
    return (
      <button
        type='button'
        onClick={handleActivate}
        className={cn(
          'flex w-full gap-3 rounded-xl border p-4 text-start transition-colors hover:bg-muted/50',
          isUnread ? 'border-primary/20 bg-primary/[0.03]' : 'border-border/60'
        )}
      >
        {content}
      </button>
    )
  }

  return (
    <button
      type='button'
      onClick={handleActivate}
      className={cn(
        'flex w-full gap-3 rounded-xl border p-4 text-start transition-colors hover:bg-muted/50',
        isUnread ? 'border-primary/20 bg-primary/[0.03]' : 'border-border/60'
      )}
    >
      {content}
    </button>
  )
}
