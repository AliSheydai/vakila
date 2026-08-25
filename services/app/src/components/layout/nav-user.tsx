'use client'

import Link from 'next/link'
import { BadgeCheck, ChevronLeft } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  const { isMobile, state } = useSidebar()
  const collapsed = state === 'collapsed' && !isMobile
  const initials = user.name?.charAt(0) || 'ک'

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className={cn(
                'h-auto gap-2.5 rounded-xl px-2 py-1.5 text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                'data-[state=open]:bg-muted/80 data-[state=open]:text-foreground',
                'group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:justify-center! group-data-[collapsible=icon]:rounded-xl! group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:hover:scale-100'
              )}
            >
              <Avatar className='size-9 shrink-0 rounded-full ring-2 ring-background transition-shadow duration-200 group-hover/menu-item:ring-primary/20 group-data-[collapsible=icon]:size-9'>
                {user.avatar ? (
                  <AvatarImage src={user.avatar} alt={user.name} />
                ) : null}
                <AvatarFallback className='rounded-full bg-primary/10 text-xs font-bold text-primary'>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className='flex-1 truncate text-start text-sm font-medium whitespace-nowrap'>
                {user.name}
              </span>
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
                <Link href='/settings' className='flex items-center gap-3'>
                  <BadgeCheck className='size-4' />
                  <span>حساب کاربری</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
