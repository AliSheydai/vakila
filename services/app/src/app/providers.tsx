'use client'

import { useState, type ReactNode } from 'react'
import { AxiosError } from 'axios'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { handleServerError } from '@/lib/handle-server-error'
import { AuthBootstrap } from '@/components/auth-bootstrap'
import { Toaster } from '@/components/ui/sonner'
import { DirectionProvider } from '@/context/direction-provider'
import { FontProvider } from '@/context/font-provider'
import { ThemeProvider } from '@/context/theme-provider'

type ProvidersProps = {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (failureCount, error) => {
              if (process.env.NODE_ENV === 'development') {
                // eslint-disable-next-line no-console
                console.log({ failureCount, error })
              }

              if (failureCount >= 0 && process.env.NODE_ENV === 'development') return false
              if (failureCount > 3 && process.env.NODE_ENV === 'production') return false

              return !(
                error instanceof AxiosError &&
                [401, 403].includes(error.response?.status ?? 0)
              )
            },
            refetchOnWindowFocus: process.env.NODE_ENV === 'production',
            staleTime: 10 * 1000, // 10s
          },
          mutations: {
            onError: (error) => {
              handleServerError(error)

              if (error instanceof AxiosError) {
                if (error.response?.status === 304) {
                  toast.error('Content not modified!')
                }
              }
            },
          },
        },
        queryCache: new QueryCache({
          onError: (error) => {
            if (error instanceof AxiosError) {
              if (error.response?.status === 401) {
                toast.error('Session expired!')
                useAuthStore.getState().auth.reset()
                if (typeof window !== 'undefined') {
                  const currentPath = window.location.pathname + window.location.search
                  window.location.href = `/sign-in?next=${encodeURIComponent(currentPath)}`
                }
              }
              if (error.response?.status === 500) {
                toast.error('Internal Server Error!')
                if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
                  window.location.href = '/500'
                }
              }
            }
          },
        }),
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <FontProvider>
          <DirectionProvider>
            <AuthBootstrap>
              {children}
              <Toaster position='top-right' richColors duration={4000} />
            </AuthBootstrap>
          </DirectionProvider>
        </FontProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
