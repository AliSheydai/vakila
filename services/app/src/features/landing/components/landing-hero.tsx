'use client'

import dynamic from 'next/dynamic'
import { useRef } from 'react'
import { brandName } from '@/features/landing/data/lawyer-profile'
import type { LawyerProfile } from '../types'
import { useHeroIntro } from '../hooks/use-landing-motion'
import { useLandingActions } from './landing-actions'

const HeroScene = dynamic(
  () =>
    import('./hero-scene').then((m) => m.HeroScene),
  { ssr: false }
)

type LandingHeroProps = {
  profile: LawyerProfile
}

export function LandingHero({ profile }: LandingHeroProps) {
  const { openRequest, startCaseIntake } = useLandingActions()
  const rootRef = useRef<HTMLElement>(null)
  useHeroIntro(rootRef)

  const { lawyer } = profile

  return (
    <section
      ref={rootRef}
      className='relative isolate min-h-[100svh] overflow-hidden'
      style={{
        background:
          'radial-gradient(90% 70% at 70% 40%, rgba(26,70,84,0.55), transparent 60%), linear-gradient(160deg, #031015 0%, #06141c 45%, #0a2430 100%)',
      }}
    >
      <div
        data-hero='scene'
        className='pointer-events-none absolute inset-0 opacity-0'
      >
        <HeroScene className='absolute inset-0 h-full w-full' />
        <div
          className='absolute inset-0'
          style={{
            background:
              'linear-gradient(90deg, rgba(3,16,21,0.88) 0%, rgba(3,16,21,0.55) 42%, rgba(3,16,21,0.2) 70%, rgba(3,16,21,0.45) 100%), linear-gradient(180deg, rgba(3,16,21,0.35) 0%, transparent 30%, rgba(3,16,21,0.75) 100%)',
          }}
        />
      </div>

      {/* Atmospheric grain */}
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay'
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }}
      />

      <div className='lp-container relative z-10 flex min-h-[100svh] flex-col justify-end pb-16 pt-28 sm:justify-center sm:pb-20 sm:pt-24'>
        <div className='max-w-xl space-y-6 sm:space-y-7'>
          <p
            data-hero='brand'
            className='lp-display text-[clamp(3.4rem,12vw,6.5rem)] leading-[0.95] font-bold tracking-tight text-[#f3efe6] opacity-0'
          >
            {brandName}
          </p>

          <h1
            data-hero='headline'
            className='lp-display max-w-lg text-[clamp(1.65rem,4.2vw,2.55rem)] leading-[1.35] font-bold text-[#e8c87a] opacity-0'
          >
            دفاع دقیق. مسیر روشن.
          </h1>

          <p
            data-hero='lead'
            className='max-w-md text-base leading-8 text-[#a8c0c6] opacity-0 sm:text-lg'
          >
            {lawyer.headline} — همراهی حرفه‌ای از نخستین مشاوره تا پیگیری پرونده.
          </p>

          <div className='flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap'>
            <button
              type='button'
              data-hero='cta'
              className='lp-btn-primary w-full opacity-0 sm:w-auto'
              onClick={() => openRequest('consultation')}
            >
              دریافت مشاوره
            </button>
            <button
              type='button'
              data-hero='cta'
              className='lp-btn-ghost w-full opacity-0 sm:w-auto'
              onClick={() => startCaseIntake()}
            >
              درخواست پذیرش پرونده
            </button>
          </div>
        </div>
      </div>

      <div
        aria-hidden
        className='pointer-events-none absolute inset-x-0 bottom-0 h-24'
        style={{
          background: 'linear-gradient(180deg, transparent, var(--lp-hero-fade))',
        }}
      />
    </section>
  )
}
