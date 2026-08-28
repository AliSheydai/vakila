import { beforeEach, describe, expect, it, vi } from 'vitest'

async function importAuthStore() {
  const { useAuthStore } = await import('./auth-store')
  return useAuthStore
}

const sampleUser = {
  id: 'user-1',
  phone: '09123456789',
  name: 'علی رضایی',
  email: null,
  role: 'lawyer' as const,
}

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({
          ok: true,
          data: { user: sampleUser, needsName: false },
        })
      )
    )
  })

  it('starts without a user and not hydrated', async () => {
    const useAuthStore = await importAuthStore()

    expect(useAuthStore.getState().auth.user).toBeNull()
    expect(useAuthStore.getState().auth.hydrated).toBe(false)
  })

  it('updates the signed-in user via setUser', async () => {
    const useAuthStore = await importAuthStore()

    useAuthStore.getState().auth.setUser({ ...sampleUser })

    expect(useAuthStore.getState().auth.user).toEqual(sampleUser)
  })

  it('hydrateFromServer loads the current session user', async () => {
    const useAuthStore = await importAuthStore()

    const result = await useAuthStore.getState().auth.hydrateFromServer()

    expect(result).toEqual({ ok: true })
    expect(useAuthStore.getState().auth.user).toEqual(sampleUser)
    expect(useAuthStore.getState().auth.hydrated).toBe(true)
  })

  it('reset clears the user and marks hydrated', async () => {
    const useAuthStore = await importAuthStore()
    useAuthStore.getState().auth.setUser({ ...sampleUser })

    useAuthStore.getState().auth.reset()

    expect(useAuthStore.getState().auth.user).toBeNull()
    expect(useAuthStore.getState().auth.hydrated).toBe(true)
  })

  it('logout posts to the API then resets', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/auth/logout')) {
        return Response.json({ ok: true, data: { loggedOut: true } })
      }
      return Response.json({
        ok: true,
        data: { user: sampleUser, needsName: false },
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const useAuthStore = await importAuthStore()
    useAuthStore.getState().auth.setUser({ ...sampleUser })

    await useAuthStore.getState().auth.logout()

    expect(fetchMock).toHaveBeenCalled()
    expect(useAuthStore.getState().auth.user).toBeNull()
  })
})
