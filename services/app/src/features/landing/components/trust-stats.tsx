'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { LawyerStatistic } from '../types'

gsap.registerPlugin(ScrollTrigger)

type TrustStatsProps = {
  statistics: LawyerStatistic[]
  lawyerName: string
  title: string
  years: number
  licenseLabel: string
}

export function TrustStats({
  statistics,
  lawyerName,
  title,
  years,
  licenseLabel,
}: TrustStatsProps) {
  const rootRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      gsap.from('.lp-stat-item', {
        opacity: 0,
        y: 24,
        duration: 0.75,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top 80%',
        },
      })
    },
    { scope: rootRef }
  )

  return (
    <section ref={rootRef} className='lp-section relative -mt-6 pb-4'>
      <div className='lp-container'>
        <div className='lp-reveal grid gap-8 border-b border-[rgba(16,32,40,0.08)] pb-10 lg:grid-cols-[1.1fr_1fr] lg:items-end'>
          <div>
            <p className='lp-kicker'>وکیل همراه شما</p>
            <h2 className='lp-title mt-3 text-3xl sm:text-4xl'>{lawyerName}</h2>
            <p className='mt-2 text-sm text-[var(--lp-muted)] sm:text-base'>
              {title} · {years.toLocaleString('fa-IR')} سال سابقه ·{' '}
              {licenseLabel}
            </p>
          </div>
          <p className='lp-lead text-sm sm:text-base'>
            تمرکز عملی روی پرونده‌هایی که مسیر حقوقی‌شان شفاف و قابل پیگیری است —
            بدون وعدهٔ غیرواقعی.
          </p>
        </div>

        <div className='mt-8 grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4'>
          {statistics.map((stat) => (
            <div key={stat.id} className='lp-stat-item'>
              <p className='text-xs tracking-wide text-[var(--lp-muted)]'>
                {stat.label}
              </p>
              <p className='lp-display mt-2 text-2xl font-bold text-[var(--lp-ink-text)] sm:text-3xl'>
                {stat.value}
              </p>
              {stat.hint ? (
                <p className='mt-1 text-[11px] text-[var(--lp-muted)] sm:text-xs'>
                  {stat.hint}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
