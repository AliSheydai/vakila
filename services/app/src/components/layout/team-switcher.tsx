'use client'

import { usePathname, useRouter } from 'next/navigation'
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
import { type Team } from './types'

type TeamSwitcherProps = {
  teams: Team[]
}

export function TeamSwitcher({ teams }: TeamSwitcherProps) {
  const { isMobile } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()

  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/')
  const activeTeam =
    teams.find((team) =>
      isAdmin ? team.url.startsWith('/admin') : !team.url.startsWith('/admin')
    ) ?? teams[0]

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
                  if (team.url !== pathname) {
                    router.push(team.url)
                  }
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
