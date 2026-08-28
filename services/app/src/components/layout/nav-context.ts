/** Admin sidebar/nav for all routes under /admin. */
export function isAdminNavContext(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}
