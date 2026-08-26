import { redirect } from 'next/navigation'

/** Alias for project auth entry at `/sign-in`. */
export default function LoginPage() {
  redirect('/sign-in')
}
