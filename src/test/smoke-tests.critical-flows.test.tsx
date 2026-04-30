import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import { LoginPage } from '@/pages/auth/LoginPage'

// ==================== Mocks ====================
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({
        data: {
          user: { id: 'user-1', email: 'admin@test.com' },
          session: { access_token: 'token', expires_at: Date.now() / 1000 + 3600 }
        },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { id: 'user-1', full_name: 'Admin User', organization_id: 'org-1', role: 'ADMIN' },
            error: null
          }),
        })),
      })),
    })),
  },
}))

const mockAuthState = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  session: null,
  organizations: [],
  currentOrganization: null,
  stores: [],
  currentStore: null,
  permissions: [],
  setLoading: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  selectOrganization: vi.fn(),
  setStores: vi.fn(),
  selectStore: vi.fn(),
  setPermissions: vi.fn(),
  setUser: vi.fn(),
  setSession: vi.fn(),
}

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector) => {
    if (typeof selector === 'function') {
      return selector(mockAuthState)
    }
    return mockAuthState
  }),
}))

vi.mock('@/hooks/usePermissions', () => ({
  PERMISSIONS: {
    PRODUCT_VIEW: 'PRODUCT_VIEW',
    PRODUCT_CREATE: 'PRODUCT_CREATE',
    PRODUCT_EDIT: 'PRODUCT_EDIT',
    PRODUCT_DELETE: 'PRODUCT_DELETE',
    INVENTORY_VIEW: 'INVENTORY_VIEW',
    MOVEMENT_VIEW: 'MOVEMENT_VIEW',
    CUSTOMER_VIEW: 'CUSTOMER_VIEW',
    CUSTOMER_CREATE: 'CUSTOMER_CREATE',
    CUSTOMER_EDIT: 'CUSTOMER_EDIT',
    CUSTOMER_DELETE: 'CUSTOMER_DELETE',
    SUPPLIER_VIEW: 'SUPPLIER_VIEW',
    SUPPLIER_CREATE: 'SUPPLIER_CREATE',
    SUPPLIER_EDIT: 'SUPPLIER_EDIT',
    SUPPLIER_DELETE: 'SUPPLIER_DELETE',
    STORE_VIEW: 'STORE_VIEW',
    STORE_CREATE: 'STORE_CREATE',
    STORE_EDIT: 'STORE_EDIT',
    STORE_DELETE: 'STORE_DELETE',
    OFFER_VIEW: 'OFFER_VIEW',
    PREINVOICE_VIEW: 'PREINVOICE_VIEW',
    INVOICE_VIEW: 'INVOICE_VIEW',
    CONSIGNMENT_VIEW: 'CONSIGNMENT_VIEW',
    REGISTER_VIEW: 'REGISTER_VIEW',
    POS_ACCESS: 'POS_ACCESS',
    TEAM_VIEW: 'TEAM_VIEW',
    TEAM_CREATE: 'TEAM_CREATE',
    SCHEDULE_VIEW: 'SCHEDULE_VIEW',
    REPORT_VIEW: 'REPORT_VIEW',
    REPORT_SALES: 'REPORT_SALES',
    REPORT_INVENTORY: 'REPORT_INVENTORY',
    REPORT_FINANCIAL: 'REPORT_FINANCIAL',
    ORG_VIEW: 'ORG_VIEW',
    SETTINGS_VIEW: 'SETTINGS_VIEW',
    SETTINGS_PROFILE: 'SETTINGS_PROFILE',
    SETTINGS_ORG: 'SETTINGS_ORG',
    SETTINGS_EXCHANGE: 'SETTINGS_EXCHANGE',
    AUDIT_VIEW: 'AUDIT_VIEW',
    ROLE_MANAGE: 'ROLE_MANAGE',
  },
  DB_PERMISSION_KEY_MAP: {},
  ROLE_PERMISSIONS: {
    OWNER: [],
    ADMIN: [],
    MEMBER: [],
  },
  usePermissions: vi.fn(() => ({
    hasPermission: vi.fn(() => true),
    hasAnyPermission: vi.fn(() => true),
    hasAllPermissions: vi.fn(() => true),
    permissions: ['*'],
    role: 'ADMIN',
    isOwner: false,
    isAdmin: true,
    isLoading: false,
  })),
}))

// ==================== Test Utilities ====================
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false, gcTime: Infinity },
    mutations: { retry: false },
  },
})

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>
  )
}

// ==================== Tests ====================
describe('Critical User Flows - Smoke Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthState.isAuthenticated = false
    mockAuthState.user = null
  })

  describe('Flow 1: Login Page', () => {
    it('renders login form with email and password fields', () => {
      renderWithProviders(<LoginPage />)

      expect(screen.getByLabelText(/correo/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument()
    })

    it('allows typing in email field', async () => {
      const user = userEvent.setup()
      renderWithProviders(<LoginPage />)

      const emailInput = screen.getByLabelText(/correo/i)
      await user.type(emailInput, 'test@example.com')
      expect(emailInput).toHaveValue('test@example.com')
    })

    it('allows typing in password field', async () => {
      const user = userEvent.setup()
      renderWithProviders(<LoginPage />)

      const passwordInput = screen.getByLabelText(/contraseña/i)
      await user.type(passwordInput, 'password123')
      expect(passwordInput).toHaveValue('password123')
    })
  })
})
