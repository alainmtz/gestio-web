import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import { CustomersPage } from '../customers/CustomersPage'

const mockDeleteCustomer = vi.fn().mockResolvedValue({ success: true })
const mockCreateCustomer = vi.fn().mockResolvedValue({ id: 'new-id' })
const mockUpdateCustomer = vi.fn().mockResolvedValue({ id: 'updated-id' })

const mockCustomersData = {
  customers: [
    { id: 'cust-1', name: 'Empresa A', code: 'C001', email: 'test@test.com', phone: '+53 5555', customer_type: 'business', status: 'active', created_at: '2024-01-01' },
    { id: 'cust-2', name: 'Empresa B', code: 'C002', email: 'test2@test.com', phone: '+53 6666', customer_type: 'individual', status: 'active', created_at: '2024-01-02' },
  ],
  total: 2,
}

vi.mock('@/hooks/useCustomers', () => ({
  useCustomers: vi.fn(() => ({
    data: mockCustomersData,
    isLoading: false,
  })),
  useDeleteCustomer: vi.fn(() => ({
    mutateAsync: mockDeleteCustomer,
  })),
  useCreateCustomer: vi.fn(() => ({
    mutateAsync: mockCreateCustomer,
  })),
  useUpdateCustomer: vi.fn(() => ({
    mutateAsync: mockUpdateCustomer,
  })),
}))

vi.mock('@/components/customers/CustomerForm', () => ({
  CustomerForm: vi.fn(({ open, customer }: { open: boolean; customer?: { id: string } | null }) => {
    if (!open) return null
    return <div data-testid="customer-form">{customer ? 'edit-mode' : 'create-mode'}</div>
  }),
}))

vi.mock('@/lib/toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

vi.mock(import('@/hooks/usePermissions'), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    usePermissions: vi.fn(() => ({
      hasPermission: vi.fn(() => true),
      hasAnyPermission: vi.fn(() => true),
      hasAllPermissions: vi.fn(() => true),
      permissions: ['CUSTOMER_CREATE', 'CUSTOMER_EDIT', 'CUSTOMER_DELETE'],
      role: 'ADMIN',
      isOwner: false,
      isAdmin: true,
      isLoading: false,
    })),
  }
})

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

describe('CustomersPage UI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryClient.clear()
    mockDeleteCustomer.mockClear()
    mockCreateCustomer.mockClear()
    mockUpdateCustomer.mockClear()
  })

  it('renderiza titulo de clientes', () => {
    renderWithProviders(<CustomersPage />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/clientes/i)
  })

  it('renderiza la estructura principal de clientes', () => {
    renderWithProviders(<CustomersPage />)
    expect(screen.getByText(/lista de clientes/i)).toBeInTheDocument()
  })

  it('renderiza lista con clientes', () => {
    renderWithProviders(<CustomersPage />)
    expect(screen.getByText('Empresa A')).toBeInTheDocument()
    expect(screen.getByText('Empresa B')).toBeInTheDocument()
  })

  it('renderiza busqueda', () => {
    renderWithProviders(<CustomersPage />)
    expect(screen.getByPlaceholderText(/buscar/i)).toBeInTheDocument()
  })

  it('puede escribir en busqueda', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CustomersPage />)
    const searchInput = screen.getByPlaceholderText(/buscar/i)
    await user.type(searchInput, 'Empresa')
    expect(searchInput).toHaveValue('Empresa')
  })

  it('abre formulario en modo crear', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CustomersPage />)
    await user.click(screen.getByRole('button', { name: /nuevo cliente/i }))
    expect(screen.getByTestId('customer-form')).toHaveTextContent('create-mode')
  })

  it('abre formulario en modo editar al pulsar accion de tarjeta', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CustomersPage />)

    const customerCard = screen.getByText('Empresa A').closest('[class*="rounded-lg"]')
    expect(customerCard).not.toBeNull()
    const actionButtons = within(customerCard as HTMLElement).getAllByRole('button')

    await user.click(actionButtons[0])
    expect(screen.getByTestId('customer-form')).toHaveTextContent('edit-mode')
  })

  it('ejecuta delete al confirmar dialogo de eliminacion', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CustomersPage />)

    const customerCard = screen.getByText('Empresa A').closest('[class*="rounded-lg"]')
    expect(customerCard).not.toBeNull()
    const actionButtons = within(customerCard as HTMLElement).getAllByRole('button')

    await user.click(actionButtons[1])
    await user.click(screen.getByRole('button', { name: /eliminar/i }))

    expect(mockDeleteCustomer).toHaveBeenCalledWith('cust-1')
  })
})