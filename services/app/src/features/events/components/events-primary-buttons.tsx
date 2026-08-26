'use client'

import { Plus, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useEventsStore } from '../stores/events-store'
import { useEventsUi } from './events-provider'

export function EventsPrimaryButtons() {
  const { openCreate, selectedDate } = useEventsUi()
  const events = useEventsStore((state) => state.events)
  const seedDemoIfEmpty = useEventsStore((state) => state.seedDemoIfEmpty)

  const canSeed = events.length === 0

  return (
    <div className='flex w-full flex-wrap items-center gap-2 sm:w-auto'>
      {canSeed && (
        <Button
          variant='outline'
          className='flex-1 sm:flex-none'
          onClick={() => {
            const result = seedDemoIfEmpty()
            if (!result.ok) {
              toast.error(result.error)
              return
            }
            toast.success('رویدادهای نمونه بارگذاری شد.')
          }}
        >
          <Sparkles className='size-4' />
          داده نمونه
        </Button>
      )}
      <Button
        className='flex-1 sm:flex-none'
        onClick={() =>
          openCreate({
            date: selectedDate,
            startTime: '10:00',
            endTime: '11:00',
          })
        }
      >
        <Plus className='size-4' />
        ایجاد رویداد
      </Button>
    </div>
  )
}
