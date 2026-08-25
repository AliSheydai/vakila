import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { SignUpForm } from './components/sign-up-form'

export function SignUp() {
  return (
    <AuthLayout>
      <Card className='max-w-sm gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>
            ایجاد حساب کاربری
          </CardTitle>
          <CardDescription>
            برای ایجاد حساب، ایمیل و رمز عبور خود را وارد کنید. <br />
            قبلاً ثبت‌نام کرده‌اید؟{' '}
            <Link
              href='/sign-in'
              className='underline underline-offset-4 hover:text-primary'
            >
              ورود
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm />
        </CardContent>
        <CardFooter>
          <p className='px-8 text-center text-sm text-muted-foreground'>
            با ایجاد حساب، با{' '}
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
