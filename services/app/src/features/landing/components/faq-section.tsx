'use client'

import { useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { useLandingReveal } from '../hooks/use-landing-motion'
import type { FaqItem } from '../types'

type FaqSectionProps = {
  faq: FaqItem[]
}

function FaqRow({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className='border-b border-[rgba(16,32,40,0.1)]'>
        <CollapsibleTrigger asChild>
          <button
            type='button'
            className='flex w-full items-center justify-between gap-3 py-5 text-start'
          >
            <span className='text-sm font-medium text-[var(--lp-ink-text)] sm:text-base'>
              {item.question}
            </span>
            <ChevronDown
              className={cn(
                'size-4 shrink-0 text-[var(--lp-brass)] transition-transform duration-300',
                open && 'rotate-180'
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className='pb-5 text-sm leading-7 text-[var(--lp-muted)]'>
            {item.answer}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

export function FaqSection({ faq }: FaqSectionProps) {
  const rootRef = useRef<HTMLElement>(null)
  useLandingReveal(rootRef)

  return (
    <section
      id='faq'
      ref={rootRef}
      className='lp-section scroll-mt-24 py-16 sm:py-20'
    >
      <div className='lp-container'>
        <div className='lp-reveal mb-8 max-w-2xl'>
          <p className='lp-kicker'>پاسخ‌ها</p>
          <h2 className='lp-title mt-3 text-3xl sm:text-4xl'>سؤالات متداول</h2>
          <p className='lp-lead mt-3 text-sm sm:text-base'>
            پاسخ به پرسش‌های رایج قبل از شروع همکاری.
          </p>
        </div>

        <div className='lp-reveal mx-auto max-w-3xl border-t border-[rgba(16,32,40,0.1)]'>
          {faq.map((item) => (
            <FaqRow key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  )
}
