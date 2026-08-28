import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { SignOutDialog } from './sign-out-dialog'

const navigate = vi.fn()
const logout = vi.fn(async () => undefined)
const resetCases = vi.fn()
const resetEvents = vi.fn()
const resetPortal = vi.fn()

const MOCK_PATH = '/dashboard?tab=1'

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (
    selector?: (state: { auth: { logout: typeof logout } }) => unknown
  ) => {
    const state = { auth: { logout } }
    return selector ? selector(state) : state
  },
}))

vi.mock('@/features/cases/stores/cases-store', () => ({
  useCasesStore: (
    selector?: (state: { reset: typeof resetCases }) => unknown
  ) => {
    const state = { reset: resetCases }
    return selector ? selector(state) : state
  },
}))

vi.mock('@/features/events/stores/events-store', () => ({
  useEventsStore: (
    selector?: (state: { reset: typeof resetEvents }) => unknown
  ) => {
    const state = { reset: resetEvents }
    return selector ? selector(state) : state
  },
}))

vi.mock('@/features/client-portal/stores/portal-store', () => ({
  usePortalStore: (
    selector?: (state: { reset: typeof resetPortal }) => unknown
  ) => {
    const state = { reset: resetPortal }
    return selector ? selector(state) : state
  },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: navigate,
    push: navigate,
  }),
  usePathname: () => MOCK_PATH,
}))

describe('SignOutDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls logout and navigates to sign-in with next param', async () => {
    const { getByRole } = await render(
      <SignOutDialog open onOpenChange={vi.fn()} />
    )

    await userEvent.click(getByRole('button', { name: /^خروج$/i }))

    expect(logout).toHaveBeenCalledOnce()
    expect(resetCases).toHaveBeenCalledOnce()
    expect(resetEvents).toHaveBeenCalledOnce()
    expect(resetPortal).toHaveBeenCalledOnce()
    expect(navigate).toHaveBeenCalledWith(
      `/sign-in?next=${encodeURIComponent(MOCK_PATH)}`
    )
  })

  it('does not call logout or navigate when Cancel is clicked', async () => {
    const { getByRole } = await render(
      <SignOutDialog open onOpenChange={vi.fn()} />
    )

    await userEvent.click(getByRole('button', { name: /^انصراف$/i }))

    expect(logout).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })
})
