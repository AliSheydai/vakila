'use client'

import Link from 'next/link'
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
  const redirect = searchParams.get('redirect') || undefined

  return (
    <AuthLayout>
      <Card className='max-w-sm gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>ورود به حساب</CardTitle>
          <CardDescription>
            برای ورود، ایمیل و رمز عبور خود را وارد کنید.{' '}
            <br className='max-sm:hidden' /> حساب کاربری ندارید؟{' '}
            <Link
              href='/sign-up'
              className='text-nowrap underline underline-offset-4 hover:text-primary'
            >
              ثبت‌نام
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserAuthForm redirectTo={redirect} />
        </CardContent>
        <CardFooter>
          <p className='px-8 text-center text-sm text-muted-foreground'>
            با کلیک روی ورود، با{' '}
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
