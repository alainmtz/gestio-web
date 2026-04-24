export const APP_NAME = 'Gestio v2'
export const APP_DESCRIPTION = 'Sistema CRM Empresarial'

export const ROUTES = {
  HOME: '/dashboard',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  
  DASHBOARD: '/dashboard',
  
  INVENTORY: '/inventory',
  PRODUCTS: '/inventory/products',
  PRODUCT_DETAIL: (id: string) => `/inventory/products/${id}`,
  PRODUCT_NEW: '/inventory/products/new',
  CATEGORIES: '/inventory/categories',
  MOVEMENTS: '/inventory/movements',
  TRANSFERS: '/inventory/transfers',
  
  CUSTOMERS: '/customers',
  CUSTOMERS_LIST: '/customers/list',
  CUSTOMER_DETAIL: (id: string) => `/customers/${id}`,
  CUSTOMER_NEW: '/customers/new',
  SUPPLIERS: '/customers/suppliers',
  
  BILLING: '/billing',
  OFFERS: '/billing/offers',
  OFFER_DETAIL: (id: string) => `/billing/offers/${id}`,
  OFFER_NEW: '/billing/offers/new',
  PREINVOICES: '/billing/preinvoices',
  PREINVOICE_DETAIL: (id: string) => `/billing/preinvoices/${id}`,
  INVOICES: '/billing/invoices',
  INVOICE_DETAIL: (id: string) => `/billing/invoices/${id}`,
  INVOICE_NEW: '/billing/invoices/new',
  
  STORES: '/stores',
  STORE_DETAIL: (id: string) => `/stores/${id}`,
  STORE_NEW: '/stores/new',
  
  CONSIGNMENTS: '/consignments',
  CONSIGNMENT_DETAIL: (id: string) => `/consignments/${id}`,
  CONSIGNMENT_NEW: '/consignments/new',
  
  CASH_REGISTER: '/cash-register',
  CASH_SESSIONS: '/cash-register/sessions',
  CASH_SESSION_DETAIL: (id: string) => `/cash-register/sessions/${id}`,
  CASH_MOVEMENTS: '/cash-register/movements',
  
  TEAMS: '/teams',
  TEAM_DETAIL: (id: string) => `/teams/${id}`,
  TEAM_NEW: '/teams/new',
  SCHEDULES: '/teams/schedules',
  TASKS: '/teams/tasks',
  
  REPORTS: '/reports',
  REPORTS_SALES: '/reports/sales',
  REPORTS_INVENTORY: '/reports/inventory',
  REPORTS_FINANCIAL: '/reports/financial',
  REPORTS_AUDIT: '/reports/audit',
  
  POS: '/pos',
  
  SETTINGS: '/settings',
  SETTINGS_PROFILE: '/settings/profile',
  SETTINGS_ORGANIZATION: '/settings/organization',
  SETTINGS_MEMBERS: '/settings/members',
  SETTINGS_INVITATIONS: '/settings/invitations',
  SETTINGS_PERMISSIONS: '/settings/permissions',
  SETTINGS_EXCHANGE: '/settings/exchange',
  SETTINGS_PRINTER: '/settings/printer',
} as const

export const CURRENCIES = {
  CUP: { code: 'CUP', name: 'Peso Cubano', symbol: '₱' },
  USD: { code: 'USD', name: 'Dólar Estadounidense', symbol: '$' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€' },
  MLC: { code: 'MLC', name: 'Moneda Libremente Convertible', symbol: 'MLC' },
} as const

export const DOCUMENT_TYPES = {
  OFFER: 'OFFER',
  PREINVOICE: 'PREINVOICE',
  INVOICE: 'INVOICE',
} as const

export const DOCUMENT_STATUS = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  ISSUED: 'ISSUED',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
} as const

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
} as const

export const PAYMENT_METHODS = {
  CASH: 'CASH',
  CARD: 'CARD',
  TRANSFER: 'TRANSFER',
  CHECK: 'CHECK',
  OTHER: 'OTHER',
} as const

export const MOVEMENT_TYPES = {
  PURCHASE: 'PURCHASE',
  SALE: 'SALE',
  ADJUSTMENT: 'ADJUSTMENT',
  TRANSFER_IN: 'TRANSFER_IN',
  TRANSFER_OUT: 'TRANSFER_OUT',
  RETURN: 'RETURN',
  DAMAGE: 'DAMAGE',
  CONSIGNMENT_IN: 'CONSIGNMENT_IN',
  CONSIGNMENT_OUT: 'CONSIGNMENT_OUT',
  OPENING: 'OPENING',
} as const

export const ROLES = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
} as const

export const USER_TYPES = {
  INDIVIDUAL: 'INDIVIDUAL',
  BUSINESS: 'BUSINESS',
} as const

export const CONSIGNMENT_STATUS = {
  ACTIVE: 'ACTIVE',
  PARTIAL: 'PARTIAL',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const

export const SESSION_STATUS = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  SUSPENDED: 'SUSPENDED',
} as const

export const CASH_MOVEMENT_TYPES = {
  INCOME:     'INCOME',
  EXPENSE:    'EXPENSE',
  DEPOSIT:    'DEPOSIT',
  WITHDRAWAL: 'WITHDRAWAL',
} as const

export const CASH_MOVEMENT_TYPE_LABELS: Record<string, { label: string; color: string; isPositive: boolean }> = {
  INCOME:     { label: 'Ingreso',    color: 'text-blue-600',   isPositive: true  },
  DEPOSIT:    { label: 'Depósito',   color: 'text-blue-600',   isPositive: true  },
  EXPENSE:    { label: 'Egreso',     color: 'text-red-600',    isPositive: false },
  WITHDRAWAL: { label: 'Extracción', color: 'text-orange-600', isPositive: false },
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  CUP: '₱',
  USD: '$',
  EUR: '€',
  MLC: 'MLC',
}

/** Denominations per currency, largest to smallest */
export const CURRENCY_DENOMINATIONS: Record<string, number[]> = {
  CUP: [1000, 500, 200, 100, 50, 20, 10, 5, 1],
  USD: [100, 50, 20, 10, 5, 1],
  EUR: [500, 200, 100, 50, 20, 10, 5, 2, 1],
  MLC: [100, 50, 20, 10, 5, 1],
}
