import {
  LayoutDashboard,
  FolderOpen,
  Calendar,
  CreditCard,
  Bot,
  Users,
  CalendarDays,
  BarChart3,
  Wallet,
  Scale,
  UserRound,
  Briefcase,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'علی',
    phone: '09123456789',
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
          title: 'دستیار',
          url: '/admin',
          icon: Bot,
        },
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
          title: 'رویداد',
          url: '/admin/events',
          icon: CalendarDays,
        },
        {
          title: 'آمار ها',
          url: '/admin/stats',
          icon: BarChart3,
        },
        {
          title: 'مالی',
          url: '/admin/financial',
          icon: Wallet,
        },
      ],
    },
  ],
}
