import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import { CategoriesPage } from '../inventory/CategoriesPage'

const mockGetCategories = vi.fn().mockResolvedValue([])
const mockCreateCategory = vi.fn().mockResolvedValue({ id: 'new-cat', name: 'Test' })
const mockUpdateCategory = vi.fn().mockResolvedValue({ id: 'cat-1', name: 'Updated' })
const mockDeleteCategory = vi.fn().mockResolvedValue({ success: true })

vi.mock('@/api/products', () => ({
  getCategories: (...args: unknown[]) => mockGetCategories(...args),
  createCategory: (...args: unknown[]) => mockCreateCategory(...args),
  updateCategory: (...args: unknown[]) => mockUpdateCategory(...args),
  deleteCategory: (...args: unknown[]) => mockDeleteCategory(...args),
}))

vi.mock('@/lib/toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    currentOrganization: { id: 'org-1' },
  })),
}))

vi.mock('@/hooks/usePermissions', () => ({
  PERMISSIONS: {
    PRODUCT_CREATE: 'PRODUCT_CREATE',
    PRODUCT_EDIT: 'PRODUCT_EDIT',
    PRODUCT_DELETE: 'PRODUCT_DELETE',
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

describe('CategoriesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryClient.clear()
  })

  it('renderiza titulo de categorias', () => {
    renderWithProviders(<CategoriesPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/categorías/i)
  })

  it('renderiza boton de nueva categoria', () => {
    renderWithProviders(<CategoriesPage />)
    expect(screen.getByRole('button', { name: /nueva categoría/i })).toBeInTheDocument()
  })

  it('abre dialog al hacer click en nueva categoria', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CategoriesPage />)
    await user.click(screen.getByRole('button', { name: /nueva categoría/i }))
    await waitFor(() => {
      expect(screen.getByText(/nombre de la categoría/i)).toBeInTheDocument()
    })
  })

  it('puede escribir nombre en el input del dialogo', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CategoriesPage />)
    await user.click(screen.getByRole('button', { name: /nueva categoría/i }))
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ej: camisas/i)).toBeInTheDocument()
    })
    const input = screen.getByPlaceholderText(/ej: camisas/i)
    await user.type(input, 'Nueva Categoria')
    expect(input).toHaveValue('Nueva Categoria')
  })
})