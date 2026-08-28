'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEventsUi } from './events-provider'

export function EventsPrimaryButtons() {
  const { openCreate, selectedDate } = useEventsUi()

  return (
    <div className='flex w-full flex-wrap items-center gap-2 sm:w-auto'>
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
