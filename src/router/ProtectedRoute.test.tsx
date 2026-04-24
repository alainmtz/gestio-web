import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'

const mockAuthState = {
  isAuthenticated: false,
  isLoading: false,
}

vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: typeof mockAuthState) => unknown) => selector(mockAuthState),
}))

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockAuthState.isAuthenticated = false
    mockAuthState.isLoading = false
  })

  it('redirige a login cuando la sesion expira o no existe', () => {
    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route
            path="/private"
            element={<ProtectedRoute><div>contenido privado</div></ProtectedRoute>}
          />
          <Route path="/login" element={<div>pagina login</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('pagina login')).toBeInTheDocument()
  })

  it('muestra contenido cuando hay sesion valida', () => {
    mockAuthState.isAuthenticated = true

    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route
            path="/private"
            element={<ProtectedRoute><div>contenido privado</div></ProtectedRoute>}
          />
          <Route path="/login" element={<div>pagina login</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('contenido privado')).toBeInTheDocument()
  })
})
