'use client'

import { useRef } from 'react'
import { useLandingReveal } from '../hooks/use-landing-motion'
import type { PricingInfo } from '../types'
import { useLandingActions } from './landing-actions'

type PricingSectionProps = {
  pricing: PricingInfo
}

export function PricingSection({ pricing }: PricingSectionProps) {
  const { openRequest } = useLandingActions()
  const rootRef = useRef<HTMLElement>(null)
  useLandingReveal(rootRef)

  return (
    <section ref={rootRef} className='lp-section py-16 sm:py-20'>
      <div className='lp-container'>
        <div className='grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start'>
          <div className='lp-reveal'>
            <p className='lp-kicker'>شفافیت مالی</p>
            <h2 className='lp-title mt-3 text-3xl sm:text-4xl'>
              هزینه و شرایط همکاری
            </h2>
            <p className='lp-lead mt-3 text-sm sm:text-base'>
              شفافیت مالی قبل از شروع همکاری؛ بدون قیمت‌گذاری ساختگی.
            </p>
          </div>

          <div className='lp-reveal border-t border-[rgba(201,162,90,0.35)] pt-8'>
            {pricing.consultationFeeLabel ? (
              <p className='lp-display text-2xl font-bold text-[var(--lp-ink-text)]'>
                هزینه مشاوره: {pricing.consultationFeeLabel}
              </p>
            ) : (
              <p className='lp-display text-xl leading-relaxed font-bold text-[var(--lp-ink-text)] sm:text-2xl'>
                {pricing.feePolicy}
              </p>
            )}

            <ul className='mt-6 space-y-3'>
              {pricing.paymentNotes.map((note) => (
                <li
                  key={note}
                  className='flex gap-3 text-sm leading-7 text-[var(--lp-muted)]'
                >
                  <span className='mt-3 size-1.5 shrink-0 rounded-full bg-[var(--lp-brass)]' />
                  <span>{note}</span>
                </li>
              ))}
              {pricing.installmentAvailable ? (
                <li className='flex gap-3 text-sm leading-7 text-[var(--lp-muted)]'>
                  <span className='mt-3 size-1.5 shrink-0 rounded-full bg-[var(--lp-brass)]' />
                  <span>
                    امکان پرداخت اقساطی در برخی پرونده‌ها پس از توافق.
                  </span>
                </li>
              ) : null}
            </ul>

            <button
              type='button'
              className='lp-btn-primary mt-8'
              onClick={() => openRequest('consultation')}
            >
              درخواست مشاوره
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
