import {
  LayoutDashboard,
  FolderOpen,
  Calendar,
  CreditCard,
  Users,
  UserCog,
  CalendarDays,
  BarChart3,
  Wallet,
  Scale,
  UserRound,
  Briefcase,
  HardDrive,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'کاربر',
    phone: '',
    avatar: '',
  },
  teams: [
    {
      name: 'پنل وکیل',
      logo: Scale,
      plan: 'مدیریت',
      url: '/admin',
    },
    {
      name: 'پنل موکل',
      logo: UserRound,
      plan: 'کاربر',
      url: '/dashboard',
    },
  ],
  userNavGroups: [
    {
      title: '',
      items: [
        {
          title: 'داشبورد',
          url: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          title: 'پرونده‌ها',
          url: '/cases',
          icon: FolderOpen,
        },
        {
          title: 'جلسات',
          url: '/sessions',
          icon: Calendar,
        },
        {
          title: 'پرداخت‌ها',
          url: '/payments',
          icon: CreditCard,
        },
      ],
    },
  ],
  adminNavGroups: [
    {
      title: '',
      items: [
        {
          title: 'پرونده',
          url: '/admin/cases',
          icon: Briefcase,
        },
        {
          title: 'موکل‌ها',
          url: '/admin/clients',
          icon: Users,
        },
        {
          title: 'رویدادها',
          url: '/admin/events',
          icon: CalendarDays,
        },
        {
          title: 'آمارها',
          url: '/admin/stats',
          icon: BarChart3,
        },
        {
          title: 'مالی',
          url: '/admin/financial',
          icon: Wallet,
        },
        {
          title: 'کاربران',
          url: '/admin/users',
          icon: UserCog,
        },
        {
          title: 'ذخیره‌سازی',
          url: '/admin/storage',
          icon: HardDrive,
        },
      ],
    },
  ],
}
