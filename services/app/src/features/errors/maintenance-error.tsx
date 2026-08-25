import { Button } from '@/components/ui/button'

export function MaintenanceError() {
  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        <h1 className='text-[7rem] leading-tight font-bold'>۵۰۳</h1>
        <span className='font-medium text-lg'>سامانه در دست تعمیر است!</span>
        <p className='text-center text-muted-foreground'>
          سایت در حال حاضر در دسترس نیست. <br />
          به‌زودی بازخواهیم گشت.
        </p>
        <div className='mt-6 flex gap-4'>
          <Button variant='outline'>اطلاعات بیشتر</Button>
        </div>
      </div>
    </div>
  )
}
