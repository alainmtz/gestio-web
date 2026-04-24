import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import { ProductsPage } from '../inventory/ProductsPage'

vi.mock('@/hooks/useProducts', () => ({
  useProducts: vi.fn(() => ({
    data: { products: [], total: 0 },
    isLoading: false,
  })),
  useCategories: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
  useDeleteProduct: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({ success: true }),
  })),
  useCreateProduct: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: 'new-id' }),
  })),
  useUpdateProduct: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: 'updated-id' }),
  })),
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

vi.mock('@/components/products/ProductForm', () => ({
  ProductForm: vi.fn(() => <div data-testid="product-form">Product Form</div>),
}))

vi.mock('@/components/products/ProductCsvImport', () => ({
  ProductCsvImport: vi.fn(() => <div data-testid="product-csv-import">CSV Import</div>),
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

describe('ProductsPage con React Query', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryClient.clear()
  })

  it('renderiza título de productos', () => {
    renderWithProviders(<ProductsPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/productos/i)
  })

  it('renderiza campo de búsqueda', () => {
    renderWithProviders(<ProductsPage />)
    expect(screen.getByPlaceholderText(/buscar/i)).toBeInTheDocument()
  })

  it('renderiza botón de nuevo producto', () => {
    renderWithProviders(<ProductsPage />)
    expect(screen.getByRole('button', { name: /nuevo producto/i })).toBeInTheDocument()
  })

  it('renderiza tabla', () => {
    renderWithProviders(<ProductsPage />)
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('puede escribir en búsqueda', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProductsPage />)
    const searchInput = screen.getByPlaceholderText(/buscar/i)
    await user.type(searchInput, 'test')
    expect(searchInput).toHaveValue('test')
  })

  it('abre formulario al hacer click en nuevo producto', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProductsPage />)
    await user.click(screen.getByRole('button', { name: /nuevo producto/i }))
    await waitFor(() => {
      expect(screen.getByTestId('product-form')).toBeInTheDocument()
    })
  })
})