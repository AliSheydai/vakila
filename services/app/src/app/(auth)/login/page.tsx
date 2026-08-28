import { redirect } from 'next/navigation'

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/** Alias for project auth entry at `/sign-in`. */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const next = params.next ?? params.redirect
  const query =
    typeof next === 'string' && next.startsWith('/')
      ? `?next=${encodeURIComponent(next)}`
      : ''
  redirect(`/sign-in${query}`)
}
