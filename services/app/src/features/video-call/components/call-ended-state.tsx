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
    <div className='flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center'>
      <h1 className='text-xl font-bold tracking-tight'>{title}</h1>
      <p className='max-w-md text-sm text-muted-foreground'>{message}</p>
      <Button asChild>
        <Link href={backHref}>{backLabel}</Link>
      </Button>
    </div>
  )
}
