import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { LoginPage } from './LoginPage'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1', email: 'test@test.com' }, session: { access_token: 'token', expires_at: 123456 } },
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

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders email input field', () => {
      renderWithRouter(<LoginPage />)
      expect(screen.getByLabelText(/correo/i)).toBeInTheDocument()
    })

    it('renders password input field', () => {
      renderWithRouter(<LoginPage />)
      expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
    })

    it('renders submit button', () => {
      renderWithRouter(<LoginPage />)
      expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument()
    })

    it('renders link to forgot password', () => {
      renderWithRouter(<LoginPage />)
      expect(screen.getByText(/¿olvidaste tu contraseña/i)).toBeInTheDocument()
    })

    it('renders link to register page', () => {
      renderWithRouter(<LoginPage />)
      const link = screen.getByRole('link', { name: /regístrate/i })
      expect(link).toHaveAttribute('href', '/auth/register')
    })

    it('renders form fields', () => {
      renderWithRouter(<LoginPage />)
      const emailInput = screen.getByLabelText(/correo/i)
      const passwordInput = screen.getByLabelText(/contraseña/i)
      expect(emailInput).toBeInTheDocument()
      expect(passwordInput).toBeInTheDocument()
    })
  })

  describe('form interactions', () => {
    it('can type in email field', async () => {
      const user = userEvent.setup()
      renderWithRouter(<LoginPage />)
      
      const emailInput = screen.getByLabelText(/correo/i)
      await user.type(emailInput, 'test@example.com')
      expect(emailInput).toHaveValue('test@example.com')
    })

    it('can type in password field', async () => {
      const user = userEvent.setup()
      renderWithRouter(<LoginPage />)
      
      const passwordInput = screen.getByLabelText(/contraseña/i)
      await user.type(passwordInput, 'password123')
      expect(passwordInput).toHaveValue('password123')
    })

    it('button is enabled by default', () => {
      renderWithRouter(<LoginPage />)
      expect(screen.getByRole('button', { name: /ingresar/i })).toBeEnabled()
    })
  })
})