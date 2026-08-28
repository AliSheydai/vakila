import Link from 'next/link'
import { Button } from '@/components/ui/button'

type CallEndedStateProps = {
  title: string
  message: string
  backHref: string
  backLabel?: string
}

export function CallEndedState({
  title,
  message,
  backHref,
  backLabel = 'بازگشت',
}: CallEndedStateProps) {
  return (
    <div className='video-call-page flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center font-sans'>
      <h1 className='text-xl font-semibold tracking-tight'>{title}</h1>
      <p className='max-w-md text-sm leading-7 text-muted-foreground'>{message}</p>
      <Button asChild>
        <Link href={backHref}>{backLabel}</Link>
      </Button>
    </div>
  )
}
