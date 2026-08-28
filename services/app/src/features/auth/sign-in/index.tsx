'use client'

import { useSearchParams } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { UserAuthForm } from './components/user-auth-form'

export function SignIn() {
  const searchParams = useSearchParams()
  const redirect =
    searchParams.get('next') || searchParams.get('redirect') || undefined

  return (
    <AuthLayout>
      <Card className='max-w-sm gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>
            ورود با کد یک‌بارمصرف
          </CardTitle>
          <CardDescription>
            شماره موبایل خود را وارد کنید تا کد تأیید برایتان ارسال شود.
            حساب جدید به‌صورت خودکار ساخته می‌شود.
            <br className='max-sm:hidden' />
            <span className='mt-1.5 block text-xs text-muted-foreground/90'>
              نخستین کاربر سیستم به‌عنوان وکیل ادمین ثبت می‌شود.
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserAuthForm redirectTo={redirect} />
        </CardContent>
        <CardFooter>
          <p className='px-8 text-center text-sm text-muted-foreground'>
            با ادامه، با{' '}
            <a
              href='/terms'
              className='underline underline-offset-4 hover:text-primary'
            >
              شرایط استفاده
            </a>{' '}
            و{' '}
            <a
              href='/privacy'
              className='underline underline-offset-4 hover:text-primary'
            >
              حریم خصوصی
            </a>{' '}
            موافقت می‌کنید.
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
