'use client'

import { BarChart3, TrendingUp, PieChart, Activity } from 'lucide-react'
import { SectionPlaceholder } from '@/components/section-placeholder'

export function StatsPage() {
  return (
    <SectionPlaceholder
      title='آمارها'
      description='نمای کلی عملکرد دفتر، روند پرونده‌ها و شاخص‌های کلیدی را در یک داشبورد ببینید.'
      icon={BarChart3}
      emptyTitle='هنوز داده‌ای برای تحلیل نیست'
      emptyDescription='با ثبت پرونده‌ها و رویدادها، نمودارها و شاخص‌های عملکرد اینجا زنده می‌شوند.'
      stats={[
        { label: 'پرونده‌های فعال', hint: '—' },
        { label: 'نرخ پیگیری', hint: '—' },
        { label: 'جلسات ماه', hint: '—' },
        { label: 'رشد ماهانه', hint: '—' },
      ]}
      highlights={[
        {
          title: 'روند پرونده‌ها',
          description: 'مقایسه وضعیت باز، در انتظار و بسته‌شده در بازه زمانی.',
          icon: TrendingUp,
        },
        {
          title: 'توزیع موضوعی',
          description: 'سهم انواع پرونده و حوزه‌های کاری دفتر شما.',
          icon: PieChart,
        },
        {
          title: 'فعالیت روزانه',
          description: 'نمای ساده از اقدام‌ها و جلسات در روزهای اخیر.',
          icon: Activity,
        },
      ]}
    />
  )
}
