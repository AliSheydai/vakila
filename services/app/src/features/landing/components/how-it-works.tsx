'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { ProcessStep } from '../types'

gsap.registerPlugin(ScrollTrigger)

type HowItWorksProps = {
  steps: ProcessStep[]
}

export function HowItWorks({ steps }: HowItWorksProps) {
  const rootRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      gsap.from('.lp-step', {
        opacity: 0,
        y: 32,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top 75%',
        },
      })

      gsap.from('.lp-process-line', {
        scaleX: 0,
        transformOrigin: 'right center',
        duration: 1.2,
        ease: 'power2.inOut',
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top 70%',
        },
      })
    },
    { scope: rootRef }
  )

  return (
    <section
      id='process'
      ref={rootRef}
      className='lp-section scroll-mt-24 py-16 sm:py-20'
      style={{
        background:
          'radial-gradient(80% 60% at 50% 0%, rgba(201,162,90,0.08), transparent 55%)',
      }}
    >
      <div className='lp-container'>
        <div className='mb-12 max-w-2xl'>
          <p className='lp-kicker'>مسیر همکاری</p>
          <h2 className='lp-title mt-3 text-3xl sm:text-4xl'>نحوه همکاری</h2>
          <p className='lp-lead mt-3 text-sm sm:text-base'>
            مسیر ساده از درخواست تا شروع پیگیری پرونده.
          </p>
        </div>

        <div className='relative'>
          <div
            className='lp-process-line pointer-events-none absolute top-5 right-0 left-0 hidden h-px bg-gradient-to-l from-[var(--lp-brass)] via-[rgba(201,162,90,0.35)] to-transparent lg:block'
            aria-hidden
          />

          <ol className='grid gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-5'>
            {steps.map((step) => (
              <li key={step.id} className='lp-step relative'>
                <span className='lp-display relative z-10 inline-flex size-10 items-center justify-center rounded-full border border-[color:var(--lp-line)] bg-[var(--lp-paper)] text-lg font-bold text-[var(--lp-brass)]'>
                  {step.step.toLocaleString('fa-IR')}
                </span>
                <h3 className='mt-4 text-sm font-semibold leading-snug text-[var(--lp-ink-text)]'>
                  {step.title}
                </h3>
                <p className='mt-2 text-sm leading-7 text-[var(--lp-muted)]'>
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
