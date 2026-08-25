'use client'

import { usePathname } from 'next/navigation'
import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { TeamSwitcher } from './team-switcher'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const pathname = usePathname()
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/')
  const navGroups = isAdmin
    ? sidebarData.adminNavGroups
    : sidebarData.userNavGroups

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <div className='group-data-[collapsible=icon]:hidden'>
          <TeamSwitcher teams={sidebarData.teams} />
        </div>
        <SidebarMenu className='hidden group-data-[collapsible=icon]:flex'>
          <SidebarMenuItem className='flex items-center justify-center'>
            <SidebarTrigger className='size-8' />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((props) => (
          <NavGroup key={props.title || (isAdmin ? 'admin' : 'user')} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarData.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
