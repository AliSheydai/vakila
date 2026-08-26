'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { useLandingReveal } from '../hooks/use-landing-motion'
import { useLandingActions } from './landing-actions'

export function FinalCta() {
  const { openRequest } = useLandingActions()
  const rootRef = useRef<HTMLElement>(null)
  useLandingReveal(rootRef)

  return (
    <section ref={rootRef} className='lp-section py-16 sm:py-20'>
      <div className='lp-container text-center'>
        <h2 className='lp-reveal lp-display mx-auto max-w-xl text-2xl font-bold text-[var(--lp-ink-text)] sm:text-3xl'>
          قبل از هر تصمیمی، پرونده‌تان را با یک متخصص بررسی کنید.
        </h2>
        <div className='lp-reveal mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center'>
          <button
            type='button'
            className='lp-btn-primary w-full sm:w-auto'
            onClick={() => openRequest('consultation')}
          >
            دریافت مشاوره
          </button>
          <Link href='/login' className='lp-btn-ink w-full sm:w-auto'>
            ورود به حساب کاربری
          </Link>
        </div>
      </div>
    </section>
  )
}
