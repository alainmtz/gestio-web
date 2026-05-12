import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

const mockGetSession = vi.hoisted(() => vi.fn())

const mockAuthState: Record<string, unknown> = vi.hoisted(() => ({
  isAuthenticated: false,
  permissionLoaded: false,
  permissionError: false,
  logout: vi.fn(() => { mockAuthState.isAuthenticated = false }),
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: typeof mockAuthState) => unknown) => selector(mockAuthState),
}))

vi.mock('@/router/AppRouter', () => ({
  AppRouter: () => <div>app-router-content</div>,
}))

vi.mock('@/router/AuthRouter', () => ({
  AuthRouter: () => <div>auth-router-content</div>,
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      })),
    },
  },
}))

const renderApp = (initialPath: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('App auth routing', () => {
  beforeEach(() => {
    mockAuthState.isAuthenticated = false
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
  })

  it('renderiza router de auth cuando no hay sesion', () => {
    renderApp('/dashboard')
    expect(screen.getByText('auth-router-content')).toBeInTheDocument()
  })

  it('renderiza router principal cuando hay sesion', () => {
    mockAuthState.isAuthenticated = true
    mockAuthState.permissionLoaded = true
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'test' } } }, error: null })

    renderApp('/dashboard')
    expect(screen.getByText('app-router-content')).toBeInTheDocument()
  })
})
