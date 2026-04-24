import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ProfilePage } from '../settings/ProfilePage'

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 'user-1', email: 'test@test.com', user_metadata: { name: 'Test User' } },
  })),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      updateUser: vi.fn().mockResolvedValue({ data: { user: {} }, error: null }),
    },
  },
}))

vi.mock('@/lib/toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza titulo del perfil', () => {
    render(<BrowserRouter><ProfilePage /></BrowserRouter>)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/perfil/i)
  })

  it('renderiza boton de guardar cambios', () => {
    render(<BrowserRouter><ProfilePage /></BrowserRouter>)
    expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument()
  })
})