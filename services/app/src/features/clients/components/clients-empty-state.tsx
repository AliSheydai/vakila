'use client'

import { Users, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useClientsDialogs } from './clients-provider'

type ClientsEmptyStateProps = {
  onCreate?: () => void
}

export function ClientsEmptyState({ onCreate }: ClientsEmptyStateProps) {
  const { setOpen } = useClientsDialogs()

  return (
    <div className='flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center sm:py-20'>
      <div className='mb-4 flex size-12 items-center justify-center rounded-full bg-muted'>
        <Users className='size-5 text-muted-foreground' />
      </div>
      <h3 className='text-lg font-semibold tracking-tight'>
        هنوز موکلی اضافه نکرده‌اید
      </h3>
      <p className='mt-2 max-w-md text-sm leading-6 text-muted-foreground'>
        اولین موکل خود را ثبت کنید تا بتوانید اطلاعات تماس، پرونده‌ها و مدارک او
        را مدیریت کنید.
      </p>
      <Button
        className='mt-6 w-full sm:w-auto'
        onClick={() => {
          onCreate?.()
          setOpen('create')
        }}
      >
        <Plus className='size-4' />
        افزودن موکل
      </Button>
    </div>
  )
}
