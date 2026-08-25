'use client'

import { Briefcase, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCasesDialogs } from './cases-provider'

type CasesEmptyStateProps = {
  onCreate?: () => void
}

export function CasesEmptyState({ onCreate }: CasesEmptyStateProps) {
  const { setOpen } = useCasesDialogs()

  return (
    <div className='flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center sm:py-20'>
      <div className='mb-4 flex size-12 items-center justify-center rounded-full bg-muted'>
        <Briefcase className='size-5 text-muted-foreground' />
      </div>
      <h3 className='text-lg font-semibold tracking-tight'>
        هنوز پرونده‌ای ایجاد نکرده‌اید
      </h3>
      <p className='mt-2 max-w-md text-sm leading-6 text-muted-foreground'>
        با ایجاد اولین پرونده، اطلاعات پرونده، موکل، مدارک و وضعیت مالی آن را از
        همین بخش مدیریت کنید.
      </p>
      <Button
        className='mt-6 w-full sm:w-auto'
        onClick={() => {
          onCreate?.()
          setOpen('create')
        }}
      >
        <Plus className='size-4' />
        ایجاد پرونده
      </Button>
    </div>
  )
}
