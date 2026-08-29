import type { CSSProperties, ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'
import { amiri, inter, manrope, vazirmatn } from '@/lib/fonts'
import { Providers } from './providers'
import '@/styles/index.css'

export const metadata: Metadata = {
  title: {
    default: 'پنل مدیریت',
    template: '%s | پنل مدیریت',
  },
  description: 'پنل مدیریت وکلا',
  icons: {
    icon: [
      {
        url: '/images/favicon.svg',
        media: '(prefers-color-scheme: light)',
        type: 'image/svg+xml',
      },
      {
        url: '/images/favicon_light.svg',
        media: '(prefers-color-scheme: dark)',
        type: 'image/svg+xml',
      },
      {
        url: '/images/favicon.png',
        media: '(prefers-color-scheme: light)',
        type: 'image/png',
      },
      {
        url: '/images/favicon_light.png',
        media: '(prefers-color-scheme: dark)',
        type: 'image/png',
      },
    ],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  themeColor: '#f3efe6',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html
      lang='fa'
      dir='rtl'
      suppressHydrationWarning
      className={`${vazirmatn.variable} ${amiri.variable} ${inter.variable} ${manrope.variable}`}
      style={
        {
          // Concrete family for Sonner (avoids its system font stack)
          '--font-toast': vazirmatn.style.fontFamily,
        } as CSSProperties
      }
    >
      <body className='min-h-svh w-full bg-background font-sans text-foreground antialiased'>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
