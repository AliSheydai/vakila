import { isLawyerRole, type AuthRole } from '@/stores/auth-store'

export function accountPath(role?: AuthRole | null): string {
  if (role && isLawyerRole(role)) return '/admin/account'
  return '/account'
}

export function notificationsPath(role?: AuthRole | null): string {
  if (role && isLawyerRole(role)) return '/admin/notifications'
  return '/notifications'
}
