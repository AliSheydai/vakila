'use client'

import { useRef } from 'react'
import {
  Award,
  FileCheck,
  Handshake,
  Lightbulb,
  MapPinned,
  MessagesSquare,
  RefreshCw,
  Video,
  type LucideIcon,
} from 'lucide-react'
import { useLandingReveal } from '../hooks/use-landing-motion'
import type { WhyPoint } from '../types'

const ICONS: Record<string, LucideIcon> = {
  Award,
  FileCheck,
  Lightbulb,
  RefreshCw,
  Video,
  Handshake,
  MapPinned,
  MessagesSquare,
}

type WhyLawyerProps = {
  points: WhyPoint[]
}

export function WhyLawyer({ points }: WhyLawyerProps) {
  const rootRef = useRef<HTMLElement>(null)
  useLandingReveal(rootRef)

  return (
    <section ref={rootRef} className='lp-section scroll-mt-24 py-16 sm:py-20'>
      <div className='lp-container'>
        <div className='lp-reveal mb-12 max-w-2xl'>
          <p className='lp-kicker'>اعتماد</p>
          <h2 className='lp-title mt-3 text-3xl sm:text-4xl'>چرا این وکیل؟</h2>
          <p className='lp-lead mt-3 text-sm sm:text-base'>
            معیارهای همکاری شفاف و قابل بررسی — بدون ادعاهای غیرواقعی.
          </p>
        </div>

        <div className='grid gap-8 sm:grid-cols-2 lg:grid-cols-4'>
          {points.map((point) => {
            const Icon = ICONS[point.icon] ?? Award
            return (
              <article key={point.id} className='lp-reveal'>
                <Icon
                  className='size-5 text-[var(--lp-brass)]'
                  strokeWidth={1.5}
                />
                <h3 className='mt-4 text-sm font-semibold text-[var(--lp-ink-text)]'>
                  {point.title}
                </h3>
                <p className='mt-2 text-sm leading-7 text-[var(--lp-muted)]'>
                  {point.description}
                </p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
