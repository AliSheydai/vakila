'use client'

import { useRef } from 'react'
import { FolderOpen } from 'lucide-react'
import { useLandingReveal } from '../hooks/use-landing-motion'
import type { LawyerCaseStudy } from '../types'

type CaseStudiesProps = {
  caseStudies: LawyerCaseStudy[]
}

export function CaseStudies({ caseStudies }: CaseStudiesProps) {
  const rootRef = useRef<HTMLElement>(null)
  useLandingReveal(rootRef)

  return (
    <section
      ref={rootRef}
      className='lp-section py-16 sm:py-20'
      style={{
        background:
          'linear-gradient(180deg, rgba(6,20,28,0.04), transparent)',
      }}
    >
      <div className='lp-container'>
        <div className='lp-reveal mb-10 max-w-2xl'>
          <p className='lp-kicker'>سوابق</p>
          <h2 className='lp-title mt-3 text-3xl sm:text-4xl'>
            سوابق و پرونده‌های شاخص
          </h2>
          <p className='lp-lead mt-3 text-sm sm:text-base'>
            نمونه‌هایی که بدون افشای هویت موکل یا اطلاعات محرمانه قابل انتشار هستند.
          </p>
        </div>

        {caseStudies.length === 0 ? (
          <div className='lp-reveal flex flex-col items-center justify-center border border-dashed border-[rgba(201,162,90,0.35)] px-6 py-16 text-center'>
            <FolderOpen
              className='size-6 text-[var(--lp-brass)]'
              strokeWidth={1.5}
            />
            <h3 className='mt-4 text-base font-semibold text-[var(--lp-ink-text)]'>
              هنوز موردی منتشر نشده است
            </h3>
            <p className='mt-2 max-w-md text-sm leading-7 text-[var(--lp-muted)]'>
              پرونده‌های شاخص پس از تأیید امکان انتشار و حذف اطلاعات هویتی، در این
              بخش نمایش داده می‌شوند.
            </p>
          </div>
        ) : (
          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {caseStudies.map((item) => (
              <article
                key={item.id}
                className='lp-reveal border-t border-[rgba(201,162,90,0.35)] pt-5'
              >
                <p className='text-xs tracking-wide text-[var(--lp-brass)]'>
                  {item.domain}
                </p>
                <h3 className='mt-2 text-base font-semibold text-[var(--lp-ink-text)]'>
                  {item.subject}
                </h3>
                <p className='mt-1 text-xs text-[var(--lp-muted)]'>
                  نوع خدمت: {item.serviceType}
                </p>
                <p className='mt-3 text-sm leading-7 text-[var(--lp-muted)]'>
                  {item.outcome}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
