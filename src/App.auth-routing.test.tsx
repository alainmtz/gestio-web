import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

const mockAuthState = {
  isAuthenticated: false,
}

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
  })

  it('renderiza router de auth cuando no hay sesion', () => {
    renderApp('/dashboard')
    expect(screen.getByText('auth-router-content')).toBeInTheDocument()
  })

  it('renderiza router principal cuando hay sesion', () => {
    mockAuthState.isAuthenticated = true

    renderApp('/dashboard')
    expect(screen.getByText('app-router-content')).toBeInTheDocument()
  })
})
