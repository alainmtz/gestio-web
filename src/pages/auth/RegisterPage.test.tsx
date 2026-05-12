import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { RegisterPage } from './RegisterPage'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn().mockResolvedValue({
        data: { 
          user: { id: 'user-1', email: 'test@test.com' },
          session: null 
        },
        error: null,
      }),
    },
    from: vi.fn((table: string) => ({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ 
            data: table === 'organizations' ? { id: 'org-1' } : { id: 'user-1' },
            error: null 
          }),
        }),
      }),
    })),
  },
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    login: vi.fn(),
    setLoading: vi.fn(),
    isLoading: false,
  }),
}))

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders full name input field with placeholder', () => {
    renderWithRouter(<RegisterPage />)
    
    expect(screen.getByPlaceholderText(/juan pérez/i)).toBeInTheDocument()
  })

  it('renders email input field', () => {
    renderWithRouter(<RegisterPage />)
    
    expect(screen.getByPlaceholderText(/correo@ejemplo.com/i)).toBeInTheDocument()
  })

  it('renders password input field', () => {
    renderWithRouter(<RegisterPage />)
    
    expect(screen.getByTestId('password')).toBeInTheDocument()
  })

  it('renders confirm password input field', () => {
    renderWithRouter(<RegisterPage />)
    
    expect(screen.getByTestId('confirmPassword')).toBeInTheDocument()
  })

  it('renders organization name input field on step 2', async () => {
    const user = userEvent.setup()
    renderWithRouter(<RegisterPage />)
    
    // Navigate to step 1 (Empresa / Organization)
    const nextButton = screen.getByRole('button', { name: /siguiente/i })
    await user.click(nextButton)
    
    expect(screen.getByPlaceholderText(/mi empresa/i)).toBeInTheDocument()
  })

  it('renders submit button on step 3', async () => {
    const user = userEvent.setup()
    renderWithRouter(<RegisterPage />)
    
    // Navigate through steps 0 and 1 to reach step 2 (Revisar / Submit)
    const nextButtons = screen.getAllByRole('button', { name: /siguiente/i })
    await user.click(nextButtons[0])
    await user.click(screen.getByRole('button', { name: /siguiente/i }))
    
    expect(screen.getByRole('button', { name: /crear cuenta/i })).toBeInTheDocument()
  })

  it('renders link to login page', () => {
    renderWithRouter(<RegisterPage />)
    
    const link = screen.getByRole('link', { name: /iniciá sesión/i })
    expect(link).toHaveAttribute('href', '/auth/login')
  })
})
