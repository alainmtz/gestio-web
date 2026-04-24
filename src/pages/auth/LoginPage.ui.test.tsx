import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import { LoginPage } from './LoginPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
})

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { 
          user: { id: 'user-1', email: 'test@test.com' }, 
          session: { access_token: 'token', expires_at: 123456 } 
        },
        error: null,
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({

          single: vi.fn().mockResolvedValue({ 
            data: { id: 'user-1', full_name: 'Test User', organization_id: 'org-1' }, 
            error: null 
          }),
        })),
      })),
    })),
  },
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    login: vi.fn(),
    setLoading: vi.fn(),
    isLoading: false,
  })),
}))

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>
  )
}

describe('LoginPage con React Query', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryClient.clear()
  })

  it('renderiza el formulario de login', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByLabelText(/correo/i)).toBeInTheDocument()
  })

  it('renderiza campo de email', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByLabelText(/correo/i)).toBeInTheDocument()
  })

  it('renderiza campo de contraseña', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
  })

  it('renderiza botón de submit', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument()
  })

  it('puede escribir en campo de email', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)
    const emailInput = screen.getByLabelText(/correo/i)
    await user.type(emailInput, 'test@test.com')
    expect(emailInput).toHaveValue('test@test.com')
  })

  it('puede escribir en campo de contraseña', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)
    const passwordInput = screen.getByLabelText(/contraseña/i)
    await user.type(passwordInput, 'password123')
    expect(passwordInput).toHaveValue('password123')
  })
})