import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SuppliersPage } from '../suppliers/SuppliersPage'

const mockSuppliersData = {
  suppliers: [
    { id: 'sup-1', name: 'Proveedor A', code: 'P001', email: 'prov@test.com', city: 'La Habana', status: 'active' },
    { id: 'sup-2', name: 'Proveedor B', code: 'P002', email: 'prov2@test.com', city: 'Santiago', status: 'active' },
  ],
  total: 2,
}

vi.mock('@/hooks/useSuppliers', () => ({
  useSuppliers: vi.fn(() => ({
    data: mockSuppliersData,
    isLoading: false,
  })),
  useDeleteSupplier: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({ success: true }),
  })),
  useCreateSupplier: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: 'new-id' }),
  })),
  useUpdateSupplier: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: 'updated-id' }),
  })),
}))

vi.mock('@/hooks/useStores', () => ({
  useStores: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
}))

vi.mock('@/lib/toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

vi.mock('@/hooks/usePermissions', () => ({
  PERMISSIONS: {
    SUPPLIER_CREATE: 'SUPPLIER_CREATE',
    SUPPLIER_EDIT: 'SUPPLIER_EDIT',
    SUPPLIER_DELETE: 'SUPPLIER_DELETE',
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

describe('SuppliersPage UI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryClient.clear()
  })

  it('renderiza titulo de proveedores', () => {
    renderWithProviders(<SuppliersPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/proveedores/i)
  })

  it('renderiza boton nuevo proveedor', () => {
    renderWithProviders(<SuppliersPage />)
    expect(screen.getByRole('button', { name: /nuevo proveedor/i })).toBeInTheDocument()
  })

  it('renderiza lista de proveedores', async () => {
    renderWithProviders(<SuppliersPage />)
    await waitFor(() => {
      expect(screen.getByText('Proveedor A')).toBeInTheDocument()
    })
    expect(screen.getByText('Proveedor B')).toBeInTheDocument()
  })
})