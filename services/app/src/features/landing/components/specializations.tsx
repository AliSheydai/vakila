'use client'

import { useRef, useState } from 'react'
import { useLandingReveal } from '../hooks/use-landing-motion'
import type { LawyerSpecialty } from '../types'

const INITIAL_VISIBLE = 6

type SpecializationsProps = {
  specialties: LawyerSpecialty[]
}

export function Specializations({ specialties }: SpecializationsProps) {
  const [showAll, setShowAll] = useState(false)
  const rootRef = useRef<HTMLElement>(null)
  useLandingReveal(rootRef)

  const visible = showAll
    ? specialties
    : specialties.slice(0, INITIAL_VISIBLE)
  const hasMore = specialties.length > INITIAL_VISIBLE

  return (
    <section
      id='specialties'
      ref={rootRef}
      className='lp-section scroll-mt-24 py-16 sm:py-20'
    >
      <div className='lp-container'>
        <div className='lp-reveal mb-10 max-w-2xl'>
          <p className='lp-kicker'>حوزه‌ها</p>
          <h2 className='lp-title mt-3 text-3xl sm:text-4xl'>حوزه‌های تخصصی</h2>
          <p className='lp-lead mt-3 text-sm sm:text-base'>
            تمرکز حرفه‌ای روی حوزه‌هایی که بیشترین تجربه عملی در آن‌ها وجود دارد.
          </p>
        </div>

        <ul className='divide-y divide-[color:var(--lp-line-soft)] border-y border-[color:var(--lp-line-soft)]'>
          {visible.map((specialty, index) => (
            <li
              key={specialty.id}
              className='group grid gap-2 py-5 transition-colors sm:grid-cols-[7rem_1fr_auto] sm:items-baseline sm:gap-8'
            >
              <span className='lp-display text-sm text-[var(--lp-brass)]'>
                {String(index + 1)
                  .padStart(2, '0')
                  .replace(/\d/g, (d) =>
                    '۰۱۲۳۴۵۶۷۸۹'[Number(d)]
                  )}
              </span>
              <div>
                <h3 className='text-base font-semibold text-[var(--lp-ink-text)] transition-colors group-hover:text-[var(--lp-brass)] sm:text-lg'>
                  {specialty.title}
                </h3>
                {specialty.description ? (
                  <p className='mt-1 text-sm leading-relaxed text-[var(--lp-muted)]'>
                    {specialty.description}
                  </p>
                ) : null}
              </div>
              {specialty.featured ? (
                <span className='text-xs tracking-wide text-[var(--lp-brass)]'>
                  تمرکز اصلی
                </span>
              ) : (
                <span />
              )}
            </li>
          ))}
        </ul>

        {hasMore ? (
          <div className='mt-8 flex justify-center'>
            <button
              type='button'
              className='lp-btn-ink'
              onClick={() => setShowAll((prev) => !prev)}
            >
              {showAll ? 'نمایش کمتر' : 'مشاهده همه حوزه‌ها'}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
