'use client'

import Link from 'next/link'
import { Logo } from '@/assets/logo'
import { brandName } from '@/features/landing/data/lawyer-profile'

export function LandingFooter() {
  return (
    <footer className='border-t border-[color:var(--lp-line-soft)] pb-24 md:pb-10'>
      <div className='lp-container flex flex-col gap-4 py-10 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-2 text-sm text-[var(--lp-muted)]'>
          <Logo className='size-4 text-[var(--lp-brass)]' />
          <span className='lp-display text-base text-[var(--lp-ink-text)]'>
            {brandName}
          </span>
          <span>· پلتفرم ارتباط با وکیل</span>
        </div>
        <div className='flex flex-wrap gap-5 text-sm text-[var(--lp-muted)]'>
          <Link href='/login' className='hover:text-[var(--lp-brass)]'>
            ورود
          </Link>
          <a href='#faq' className='hover:text-[var(--lp-brass)]'>
            سؤالات متداول
          </a>
          <a href='#services' className='hover:text-[var(--lp-brass)]'>
            خدمات
          </a>
        </div>
      </div>
    </footer>
  )
}
