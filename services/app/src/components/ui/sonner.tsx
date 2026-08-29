'use client'

import { Toaster as Sonner, type ToasterProps } from 'sonner'
import { useTheme } from '@/context/theme-provider'
import { cn } from '@/lib/utils'

const toastFontFamily = 'var(--font-toast)'

export function Toaster({
  toastOptions,
  style,
  className,
  ...props
}: ToasterProps) {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className={cn('toaster group [&_div[data-content]]:w-full', className)}
      style={
        {
          fontFamily: toastFontFamily,
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          ...style,
        } as React.CSSProperties
      }
      toastOptions={{
        ...toastOptions,
        style: {
          fontFamily: toastFontFamily,
          ...toastOptions?.style,
        },
      }}
      {...props}
    />
  )
}
