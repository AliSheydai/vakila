import { isLawyerRole, type AuthRole } from '@/stores/auth-store'

export function accountPath(role?: AuthRole | null): string {
  if (role && isLawyerRole(role)) return '/admin/account'
  return '/account'
}

export function accountTabPath(
  role?: AuthRole | null,
  tab?: string | null
): string {
  const base = accountPath(role)
  if (!tab || tab === 'profile') return base
  return `${base}?tab=${encodeURIComponent(tab)}`
}

export function notificationsPath(role?: AuthRole | null): string {
  return accountTabPath(role, 'notifications')
}
