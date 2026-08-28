'use client'

import Link from 'next/link'
import { BadgeCheck, Bell, ChevronLeft, LogOut } from 'lucide-react'
import useDialogState from '@/hooks/use-dialog-state'
import { accountPath, notificationsPath } from '@/lib/account-routes'
import { useNotificationsBadge } from '@/features/notifications/hooks/use-notifications-hydration'
import { useAuthStore } from '@/stores/auth-store'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SignOutDialog } from '@/components/sign-out-dialog'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

type NavUserProps = {
  user: {
    name: string
    phone: string
    avatar: string
  }
}

export function NavUser({ user }: NavUserProps) {
  const [open, setOpen] = useDialogState()
  const role = useAuthStore((s) => s.auth.user?.role)
  const accountHref = accountPath(role)
  const notificationsHref = notificationsPath(role)
  const unreadCount = useNotificationsBadge()
  const { isMobile, state } = useSidebar()
  const collapsed = state === 'collapsed' && !isMobile
  const initials = user.name?.charAt(0) || 'ک'
  const hasUnread = unreadCount > 0
  const unreadLabel = hasUnread
    ? `${unreadCount.toLocaleString('fa-IR')} اعلان خوانده‌نشده`
    : null
  const profileTooltip = collapsed
    ? unreadLabel
      ? `${user.name} — ${unreadLabel}`
      : user.name
    : undefined

  return (
    <>
      <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              tooltip={profileTooltip}
              className={cn(
                'gap-2.5 rounded-xl px-2 text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                'data-[state=open]:bg-muted/80 data-[state=open]:text-foreground',
                'group-data-[collapsible=icon]:justify-center! group-data-[collapsible=icon]:rounded-xl! group-data-[collapsible=icon]:p-0!'
              )}
            >
              <div className='relative shrink-0'>
                <Avatar className='size-8 rounded-full ring-2 ring-background transition-shadow duration-200 group-hover/menu-item:ring-primary/20'>
                  {user.avatar ? (
                    <AvatarImage src={user.avatar} alt={user.name} />
                  ) : null}
                  <AvatarFallback className='rounded-full bg-primary/10 text-xs font-bold text-primary'>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {hasUnread ? (
                  <span
                    className='absolute -top-0.5 -inset-e-0.5 flex size-4 min-w-4 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold leading-none text-white ring-2 ring-background'
                    aria-hidden
                  >
                    {unreadCount > 9
                      ? '۹+'
                      : unreadCount.toLocaleString('fa-IR')}
                  </span>
                ) : null}
              </div>
              <div className='grid min-w-0 flex-1 text-start leading-tight'>
                <span className='truncate text-sm font-medium whitespace-nowrap'>
                  {user.name}
                </span>
                {hasUnread && !collapsed ? (
                  <span className='truncate text-[11px] font-medium text-destructive'>
                    {unreadLabel}
                  </span>
                ) : user.phone ? (
                  <span
                    className='truncate text-[11px] text-muted-foreground'
                    dir='ltr'
                  >
                    {user.phone}
                  </span>
                ) : null}
              </div>
              <ChevronLeft className='ms-auto size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/menu-item:-rotate-90' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className={cn(
              'min-w-60 rounded-xl p-1.5',
              collapsed
                ? 'w-56'
                : 'w-(--radix-dropdown-menu-trigger-width)'
            )}
            side={collapsed ? 'top' : isMobile ? 'bottom' : 'top'}
            align={collapsed ? 'center' : 'start'}
            sideOffset={8}
          >
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className='h-10 gap-3 rounded-lg px-3'>
                <Link href={notificationsHref} className='flex items-center gap-3'>
                  <Bell className='size-4' />
                  <span className='flex-1'>اعلانات</span>
                  {unreadCount > 0 ? (
                    <Badge className='h-5 min-w-5 rounded-full px-1.5 tabular-nums'>
                      {unreadCount.toLocaleString('fa-IR')}
                    </Badge>
                  ) : null}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className='h-10 gap-3 rounded-lg px-3'>
                <Link href={accountHref} className='flex items-center gap-3'>
                  <BadgeCheck className='size-4' />
                  <span>حساب کاربری</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant='destructive'
              className='h-10 gap-3 rounded-lg px-3'
              onClick={() => setOpen(true)}
            >
              <LogOut className='size-4' />
              <span>خروج از حساب</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      </SidebarMenu>

      <SignOutDialog open={!!open} onOpenChange={setOpen} />
    </>
  )
}
