'use client'

import { Wallet, Receipt, ArrowDownLeft, CreditCard } from 'lucide-react'
import { SectionPlaceholder } from '@/components/section-placeholder'

export function FinancialPage() {
  return (
    <SectionPlaceholder
      title='مالی'
      description='دریافت‌ها، پرداخت‌ها و وضعیت مالی پرونده‌ها را شفاف و یکجا پیگیری کنید.'
      icon={Wallet}
      emptyTitle='تراکنشی ثبت نشده'
      emptyDescription='با ثبت اولین دریافت یا هزینه، خلاصه مالی و جزئیات تراکنش‌ها اینجا نمایش داده می‌شود.'
      stats={[
        { label: 'دریافتی ماه', hint: '—' },
        { label: 'پرداختی ماه', hint: '—' },
        { label: 'طلب موکل', hint: '—' },
        { label: 'مانده', hint: '—' },
      ]}
      highlights={[
        {
          title: 'جریان نقدی',
          description: 'ورود و خروج وجه مرتبط با هر پرونده در یک خط زمانی.',
          icon: ArrowDownLeft,
        },
        {
          title: 'صورتحساب‌ها',
          description: 'پیگیری فاکتورها، وضعیت پرداخت و سررسیدها.',
          icon: Receipt,
        },
        {
          title: 'پرداخت‌های آنلاین',
          description: 'ثبت و رصد پرداخت‌های انجام‌شده توسط موکل.',
          icon: CreditCard,
        },
      ]}
    />
  )
}
