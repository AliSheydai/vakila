'use client'

/**
 * Placeholder for client panel — owned by another developer.
 * Lawyer/admin UI lives under /admin.
 */
export default function ClientHomePage() {
  return (
    <main className='flex min-h-svh items-center justify-center bg-background px-6'>
      <div className='max-w-md text-center'>
        <h1 className='text-2xl font-semibold tracking-tight'>پنل موکل</h1>
        <p className='mt-2 text-sm text-muted-foreground'>
          این بخش توسط تیم دیگر در حال توسعه است. پنل وکیل را از مسیر{' '}
          <a href='/admin' className='font-medium text-foreground underline-offset-4 hover:underline'>
            /admin
          </a>{' '}
          باز کنید.
        </p>
      </div>
    </main>
  )
}
