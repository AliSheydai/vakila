'use client'

import { Plus, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useCasesStore } from '@/features/cases/stores/cases-store'
import { useClientsDialogs } from './clients-provider'

export function ClientsPrimaryButtons() {
  const { setOpen } = useClientsDialogs()
  const cases = useCasesStore((state) => state.cases)
  const clients = useCasesStore((state) => state.clients)
  const seedDemoIfEmpty = useCasesStore((state) => state.seedDemoIfEmpty)

  const canSeed = cases.length === 0 && clients.length === 0

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
            toast.success('داده‌های نمونه بارگذاری شد.')
          }}
        >
          <Sparkles className='size-4' />
          داده نمونه
        </Button>
      )}
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
