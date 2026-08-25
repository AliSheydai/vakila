'use client'

import { useEffect, useState } from 'react'
import { useLayout } from '@/context/layout-provider'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'

type HeaderProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean
  ref?: React.Ref<HTMLElement>
}

export function Header({ className, fixed, children, ...props }: HeaderProps) {
  const [offset, setOffset] = useState(0)
  const { state } = useSidebar()
  const { collapsible } = useLayout()

  // When icon-collapsed, the toggle lives in the sidebar header (logo slot).
  // Keep the header trigger for mobile and for offcanvas mode.
  const hideDesktopTrigger = state === 'collapsed' && collapsible === 'icon'

  useEffect(() => {
    const onScroll = () => {
      setOffset(document.body.scrollTop || document.documentElement.scrollTop)
    }

    // Add scroll listener to the body
    document.addEventListener('scroll', onScroll, { passive: true })

    // Clean up the event listener on unmount
    return () => document.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'z-50 h-16',
        fixed && 'header-fixed peer/header sticky top-0 w-[inherit]',
        offset > 10 && fixed ? 'shadow' : 'shadow-none',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'relative flex h-full items-center gap-3 p-4 sm:gap-4',
          offset > 10 &&
            fixed &&
            'after:absolute after:inset-0 after:-z-10 after:bg-background/20 after:backdrop-blur-lg'
        )}
      >
        <SidebarTrigger
          variant='outline'
          className={cn(
            'max-md:scale-125',
            hideDesktopTrigger && 'md:hidden'
          )}
        />
        <Separator
          orientation='vertical'
          className={cn('h-6', hideDesktopTrigger && 'md:hidden')}
        />
        {children}
      </div>
    </header>
  )
}
