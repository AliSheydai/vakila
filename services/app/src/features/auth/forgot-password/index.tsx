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
import { ForgotPasswordForm } from './components/forgot-password-form'

export function ForgotPassword() {
  return (
    <AuthLayout>
      <Card className='max-w-sm gap-4 sm:min-w-sm'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>
            فراموشی رمز عبور
          </CardTitle>
          <CardDescription>
            ایمیل ثبت‌شده خود را وارد کنید تا لینک بازیابی رمز عبور برایتان
            ارسال شود.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
        </CardContent>
        <CardFooter>
          <p className='mx-auto px-8 text-center text-sm text-balance text-muted-foreground'>
            حساب کاربری ندارید؟{' '}
            <Link
              href='/sign-up'
              className='underline underline-offset-4 hover:text-primary'
            >
              ثبت‌نام
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
