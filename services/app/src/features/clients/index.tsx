'use client'

import { Users, UserPlus, FolderOpen, IdCard } from 'lucide-react'
import { SectionPlaceholder } from '@/components/section-placeholder'

export function ClientsPage() {
  return (
    <SectionPlaceholder
      title='موکل‌ها'
      description='فهرست موکل‌ها، اطلاعات تماس و پرونده‌های مرتبط با هر موکل را از اینجا مدیریت کنید.'
      icon={Users}
      emptyTitle='هنوز موکلی ثبت نشده'
      emptyDescription='با افزودن اولین موکل، پروفایل، شماره‌ها و پرونده‌های مرتبط او را در یک جا ببینید و پیگیری کنید.'
      stats={[
        { label: 'کل موکل‌ها', hint: '—' },
        { label: 'فعال', hint: '—' },
        { label: 'پرونده‌دار', hint: '—' },
        { label: 'جدید این ماه', hint: '—' },
      ]}
      highlights={[
        {
          title: 'پروفایل یکپارچه',
          description: 'نام، تماس و مدارک هویتی هر موکل در یک نمای متمرکز.',
          icon: IdCard,
        },
        {
          title: 'پیوند با پرونده',
          description: 'دسترسی سریع به پرونده‌های باز و بسته‌شده هر موکل.',
          icon: FolderOpen,
        },
        {
          title: 'افزودن سریع',
          description: 'ثبت موکل جدید با حداقل فیلد و تکمیل تدریجی اطلاعات.',
          icon: UserPlus,
        },
      ]}
    />
  )
}
