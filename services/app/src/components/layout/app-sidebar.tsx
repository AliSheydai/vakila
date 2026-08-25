'use client'

import { usePathname } from 'next/navigation'
import { PanelLeft } from 'lucide-react'
import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
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
      <AppSidebarInner navGroups={navGroups} isAdmin={isAdmin} />
    </Sidebar>
  )
}

function AppSidebarInner({
  navGroups,
  isAdmin,
}: {
  navGroups: typeof sidebarData.userNavGroups
  isAdmin: boolean
}) {
  const { state, isMobile, toggleSidebar } = useSidebar()
  const collapsed = state === 'collapsed' && !isMobile

  return (
    <>
      <SidebarHeader className={cn(collapsed && 'items-center px-2')}>
        {/* Collapsed: brand / section + hover expand (hiknow pattern) */}
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center py-2 transition-opacity duration-300',
            collapsed ? 'px-0' : 'px-4',
            collapsed
              ? 'pointer-events-auto opacity-100'
              : 'pointer-events-none opacity-0'
          )}
        >
          <div className='group/header relative mx-auto flex size-10 shrink-0 items-center justify-center overflow-visible'>
            <div
              className={cn(
                'flex size-10 items-center justify-center transition-all duration-200 ease-out',
                !isMobile &&
                  'group-hover/header:pointer-events-none group-hover/header:scale-90 group-hover/header:opacity-0'
              )}
            >
              <TeamSwitcher teams={sidebarData.teams} collapsed />
            </div>
            {!isMobile && (
              <button
                type='button'
                onClick={toggleSidebar}
                aria-label='باز کردن سایدبار'
                className='pointer-events-none absolute inset-0 flex scale-90 items-center justify-center rounded-xl bg-muted/80 text-muted-foreground opacity-0 transition-all duration-200 ease-out hover:text-foreground group-hover/header:pointer-events-auto group-hover/header:scale-100 group-hover/header:opacity-100'
              >
                <PanelLeft className='size-4' />
              </button>
            )}
          </div>
        </div>

        {/* Expanded: brand switcher + collapse */}
        <div
          className={cn(
            'flex w-full items-center justify-between gap-1 transition-opacity duration-300',
            collapsed
              ? 'pointer-events-none opacity-0'
              : 'pointer-events-auto opacity-100'
          )}
        >
          <div className='min-w-0 flex-1'>
            <TeamSwitcher teams={sidebarData.teams} />
          </div>
          <SidebarTrigger />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((props) => (
          <NavGroup
            key={props.title || (isAdmin ? 'admin' : 'user')}
            {...props}
          />
        ))}
      </SidebarContent>

      <SidebarFooter
        className={cn(collapsed && 'flex items-center justify-center')}
      >
        <NavUser user={sidebarData.user} />
      </SidebarFooter>
    </>
  )
}
