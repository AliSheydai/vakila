'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ChevronsUpDown, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

type TeamSwitcherProps = {
  teams: {
    name: string
    logo: React.ElementType
    plan: string
  }[]
}

const TEAM_ROUTES: Record<string, string> = {
  'پنل کاربری': '/',
  'پنل ادمین': '/admin',
}

export function TeamSwitcher({ teams }: TeamSwitcherProps) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [activeTeam, setActiveTeam] = React.useState(
    () => teams.find((team) => team.name === 'پنل ادمین') ?? teams[0]
  )

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
                <activeTeam.logo className='size-4' />
              </div>
              <div className='grid min-w-0 flex-1 text-start text-sm leading-tight'>
                <span className='truncate whitespace-nowrap font-semibold'>
                  {activeTeam.name}
                </span>
                <span className='truncate whitespace-nowrap text-xs text-muted-foreground'>
                  {activeTeam.plan}
                </span>
              </div>
              <ChevronsUpDown className='ms-auto size-4 shrink-0 transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
            align='start'
            side={isMobile ? 'bottom' : 'left'}
            sideOffset={4}
          >
            {teams.map((team) => (
              <DropdownMenuItem
                key={team.name}
                onClick={() => {
                  setActiveTeam(team)
                  const route = TEAM_ROUTES[team.name]
                  if (route) router.push(route)
                }}
                className='flex items-center gap-2 p-2'
              >
                <div className='flex size-6 items-center justify-center rounded-sm border'>
                  <team.logo className='size-4 shrink-0' />
                </div>
                <div className='grid min-w-0 flex-1 text-start text-sm leading-tight'>
                  <span className='truncate whitespace-nowrap font-medium'>
                    {team.name}
                  </span>
                  <span className='truncate whitespace-nowrap text-xs text-muted-foreground'>
                    {team.plan}
                  </span>
                </div>
                {activeTeam.name === team.name && (
                  <Check className='ms-auto size-4 text-primary' />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
