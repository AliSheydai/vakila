'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useLandingActions } from './landing-actions'

export function StickyMobileCta() {
  const { openRequest } = useLandingActions()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const y =
        document.body.scrollTop || document.documentElement.scrollTop || 0
      setVisible(y > 520)
    }
    document.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => document.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-[rgba(201,162,90,0.2)] bg-[#06141c]/92 p-3 backdrop-blur-xl transition-transform md:hidden',
        visible ? 'translate-y-0' : 'translate-y-full'
      )}
    >
      <div className='mx-auto flex max-w-6xl gap-2'>
        <button
          type='button'
          className='lp-btn-primary h-11 flex-1'
          onClick={() => openRequest('consultation')}
        >
          دریافت مشاوره
        </button>
        <button
          type='button'
          className='lp-btn-ghost h-11 flex-1'
          onClick={() => openRequest('case')}
        >
          پذیرش پرونده
        </button>
      </div>
    </div>
  )
}
