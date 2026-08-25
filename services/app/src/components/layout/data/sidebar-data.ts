import { LayoutDashboard, Command, ShieldCheck } from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'علی',
    email: 'ali@example.com',
    avatar: '',
  },
  teams: [
    {
      name: 'پنل کاربری',
      logo: Command,
      plan: 'کاربر',
    },
    {
      name: 'پنل ادمین',
      logo: ShieldCheck,
      plan: 'مدیریت',
    },
  ],
  navGroups: [
    {
      title: '',
      items: [
        {
          title: 'داشبورد',
          url: '/',
          icon: LayoutDashboard,
        },
      ],
    },
  ],
}
