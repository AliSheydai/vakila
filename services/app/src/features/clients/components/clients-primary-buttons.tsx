'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useClientsDialogs } from './clients-provider'

export function ClientsPrimaryButtons() {
  const { setOpen } = useClientsDialogs()

  return (
    <div className='flex w-full flex-wrap items-center gap-2 sm:w-auto'>
      <Button
        className='flex-1 sm:flex-none'
        onClick={() => setOpen('create')}
      >
        <Plus className='size-4' />
        افزودن موکل
      </Button>
    </div>
  )
}
