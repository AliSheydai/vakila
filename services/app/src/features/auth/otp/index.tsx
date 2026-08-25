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
import { OtpForm } from './components/otp-form'

export function Otp() {
  return (
    <AuthLayout>
      <Card className='max-w-md gap-4'>
        <CardHeader>
          <CardTitle className='text-base tracking-tight'>
            احراز هویت دو مرحله‌ای
          </CardTitle>
          <CardDescription>
            لطفاً کد تأیید را وارد کنید. <br />
            کد تأیید به ایمیل شما ارسال شده است.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OtpForm />
        </CardContent>
        <CardFooter>
          <p className='px-8 text-center text-sm text-muted-foreground'>
            کد را دریافت نکردید؟{' '}
            <Link
              href='/sign-in'
              className='underline underline-offset-4 hover:text-primary'
            >
              ارسال مجدد کد
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
