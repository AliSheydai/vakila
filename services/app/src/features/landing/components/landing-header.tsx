'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Logo } from '@/assets/logo'
import { brandName } from '@/features/landing/data/lawyer-profile'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useLandingActions } from './landing-actions'

const NAV_LINKS = [
  { href: '#specialties', label: 'تخصص‌ها' },
  { href: '#services', label: 'خدمات' },
  { href: '#process', label: 'نحوه همکاری' },
  { href: '#faq', label: 'سؤالات متداول' },
] as const

export function LandingHeader() {
  const { openRequest } = useLandingActions()
  const [scrolled, setScrolled] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(
        (document.body.scrollTop || document.documentElement.scrollTop) > 24
      )
    }
    document.addEventListener('scroll', onScroll, { passive: true })
    return () => document.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className='fixed inset-x-0 top-0 z-50'>
      <div
        className={cn(
          'mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 transition-all duration-500 sm:px-6',
          scrolled &&
            'mt-2 h-14 rounded-full border border-[rgba(201,162,90,0.22)] bg-[#06141c]/78 px-4 shadow-[0_12px_40px_rgba(3,16,21,0.35)] backdrop-blur-xl sm:px-5'
        )}
      >
        <Link
          href='/'
          className='flex shrink-0 items-center gap-2 text-[#f3efe6]'
        >
          <Logo className='size-5 text-[#c9a25a]' />
          <span className='lp-display text-lg font-bold tracking-tight'>
            {brandName}
          </span>
        </Link>

        <nav className='ms-6 hidden items-center gap-5 md:flex'>
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className='text-sm text-[#a8c0c6] transition-colors hover:text-[#e8c87a]'
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className='ms-auto flex items-center gap-2'>
          <div className='hidden sm:block [&_button]:text-[#a8c0c6]'>
            <ThemeSwitch />
          </div>
          <Button
            variant='ghost'
            size='sm'
            className='hidden text-[#a8c0c6] hover:bg-white/5 hover:text-[#f3efe6] sm:inline-flex'
            asChild
          >
            <Link href='/login'>ورود</Link>
          </Button>
          <button
            type='button'
            className='lp-btn-primary hidden !min-h-9 !px-4 !text-sm sm:inline-flex'
            onClick={() => openRequest('consultation')}
          >
            دریافت مشاوره
          </button>

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant='outline'
                size='icon'
                className='border-[rgba(201,162,90,0.28)] bg-transparent text-[#f3efe6] hover:bg-white/5 md:hidden'
                aria-label='منو'
              >
                <Menu className='size-4' />
              </Button>
            </SheetTrigger>
            <SheetContent
              side='left'
              className='w-[min(100%,20rem)] border-[#1a4654] bg-[#06141c] text-[#f3efe6]'
            >
              <SheetHeader>
                <SheetTitle className='flex items-center gap-2 text-[#f3efe6]'>
                  <Logo className='size-5 text-[#c9a25a]' />
                  <span className='lp-display'>{brandName}</span>
                </SheetTitle>
              </SheetHeader>
              <div className='mt-6 flex flex-col gap-1 px-4'>
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className='rounded-md px-3 py-2.5 text-sm text-[#a8c0c6] hover:bg-white/5 hover:text-[#e8c87a]'
                    onClick={() => setSheetOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
              <div className='mt-6 flex flex-col gap-2 px-4'>
                <Button
                  variant='outline'
                  className='border-[rgba(201,162,90,0.3)] bg-transparent text-[#f3efe6]'
                  asChild
                >
                  <Link href='/login' onClick={() => setSheetOpen(false)}>
                    ورود
                  </Link>
                </Button>
                <button
                  type='button'
                  className='lp-btn-primary w-full'
                  onClick={() => {
                    setSheetOpen(false)
                    openRequest('consultation')
                  }}
                >
                  دریافت مشاوره
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
