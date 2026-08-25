'use client'

import { CalendarDays, Bell, MapPin, Gavel } from 'lucide-react'
import { SectionPlaceholder } from '@/components/section-placeholder'

export function EventsPage() {
  return (
    <SectionPlaceholder
      title='رویدادها'
      description='جلسات دادگاه، ملاقات‌ها و مهلت‌های مهم را در یک تقویم منسجم دنبال کنید.'
      icon={CalendarDays}
      emptyTitle='رویدادی برای نمایش نیست'
      emptyDescription='وقتی جلسات و مهلت‌ها را ثبت کنید، اینجا به‌صورت زمانی و با یادآوری‌های به‌موقع دیده می‌شوند.'
      stats={[
        { label: 'امروز', hint: '—' },
        { label: 'این هفته', hint: '—' },
        { label: 'در انتظار', hint: '—' },
        { label: 'گذشته', hint: '—' },
      ]}
      highlights={[
        {
          title: 'تقویم پرونده‌محور',
          description: 'هر رویداد به پرونده و موکل مربوطه وصل می‌ماند.',
          icon: Gavel,
        },
        {
          title: 'یادآوری هوشمند',
          description: 'هشدار قبل از جلسه یا مهلت تا چیزی از قلم نیفتد.',
          icon: Bell,
        },
        {
          title: 'زمان و مکان',
          description: 'ساعت، مکان و جزئیات جلسه در یک نگاه.',
          icon: MapPin,
        },
      ]}
    />
  )
}
