'use client'

import { useRef } from 'react'
import { useLandingReveal } from '../hooks/use-landing-motion'
import type { AvailabilityInfo } from '../types'
import { useLandingActions } from './landing-actions'

type ContactCtaProps = {
  availability: AvailabilityInfo
}

export function ContactCta({ availability }: ContactCtaProps) {
  const { openRequest } = useLandingActions()
  const rootRef = useRef<HTMLElement>(null)
  useLandingReveal(rootRef)

  return (
    <section
      ref={rootRef}
      className='lp-section relative overflow-hidden py-20 sm:py-24'
      style={{
        background:
          'radial-gradient(90% 80% at 80% 20%, rgba(201,162,90,0.18), transparent 50%), linear-gradient(145deg, #031015 0%, #06141c 50%, #0c2a36 100%)',
      }}
    >
      <div className='lp-container relative z-10'>
        <div className='lp-reveal mx-auto max-w-2xl text-center'>
          <p className='lp-kicker justify-center'>شروع همکاری</p>
          <h2 className='lp-display mt-4 text-3xl font-bold text-[#f3efe6] sm:text-4xl'>
            برای بررسی پرونده‌تان آماده‌اید؟
          </h2>
          <p className='mt-4 text-sm leading-8 text-[#a8c0c6] sm:text-base'>
            اگر نمی‌دانید از کجا شروع کنید، ابتدا شرایط پرونده خود را با وکیل مطرح
            کنید.
          </p>
          <p className='mt-2 text-xs text-[#7f969c]'>
            {availability.responseHint} · {availability.workingHours}
          </p>
          <div className='mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center'>
            <button
              type='button'
              className='lp-btn-primary w-full sm:w-auto'
              onClick={() => openRequest('consultation')}
            >
              دریافت مشاوره
            </button>
            <button
              type='button'
              className='lp-btn-ghost w-full sm:w-auto'
              onClick={() => openRequest('case')}
            >
              درخواست پذیرش پرونده
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
