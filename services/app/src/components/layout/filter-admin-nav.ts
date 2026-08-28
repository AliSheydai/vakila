import type { AuthRole } from '@/stores/auth-store'
import type { NavGroup } from './types'

const SUPER_ADMIN_ONLY_URLS = new Set(['/admin/users', '/admin/settings'])

export function filterAdminNav(
  groups: NavGroup[],
  role?: AuthRole
): NavGroup[] {
  return groups.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if ('url' in item && item.url && SUPER_ADMIN_ONLY_URLS.has(item.url)) {
        return role === 'super_admin'
      }
      return true
    }),
  }))
}
