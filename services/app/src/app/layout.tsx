import type { Metadata, Viewport } from 'next'
import { Vazirmatn, Inter, Manrope } from 'next/font/google'
import { Providers } from './providers'
import '@/styles/index.css'

const vazirmatn = Vazirmatn({
  subsets: ['arabic', 'latin'],
  variable: '--font-vazirmatn',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

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
  themeColor: '#fff',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang='fa'
      dir='rtl'
      suppressHydrationWarning
      className={`${vazirmatn.variable} ${inter.variable} ${manrope.variable}`}
    >
      <body className='min-h-svh w-full bg-background font-sans text-foreground antialiased'>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
