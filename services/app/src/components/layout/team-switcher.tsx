'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ChevronDown, Check, Scale } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { isAdminNavContext } from './nav-context'
import { type Team } from './types'

type TeamSwitcherProps = {
  teams: Team[]
  collapsed?: boolean
}

export function TeamSwitcher({ teams, collapsed }: TeamSwitcherProps) {
  const { isMobile } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()

  const isAdmin = isAdminNavContext(pathname)
  const activeTeam =
    teams.find((team) =>
      isAdmin ? team.url.startsWith('/admin') : !team.url.startsWith('/admin')
    ) ?? teams[0]

  const singleTeam = teams.length <= 1
  const Logo = activeTeam?.logo ?? Scale

  if (singleTeam) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            className={cn(
              'pointer-events-none gap-2.5 rounded-xl px-1 text-muted-foreground',
              collapsed && 'justify-center p-0'
            )}
          >
            <div className='flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary'>
              <Logo className='size-4' />
            </div>
            {!collapsed && (
              <span className='truncate whitespace-nowrap font-display text-sm font-bold tracking-tight text-foreground'>
                وکلا
              </span>
            )}
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className={cn(
                'gap-2.5 rounded-xl px-1 text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                'data-[state=open]:bg-muted/80 data-[state=open]:text-foreground',
                collapsed && 'justify-center p-0'
              )}
            >
              <div className='flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary'>
                <Scale className='size-4' />
              </div>
              {!collapsed && (
                <>
                  <span className='truncate whitespace-nowrap font-display text-sm font-bold tracking-tight text-foreground'>
                    وکلا
                  </span>
                  <ChevronDown className='ms-auto size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/menu-item:rotate-180' />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-64 rounded-xl p-1.5'
            align='start'
            side={isMobile ? 'bottom' : 'bottom'}
            sideOffset={8}
          >
            <DropdownMenuLabel className='px-2.5 pt-1.5 pb-2 text-[11px] font-medium tracking-wider text-muted-foreground/70 uppercase'>
              جابجایی بین بخش‌ها
            </DropdownMenuLabel>
            <DropdownMenuSeparator className='mb-1' />
            {teams.map((team) => {
              const selected = activeTeam?.name === team.name
              return (
                <DropdownMenuItem
                  key={team.name}
                  onClick={() => {
                    if (team.url !== pathname) {
                      router.push(team.url)
                    }
                  }}
                  className={cn(
                    'relative h-14 gap-3 rounded-xl px-3 transition-all duration-200',
                    selected
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted/80'
                  )}
                >
                  <div
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-xl transition-all duration-200',
                      selected
                        ? 'bg-primary/20 shadow-sm shadow-primary/10'
                        : 'bg-muted'
                    )}
                  >
                    <team.logo
                      className={cn(
                        'size-5',
                        selected ? 'text-primary' : 'text-muted-foreground'
                      )}
                    />
                  </div>
                  <div className='grid min-w-0 flex-1 text-start text-sm leading-tight'>
                    <span
                      className={cn(
                        'truncate whitespace-nowrap text-sm font-semibold',
                        selected ? 'text-primary' : 'text-foreground'
                      )}
                    >
                      {team.name}
                    </span>
                    <span className='truncate whitespace-nowrap text-xs text-muted-foreground'>
                      {team.plan}
                    </span>
                  </div>
                  {selected && (
                    <div className='flex size-5 shrink-0 items-center justify-center rounded-full bg-primary'>
                      <Check
                        className='size-3 text-primary-foreground'
                        strokeWidth={3}
                      />
                    </div>
                  )}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
