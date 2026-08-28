'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCasesDialogs } from './cases-provider'

export function CasesPrimaryButtons() {
  const { setOpen } = useCasesDialogs()

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <Button onClick={() => setOpen('create')}>
        <Plus className='size-4' />
        ایجاد پرونده
      </Button>
    </div>
  )
}
