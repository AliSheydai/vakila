'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowRight, Smartphone, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import {
  isValidIranianMobile,
  normalizeIranianPhone,
  formatIranianMobileLocal,
} from '@/lib/iranian-phone'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import {
  useAuthStore,
  roleHome,
  type AuthRole,
  type AuthUser,
} from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'

const OTP_LENGTH = 5

type Step = 'phone' | 'otp' | 'name'

type OtpRequestData = {
  expiresAt: string
  cooldownSeconds: number
  destinationMasked: string
}

type OtpVerifyData = {
  user: AuthUser
  needsName: boolean
}

type CompleteProfileData = {
  user: AuthUser
}

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  redirectTo?: string
}

function resolveRedirect(role: AuthRole, redirectTo?: string): string {
  if (redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
    const isAdminPath =
      redirectTo === '/admin' || redirectTo.startsWith('/admin/')
    const isClientPath =
      redirectTo === '/dashboard' ||
      redirectTo.startsWith('/dashboard/') ||
      redirectTo.startsWith('/cases') ||
      redirectTo.startsWith('/sessions') ||
      redirectTo.startsWith('/payments')

    if (role === 'client' && isAdminPath) return '/dashboard'
    if ((role === 'lawyer' || role === 'super_admin') && isClientPath) {
      return '/admin'
    }
    return redirectTo
  }
  return roleHome(role)
}

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: UserAuthFormProps) {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.auth.setUser)

  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [maskedPhone, setMaskedPhone] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [visible, setVisible] = useState(true)
  const submittingOtp = useRef(false)

  useEffect(() => {
    if (cooldown <= 0) return
    const id = window.setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [cooldown])

  const goToStep = useCallback((next: Step) => {
    setVisible(false)
    window.setTimeout(() => {
      setStep(next)
      setError(null)
      setVisible(true)
    }, 160)
  }, [])

  const finishAuth = useCallback(
    (user: AuthUser) => {
      setUser(user)
      const target = resolveRedirect(user.role, redirectTo)
      toast.success(
        user.name
          ? `خوش آمدید، ${user.name}`
          : 'ورود با موفقیت انجام شد'
      )
      router.replace(target)
    },
    [redirectTo, router, setUser]
  )

  async function requestOtp(resend = false) {
    setError(null)
    const normalized = formatIranianMobileLocal(phone)
    if (!isValidIranianMobile(phone)) {
      setError('شماره موبایل معتبر نیست.')
      return
    }

    setLoading(true)
    const result = await api<OtpRequestData>('/api/auth/otp/request', {
      method: 'POST',
      body: { phone: normalized },
    })
    setLoading(false)

    if (!result.ok) {
      setError(result.error)
      toast.error(result.error)
      return
    }

    setPhone(normalized)
    setMaskedPhone(result.data.destinationMasked)
    setCooldown(result.data.cooldownSeconds || 60)
    setCode('')
    if (!resend) {
      goToStep('otp')
    } else {
      toast.success('کد تأیید دوباره ارسال شد.')
    }
  }

  async function verifyOtp(otpValue: string) {
    if (submittingOtp.current) return
    if (otpValue.length !== OTP_LENGTH) return

    submittingOtp.current = true
    setLoading(true)
    setError(null)

    const result = await api<OtpVerifyData>('/api/auth/otp/verify', {
      method: 'POST',
      body: { phone, code: otpValue },
    })

    setLoading(false)
    submittingOtp.current = false

    if (!result.ok) {
      setError(result.error)
      toast.error(result.error)
      setCode('')
      return
    }

    if (result.data.needsName) {
      setUser(result.data.user)
      goToStep('name')
      return
    }

    finishAuth(result.data.user)
  }

  async function completeProfile() {
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      setError('نام و نام خانوادگی را کامل وارد کنید.')
      return
    }

    setLoading(true)
    setError(null)

    const result = await api<CompleteProfileData>(
      '/api/auth/complete-profile',
      {
        method: 'POST',
        body: { name: trimmed },
      }
    )

    setLoading(false)

    if (!result.ok) {
      setError(result.error)
      toast.error(result.error)
      return
    }

    finishAuth(result.data.user)
  }

  return (
    <div className={cn('relative', className)} {...props}>
      <div
        className={cn(
          'transition-all duration-200 ease-out',
          visible ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
        )}
      >
        {step === 'phone' && (
          <form
            className='grid gap-4'
            onSubmit={(e) => {
              e.preventDefault()
              void requestOtp(false)
            }}
          >
            <div className='grid gap-2'>
              <Label htmlFor='phone'>شماره موبایل</Label>
              <div className='relative'>
                <Smartphone className='pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  id='phone'
                  dir='ltr'
                  inputMode='tel'
                  autoComplete='tel'
                  placeholder='0912…'
                  className='ps-9 text-left tracking-wide'
                  value={phone}
                  onChange={(e) => {
                    setPhone(normalizeIranianPhone(e.target.value))
                    setError(null)
                  }}
                  disabled={loading}
                />
              </div>
              {error && (
                <p className='text-sm text-destructive' role='alert'>
                  {error}
                </p>
              )}
            </div>

            <Button type='submit' disabled={loading} className='mt-1'>
              {loading ? (
                <Loader2 className='size-4 animate-spin' />
              ) : null}
              دریافت کد تأیید
            </Button>
          </form>
        )}

        {step === 'otp' && (
          <form
            className='grid gap-4'
            onSubmit={(e) => {
              e.preventDefault()
              void verifyOtp(code)
            }}
          >
            <div className='space-y-1 text-center'>
              <h3 className='font-display text-base font-semibold tracking-tight'>
                کد تأیید را وارد کنید
              </h3>
              <p className='text-sm text-muted-foreground'>
                کد ۵ رقمی به{' '}
                <span dir='ltr' className='font-medium text-foreground'>
                  {maskedPhone || phone}
                </span>{' '}
                ارسال شد.
              </p>
            </div>

            <div className='flex flex-col items-center gap-3'>
              <InputOTP
                maxLength={OTP_LENGTH}
                value={code}
                onChange={(value) => {
                  setCode(value)
                  setError(null)
                  if (value.length === OTP_LENGTH) {
                    void verifyOtp(value)
                  }
                }}
                disabled={loading}
                containerClassName='justify-center'
                autoFocus
              >
                <InputOTPGroup className='gap-2'>
                  {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className='size-11 rounded-lg border text-base sm:size-12'
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>

              {error && (
                <p className='text-sm text-destructive' role='alert'>
                  {error}
                </p>
              )}
            </div>

            <Button
              type='submit'
              disabled={loading || code.length < OTP_LENGTH}
            >
              {loading ? <Loader2 className='size-4 animate-spin' /> : null}
              تأیید و ادامه
            </Button>

            <div className='flex items-center justify-between gap-2 text-sm'>
              <button
                type='button'
                className='inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground'
                onClick={() => {
                  setCode('')
                  goToStep('phone')
                }}
                disabled={loading}
              >
                <ArrowRight className='size-3.5' />
                تغییر شماره
              </button>

              <button
                type='button'
                className={cn(
                  'text-muted-foreground transition-colors',
                  cooldown > 0
                    ? 'cursor-not-allowed opacity-60'
                    : 'hover:text-foreground'
                )}
                disabled={loading || cooldown > 0}
                onClick={() => void requestOtp(true)}
              >
                {cooldown > 0
                  ? `ارسال مجدد (${cooldown.toLocaleString('fa-IR')})`
                  : 'ارسال مجدد کد'}
              </button>
            </div>
          </form>
        )}

        {step === 'name' && (
          <form
            className='grid gap-4'
            onSubmit={(e) => {
              e.preventDefault()
              void completeProfile()
            }}
          >
            <div className='space-y-1 text-center'>
              <h3 className='font-display text-base font-semibold tracking-tight'>
                نام و نام خانوادگی خود را وارد کنید
              </h3>
              <p className='text-sm text-muted-foreground'>
                برای تکمیل ثبت‌نام، نام نمایشی خود را مشخص کنید.
              </p>
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='full-name'>نام و نام خانوادگی</Label>
              <div className='relative'>
                <UserRound className='pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  id='full-name'
                  autoComplete='name'
                  placeholder='مثلاً علی رضایی'
                  className='ps-9'
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setError(null)
                  }}
                  disabled={loading}
                  autoFocus
                />
              </div>
              {error && (
                <p className='text-sm text-destructive' role='alert'>
                  {error}
                </p>
              )}
            </div>

            <Button type='submit' disabled={loading || name.trim().length < 2}>
              {loading ? <Loader2 className='size-4 animate-spin' /> : null}
              ورود به پنل
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
