import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import { StoresPage } from '../stores/StoresPage'

const mockStoresData = [
  { id: 'store-1', name: 'Tienda Centro', code: 'T001', address: 'Calle Principal', city: 'La Habana', is_active: true, store_type: 'store', currency_id: 'CUP' },
  { id: 'store-2', name: 'Tienda Norte', code: 'T002', address: 'Avenida Norte', city: 'La Habana', is_active: true, store_type: 'store', currency_id: 'USD' },
]

vi.mock('@/hooks/useStores', () => ({
  useAllStores: vi.fn(() => ({
    data: mockStoresData,
    isLoading: false,
  })),
  useReactivateStore: vi.fn(() => ({
    mutate: vi.fn(),
  })),
  useDeleteStore: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({ success: true }),
  })),
  useCreateStore: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: 'new-id' }),
  })),
  useUpdateStore: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: 'updated-id' }),
  })),
}))

vi.mock('@/components/stores/StoreForm', () => ({
  StoreForm: vi.fn(() => <div data-testid="store-form">Store Form</div>),
}))

vi.mock('@/lib/toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

vi.mock('@/hooks/usePermissions', () => ({
  PERMISSIONS: {
    STORE_CREATE: 'STORE_CREATE',
    STORE_EDIT: 'STORE_EDIT',
    STORE_DELETE: 'STORE_DELETE',
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

describe('StoresPage UI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryClient.clear()
  })

  it('renderiza titulo de tiendas', () => {
    renderWithProviders(<StoresPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/tiendas/i)
  })

  it('renderiza boton nueva tienda', () => {
    renderWithProviders(<StoresPage />)
    expect(screen.getByRole('button', { name: /nueva tienda/i })).toBeInTheDocument()
  })

  it('renderiza lista de tiendas', async () => {
    renderWithProviders(<StoresPage />)
    await waitFor(() => {
      expect(screen.getByText('Tienda Centro')).toBeInTheDocument()
    })
    expect(screen.getByText('Tienda Norte')).toBeInTheDocument()
  })

  it('abre formulario al crear nuevo', async () => {
    const user = userEvent.setup()
    renderWithProviders(<StoresPage />)
    await user.click(screen.getByRole('button', { name: /nueva tienda/i }))
    await waitFor(() => {
      expect(screen.getByTestId('store-form')).toBeInTheDocument()
    })
  })
})