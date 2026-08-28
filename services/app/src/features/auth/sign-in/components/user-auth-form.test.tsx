import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { UserAuthForm } from './user-auth-form'

const navigate = vi.fn()
const setUserMock = vi.fn()

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (
    selector?: (state: {
      auth: { setUser: typeof setUserMock }
    }) => unknown
  ) => {
    const state = { auth: { setUser: setUserMock } }
    return selector ? selector(state) : state
  },
  roleHome: (role: string) =>
    role === 'client' ? '/dashboard' : '/admin',
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: navigate,
    replace: navigate,
  }),
}))

describe('UserAuthForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({
          ok: true,
          data: {
            expiresAt: new Date().toISOString(),
            cooldownSeconds: 60,
            destinationMasked: '0912***6789',
          },
        })
      )
    )
  })

  it('shows validation error for invalid phone', async () => {
    const { getByRole, getByText } = await render(<UserAuthForm />)

    await userEvent.click(getByRole('button', { name: /دریافت کد تأیید/i }))

    await expect.element(getByText('شماره موبایل معتبر نیست.')).toBeInTheDocument()
  })

  it('requests OTP and moves to code step', async () => {
    const { getByRole, getByPlaceholder, getByText } = await render(
      <UserAuthForm />
    )

    await userEvent.type(getByPlaceholder('0912…'), '09123456789')
    await userEvent.click(getByRole('button', { name: /دریافت کد تأیید/i }))

    await expect
      .element(getByText('کد تأیید را وارد کنید'))
      .toBeInTheDocument()
    expect(fetch).toHaveBeenCalled()
  })
})
