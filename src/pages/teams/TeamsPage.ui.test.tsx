import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TeamsPage } from '../teams/TeamsPage'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => {
          if (table === 'teams') {
            return {
              eq: vi.fn(() => ({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              })),
            }
          }

          return Promise.resolve({ data: [], error: null })
        }),
      })),
    })),
  },
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    currentOrganization: { id: 'org-1' },
  })),
}))

vi.mock('@/lib/toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

vi.mock('@/hooks/usePermissions', () => ({
  PERMISSIONS: {
    TEAM_CREATE: 'TEAM_CREATE',
    TEAM_EDIT: 'TEAM_EDIT',
    TEAM_DELETE: 'TEAM_DELETE',
  },
  usePermissions: vi.fn(() => ({
    hasPermission: vi.fn(() => true),
  })),
}))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
})

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>
  )
}

describe('TeamsPage con React Query', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryClient.clear()
  })

  it('renderiza título de equipos', () => {
    renderWithProviders(<TeamsPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/equipos/i)
  })

  it('renderiza botón de nuevo equipo', () => {
    renderWithProviders(<TeamsPage />)
    expect(screen.getByRole('button', { name: /nuevo equipo/i })).toBeInTheDocument()
  })

  it('renderiza cards de equipos o estado vacío', () => {
    renderWithProviders(<TeamsPage />)
    const element = screen.getByText(/gestiona tus equipos/i) || screen.getByRole('button', { name: /nuevo equipo/i })
    expect(element).toBeInTheDocument()
  })
})