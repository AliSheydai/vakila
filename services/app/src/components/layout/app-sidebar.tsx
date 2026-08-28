'use client'

import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { PanelLeft } from 'lucide-react'
import { useLayout } from '@/context/layout-provider'
import { useAuthStore, isLawyerRole, type AuthRole } from '@/stores/auth-store'
import { useConsultationRequestsBadge } from '@/features/consultation-requests/hooks/use-consultation-requests-hydration'
import { useTotalClientUnseenActivity, useTotalCaseContentActivity } from '@/features/notifications/hooks/use-unseen-activity-hydration'
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
import { filterAdminNav } from './filter-admin-nav'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { TeamSwitcher } from './team-switcher'
import type { NavGroup as NavGroupType, Team } from './types'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const pathname = usePathname()
  const user = useAuthStore((s) => s.auth.user)
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/')
  const newRequestsCount = useConsultationRequestsBadge()
  const clientUnseenTotal = useTotalClientUnseenActivity()
  const caseContentTotal = useTotalCaseContentActivity()

  const teams = useMemo(() => filterTeams(sidebarData.teams, user?.role), [user?.role])

  const navGroups = useMemo(() => {
    const groups = isAdmin
      ? filterAdminNav(sidebarData.adminNavGroups, user?.role)
      : sidebarData.userNavGroups

    if (!isAdmin) {
      return groups
    }

    return groups.map((group) => ({
      ...group,
      items: group.items.map((item) => {
        if ('url' in item && item.url === '/admin/requests' && newRequestsCount > 0) {
          return {
            ...item,
            badge: newRequestsCount.toLocaleString('fa-IR'),
          }
        }
        if ('url' in item && item.url === '/admin/clients' && clientUnseenTotal > 0) {
          return {
            ...item,
            badge: clientUnseenTotal.toLocaleString('fa-IR'),
          }
        }
        if ('url' in item && item.url === '/admin/cases' && caseContentTotal > 0) {
          return {
            ...item,
            badge: caseContentTotal.toLocaleString('fa-IR'),
          }
        }
        return item
      }),
    }))
  }, [isAdmin, newRequestsCount, clientUnseenTotal, caseContentTotal, user?.role])

  const displayUser = {
    name: user?.name?.trim() || 'کاربر',
    phone: user?.phone || '',
    avatar: '',
  }

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <AppSidebarInner
        navGroups={navGroups}
        isAdmin={isAdmin}
        teams={teams}
        user={displayUser}
      />
    </Sidebar>
  )
}

function filterTeams(teams: Team[], role?: AuthRole): Team[] {
  if (!role) return []
  if (isLawyerRole(role)) {
    return teams.filter((t) => t.url.startsWith('/admin'))
  }
  return teams.filter((t) => !t.url.startsWith('/admin'))
}

function AppSidebarInner({
  navGroups,
  isAdmin,
  teams,
  user,
}: {
  navGroups: NavGroupType[]
  isAdmin: boolean
  teams: Team[]
  user: { name: string; phone: string; avatar: string }
}) {
  const { state, isMobile, toggleSidebar } = useSidebar()
  const collapsed = state === 'collapsed' && !isMobile

  return (
    <>
      <SidebarHeader className={cn('h-14', collapsed && 'items-center px-2')}>
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center transition-opacity duration-300',
            collapsed
              ? 'pointer-events-auto opacity-100'
              : 'pointer-events-none opacity-0'
          )}
        >
          <div className='group/header relative flex size-10 shrink-0 items-center justify-center overflow-visible'>
            <div
              className={cn(
                'flex size-10 items-center justify-center transition-opacity duration-200 ease-out',
                !isMobile &&
                  'group-hover/header:pointer-events-none group-hover/header:opacity-0'
              )}
            >
              <TeamSwitcher teams={teams} collapsed />
            </div>
            {!isMobile && (
              <button
                type='button'
                onClick={toggleSidebar}
                aria-label='باز کردن سایدبار'
                className='pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-muted/80 text-muted-foreground opacity-0 transition-opacity duration-200 ease-out hover:text-foreground group-hover/header:pointer-events-auto group-hover/header:opacity-100'
              >
                <PanelLeft className='size-4' />
              </button>
            )}
          </div>
        </div>

        <div
          className={cn(
            'flex w-full items-center justify-between gap-1 transition-opacity duration-300',
            collapsed
              ? 'pointer-events-none opacity-0'
              : 'pointer-events-auto opacity-100'
          )}
        >
          <div className='min-w-0 flex-1'>
            <TeamSwitcher teams={teams} />
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
        <NavUser user={user} />
      </SidebarFooter>
    </>
  )
}
