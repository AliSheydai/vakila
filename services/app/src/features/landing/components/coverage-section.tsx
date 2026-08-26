'use client'

import { useRef } from 'react'
import { Building2, MapPin, Video } from 'lucide-react'
import { useLandingReveal } from '../hooks/use-landing-motion'
import type { LocationInfo } from '../types'

type CoverageSectionProps = {
  locations: LocationInfo
}

export function CoverageSection({ locations }: CoverageSectionProps) {
  const rootRef = useRef<HTMLElement>(null)
  useLandingReveal(rootRef)

  return (
    <section ref={rootRef} className='lp-section py-16 sm:py-20'>
      <div className='lp-container'>
        <div className='lp-reveal mb-10 max-w-2xl'>
          <p className='lp-kicker'>جغرافیا</p>
          <h2 className='lp-title mt-3 text-3xl sm:text-4xl'>محدوده فعالیت</h2>
          <p className='lp-lead mt-3 text-sm sm:text-base'>
            شهرهای تحت پوشش و امکان مشاوره آنلاین.
          </p>
        </div>

        <div className='grid gap-8 border-t border-[rgba(16,32,40,0.1)] pt-8 lg:grid-cols-3'>
          <div className='lp-reveal'>
            <MapPin className='size-5 text-[var(--lp-brass)]' strokeWidth={1.5} />
            <h3 className='mt-4 text-sm font-semibold'>شهرهای تحت پوشش</h3>
            <div className='mt-3 flex flex-wrap gap-2'>
              {locations.cities.map((city) => (
                <span
                  key={city}
                  className='border border-[rgba(201,162,90,0.35)] px-3 py-1 text-sm text-[var(--lp-ink-text)]'
                >
                  {city}
                </span>
              ))}
            </div>
            {locations.otherCitiesSupported ? (
              <p className='mt-3 text-sm leading-7 text-[var(--lp-muted)]'>
                {locations.otherCitiesNote}
              </p>
            ) : null}
          </div>

          {locations.officeAddress ? (
            <div className='lp-reveal'>
              <Building2
                className='size-5 text-[var(--lp-brass)]'
                strokeWidth={1.5}
              />
              <h3 className='mt-4 text-sm font-semibold'>آدرس دفتر</h3>
              <p className='mt-3 text-sm leading-7 text-[var(--lp-muted)]'>
                {locations.officeAddress}
              </p>
            </div>
          ) : null}

          {locations.onlineConsultation ? (
            <div className='lp-reveal'>
              <Video className='size-5 text-[var(--lp-brass)]' strokeWidth={1.5} />
              <h3 className='mt-4 text-sm font-semibold'>مشاوره آنلاین</h3>
              <p className='mt-3 text-sm leading-7 text-[var(--lp-muted)]'>
                امکان شروع مشاوره و بررسی اولیه پرونده به‌صورت آنلاین فراهم است.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
