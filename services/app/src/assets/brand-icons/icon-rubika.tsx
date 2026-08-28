import { type SVGProps } from 'react'
import { cn } from '@/lib/utils'

export function IconRubika({ className, ...props }: SVGProps<SVGSVGElement>) {
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
      <title>Rubika</title>
      <path d='M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1.2 5.5h2.4v9H10.8v-9zm5.2 0c1.5 0 2.7 1.2 2.7 2.7v3.6c0 1.5-1.2 2.7-2.7 2.7h-1.8v-9h1.8zm0 2.2h-.6v4.6h.6c.3 0 .5-.2.5-.5v-3.6c0-.3-.2-.5-.5-.5zM6.8 7.5h2.4v9H6.8v-9z' />
    </svg>
  )
}
