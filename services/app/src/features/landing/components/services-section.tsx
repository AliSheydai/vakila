'use client'

import { useRef } from 'react'
import {
  Briefcase,
  FileSearch,
  FileText,
  Handshake,
  MessageCircle,
  PenLine,
  Scale,
  ScrollText,
  Shield,
  Waypoints,
  type LucideIcon,
} from 'lucide-react'
import { useLandingReveal } from '../hooks/use-landing-motion'
import type { LawyerService } from '../types'

const ICONS: Record<string, LucideIcon> = {
  MessageCircle,
  Briefcase,
  FileSearch,
  FileText,
  PenLine,
  Shield,
  ScrollText,
  Scale,
  Waypoints,
  Handshake,
}

type ServicesSectionProps = {
  services: LawyerService[]
}

export function ServicesSection({ services }: ServicesSectionProps) {
  const rootRef = useRef<HTMLElement>(null)
  useLandingReveal(rootRef)

  return (
    <section
      id='services'
      ref={rootRef}
      className='lp-section scroll-mt-24 py-16 sm:py-20'
      style={{
        background:
          'linear-gradient(180deg, var(--lp-surface-tint), var(--lp-surface-tint-strong))',
      }}
    >
      <div className='lp-container'>
        <div className='lp-reveal mb-10 max-w-2xl'>
          <p className='lp-kicker'>خدمات</p>
          <h2 className='lp-title mt-3 text-3xl sm:text-4xl'>خدمات حقوقی</h2>
          <p className='lp-lead mt-3 text-sm sm:text-base'>
            خدماتی که می‌توانید برای شروع یا پیگیری پرونده درخواست کنید.
          </p>
        </div>

        <div className='grid gap-x-10 gap-y-0 sm:grid-cols-2 lg:grid-cols-3'>
          {services.map((service) => {
            const Icon = ICONS[service.icon] ?? Scale
            return (
              <article
                key={service.id}
                className='lp-reveal border-t border-[color:var(--lp-line-soft)] py-6'
              >
                <div className='mb-3 flex size-9 items-center justify-center text-[var(--lp-brass)]'>
                  <Icon className='size-5' strokeWidth={1.5} />
                </div>
                <h3 className='text-base font-semibold text-[var(--lp-ink-text)]'>
                  {service.title}
                </h3>
                <p className='mt-2 text-sm leading-7 text-[var(--lp-muted)]'>
                  {service.description}
                </p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
