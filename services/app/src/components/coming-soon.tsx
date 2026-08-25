import { Telescope } from 'lucide-react'

export function ComingSoon() {
  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2 text-center'>
        <Telescope size={72} />
        <h1 className='text-4xl leading-tight font-bold'>به‌زودی!</h1>
        <p className='text-muted-foreground'>
          این صفحه هنوز آماده نشده است. <br />
          منتظر باشید!
        </p>
      </div>
    </div>
  )
}
