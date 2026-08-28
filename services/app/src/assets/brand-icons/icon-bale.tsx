import { type SVGProps } from 'react'
import { cn } from '@/lib/utils'

export function IconBale({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      role='img'
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
      width='24'
      height='24'
      className={cn(className)}
      fill='currentColor'
      {...props}
    >
      <title>Bale</title>
      <path d='M12 2C6.48 2 2 6.15 2 11c0 2.9 1.46 5.5 3.76 7.2L5 22l3.5-1.8C9.6 20.6 10.8 21 12 21c5.52 0 10-4.15 10-9.5S17.52 2 12 2zm0 16c-1.1 0-2.15-.25-3.08-.7l-.22-.12-2.2.55.58-2.14-.14-.22C5.8 14.4 5.2 12.8 5.2 11 5.2 7.13 8.28 4 12 4s6.8 3.13 6.8 7-3.08 7-6.8 7z' />
    </svg>
  )
}
