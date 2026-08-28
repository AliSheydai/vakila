'use client'

import { useRef } from 'react'
import { ArrowUpRight, MessageCircle, PhoneCall } from 'lucide-react'
import { useLandingReveal } from '../hooks/use-landing-motion'
import type { AvailabilityInfo, ContactInfo } from '../types'
import { useLandingActions } from './landing-actions'

type ContactCtaProps = {
  availability: AvailabilityInfo
  contact: ContactInfo
}

export function ContactCta({ availability, contact }: ContactCtaProps) {
  const { openRequest, startCaseIntake } = useLandingActions()
  const rootRef = useRef<HTMLElement>(null)
  useLandingReveal(rootRef)

  return (
    <section
      id='contact'
      ref={rootRef}
      className='lp-section relative scroll-mt-24 overflow-hidden py-20 sm:py-24'
      style={{
        background:
          'radial-gradient(90% 80% at 80% 20%, rgba(201,162,90,0.18), transparent 50%), linear-gradient(145deg, #031015 0%, #06141c 50%, #0c2a36 100%)',
      }}
    >
      <div className='lp-container relative z-10'>
        <div className='grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-end'>
          <div className='lp-reveal'>
            <p className='lp-kicker'>شروع همکاری</p>
            <h2 className='lp-display mt-4 text-3xl font-bold text-[#f3efe6] sm:text-4xl'>
              {contact.title}
            </h2>
            <p className='mt-4 max-w-xl text-sm leading-8 text-[#a8c0c6] sm:text-base'>
              {contact.subtitle}
            </p>
            <p className='mt-2 text-xs text-[#7f969c]'>
              {availability.responseHint} · {availability.workingHours}
            </p>
            <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
              <button
                type='button'
                className='lp-btn-primary w-full sm:w-auto'
                onClick={() => openRequest('consultation')}
              >
                <MessageCircle className='size-4' />
                دریافت مشاوره
              </button>
              <button
                type='button'
                className='lp-btn-ghost w-full sm:w-auto'
                onClick={() => startCaseIntake()}
              >
                <PhoneCall className='size-4' />
                درخواست پذیرش پرونده
              </button>
            </div>
          </div>

          <div className='lp-reveal grid gap-3 sm:grid-cols-2'>
            {contact.methods.map((method) => (
              <div key={method.id} className='lp-contact-card group'>
                <a
                  href={method.href}
                  className='block'
                  target={method.href.startsWith('http') ? '_blank' : undefined}
                  rel={
                    method.href.startsWith('http') ? 'noreferrer noopener' : undefined
                  }
                >
                  <p className='text-xs text-[#8ea7ae]'>{method.label}</p>
                  <p className='mt-2 flex items-center justify-between gap-2 text-sm font-semibold text-[#f3efe6] sm:text-base'>
                    <span>{method.value}</span>
                    <ArrowUpRight className='size-4 text-[#c9a25a] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5' />
                  </p>
                </a>
                {method.socialLinks?.length ? (
                  <div className='mt-3 flex items-center gap-2'>
                    {method.socialLinks.map((social) => (
                      <a
                        key={social.id}
                        href={social.href}
                        className='lp-social-chip'
                        target='_blank'
                        rel='noreferrer noopener'
                        aria-label={social.label}
                        title={social.label}
                      >
                        <svg viewBox='0 0 24 24' aria-hidden='true'>
                          <path d={social.path} />
                        </svg>
                      </a>
                    ))}
                  </div>
                ) : null}
                {method.hint ? (
                  <p className='mt-2 text-xs text-[#7f969c]'>{method.hint}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
