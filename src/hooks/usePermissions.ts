import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { useCallback } from 'react'

const PERMISSIONS = {
  PRODUCT_VIEW: 'PRODUCT_VIEW',
  PRODUCT_CREATE: 'PRODUCT_CREATE',
  PRODUCT_EDIT: 'PRODUCT_EDIT',
  PRODUCT_DELETE: 'PRODUCT_DELETE',

  INVENTORY_VIEW: 'INVENTORY_VIEW',
  INVENTORY_ADJUST: 'INVENTORY_ADJUST',
  MOVEMENT_VIEW: 'MOVEMENT_VIEW',
  MOVEMENT_CREATE: 'MOVEMENT_CREATE',

  CUSTOMER_VIEW: 'CUSTOMER_VIEW',
  CUSTOMER_CREATE: 'CUSTOMER_CREATE',
  CUSTOMER_EDIT: 'CUSTOMER_EDIT',
  CUSTOMER_DELETE: 'CUSTOMER_DELETE',

  SUPPLIER_VIEW: 'SUPPLIER_VIEW',
  SUPPLIER_CREATE: 'SUPPLIER_CREATE',
  SUPPLIER_EDIT: 'SUPPLIER_EDIT',
  SUPPLIER_DELETE: 'SUPPLIER_DELETE',

  OFFER_VIEW: 'OFFER_VIEW',
  OFFER_CREATE: 'OFFER_CREATE',
  OFFER_EDIT: 'OFFER_EDIT',
  OFFER_DELETE: 'OFFER_DELETE',
  PREINVOICE_VIEW: 'PREINVOICE_VIEW',
  PREINVOICE_CREATE: 'PREINVOICE_CREATE',
  PREINVOICE_EDIT: 'PREINVOICE_EDIT',
  PREINVOICE_APPROVE: 'PREINVOICE_APPROVE',
  INVOICE_VIEW: 'INVOICE_VIEW',
  INVOICE_CREATE: 'INVOICE_CREATE',
  INVOICE_EDIT: 'INVOICE_EDIT',
  INVOICE_CANCEL: 'INVOICE_CANCEL',
  PAYMENT_REGISTER: 'PAYMENT_REGISTER',

  CONSIGNMENT_VIEW: 'CONSIGNMENT_VIEW',
  CONSIGNMENT_CREATE: 'CONSIGNMENT_CREATE',
  CONSIGNMENT_EDIT: 'CONSIGNMENT_EDIT',
  CONSIGNMENT_LIQUIDATE: 'CONSIGNMENT_LIQUIDATE',

  REGISTER_VIEW: 'REGISTER_VIEW',
  REGISTER_OPEN: 'REGISTER_OPEN',
  REGISTER_CLOSE: 'REGISTER_CLOSE',
  POS_ACCESS: 'POS_ACCESS',

  TEAM_VIEW: 'TEAM_VIEW',
  TEAM_CREATE: 'TEAM_CREATE',
  TEAM_EDIT: 'TEAM_EDIT',
  TEAM_DELETE: 'TEAM_DELETE',
  TEAM_ASSIGN: 'TEAM_ASSIGN',
  SCHEDULE_VIEW: 'SCHEDULE_VIEW',
  SCHEDULE_MANAGE: 'SCHEDULE_MANAGE',

  REPORT_VIEW: 'REPORT_VIEW',
  REPORT_EXPORT: 'REPORT_EXPORT',
  REPORT_SALES: 'REPORT_SALES',
  REPORT_INVENTORY: 'REPORT_INVENTORY',
  REPORT_FINANCIAL: 'REPORT_FINANCIAL',

  ORG_VIEW: 'ORG_VIEW',
  ORG_EDIT: 'ORG_EDIT',
  STORE_VIEW: 'STORE_VIEW',
  STORE_CREATE: 'STORE_CREATE',
  STORE_EDIT: 'STORE_EDIT',
  STORE_DELETE: 'STORE_DELETE',
  MEMBER_INVITE: 'MEMBER_INVITE',
  MEMBER_ROLE: 'MEMBER_ROLE',
  MEMBER_REMOVE: 'MEMBER_REMOVE',

  SETTINGS_VIEW: 'SETTINGS_VIEW',
  SETTINGS_PROFILE: 'SETTINGS_PROFILE',
  SETTINGS_ORG: 'SETTINGS_ORG',
  SETTINGS_EXCHANGE: 'SETTINGS_EXCHANGE',

  DASHBOARD_VIEW: 'DASHBOARD_VIEW',
  AUDIT_VIEW: 'AUDIT_VIEW',
  ROLE_MANAGE: 'ROLE_MANAGE',
} as const

// ─── Static fallback (used when role_id is not yet assigned) ───────────────
//
// Maps DB permission (module+action) → PERMISSIONS key.
// Module names match what was seeded in the migration.
export const DB_PERMISSION_KEY_MAP: Record<string, string> = {
  'Productos:view': 'PRODUCT_VIEW',
  'Productos:create': 'PRODUCT_CREATE',
  'Productos:edit': 'PRODUCT_EDIT',
  'Productos:delete': 'PRODUCT_DELETE',
  'Inventario:view': 'INVENTORY_VIEW',
  'Inventario:adjust': 'INVENTORY_ADJUST',
  'Movimientos:view': 'MOVEMENT_VIEW',
  'Movimientos:create': 'MOVEMENT_CREATE',
  'Clientes:view': 'CUSTOMER_VIEW',
  'Clientes:create': 'CUSTOMER_CREATE',
  'Clientes:edit': 'CUSTOMER_EDIT',
  'Clientes:delete': 'CUSTOMER_DELETE',
  'Proveedores:view': 'SUPPLIER_VIEW',
  'Proveedores:create': 'SUPPLIER_CREATE',
  'Proveedores:edit': 'SUPPLIER_EDIT',
  'Proveedores:delete': 'SUPPLIER_DELETE',
  'Ofertas:view': 'OFFER_VIEW',
  'Ofertas:create': 'OFFER_CREATE',
  'Ofertas:edit': 'OFFER_EDIT',
  'Ofertas:delete': 'OFFER_DELETE',
  'Prefacturas:view': 'PREINVOICE_VIEW',
  'Prefacturas:create': 'PREINVOICE_CREATE',
  'Prefacturas:edit': 'PREINVOICE_EDIT',
  'Prefacturas:approve': 'PREINVOICE_APPROVE',
  'Facturas:view': 'INVOICE_VIEW',
  'Facturas:create': 'INVOICE_CREATE',
  'Facturas:edit': 'INVOICE_EDIT',
  'Facturas:cancel': 'INVOICE_CANCEL',
  'Cobros:register': 'PAYMENT_REGISTER',
  'Consignaciones:view': 'CONSIGNMENT_VIEW',
  'Consignaciones:create': 'CONSIGNMENT_CREATE',
  'Consignaciones:edit': 'CONSIGNMENT_EDIT',
  'Consignaciones:liquidate': 'CONSIGNMENT_LIQUIDATE',
  'Caja:view': 'REGISTER_VIEW',
  'Caja:open': 'REGISTER_OPEN',
  'Caja:close': 'REGISTER_CLOSE',
  'Caja:access': 'POS_ACCESS',
  'Equipos:view': 'TEAM_VIEW',
  'Equipos:create': 'TEAM_CREATE',
  'Equipos:edit': 'TEAM_EDIT',
  'Equipos:delete': 'TEAM_DELETE',
  'Equipos:assign': 'TEAM_ASSIGN',
  'Horarios:view': 'SCHEDULE_VIEW',
  'Horarios:manage': 'SCHEDULE_MANAGE',
  'Reportes:view': 'REPORT_VIEW',
  'Reportes:export': 'REPORT_EXPORT',
  'Reportes:sales': 'REPORT_SALES',
  'Reportes:inventory': 'REPORT_INVENTORY',
  'Reportes:financial': 'REPORT_FINANCIAL',
  'Organizaci\u00f3n:view': 'ORG_VIEW',
  'Organizaci\u00f3n:edit': 'ORG_EDIT',
  'Tiendas:view': 'STORE_VIEW',
  'Tiendas:create': 'STORE_CREATE',
  'Tiendas:edit': 'STORE_EDIT',
  'Tiendas:delete': 'STORE_DELETE',
  'Miembros:invite': 'MEMBER_INVITE',
  'Miembros:role': 'MEMBER_ROLE',
  'Miembros:remove': 'MEMBER_REMOVE',
  'Configuraci\u00f3n:view': 'SETTINGS_VIEW',
  'Configuraci\u00f3n:profile': 'SETTINGS_PROFILE',
  'Configuraci\u00f3n:org': 'SETTINGS_ORG',
  'Configuraci\u00f3n:exchange': 'SETTINGS_EXCHANGE',
  'Auditor\u00eda:view': 'AUDIT_VIEW',
  'Roles:manage': 'ROLE_MANAGE',
  'Dashboard:view': 'DASHBOARD_VIEW',
}

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  OWNER: Object.values(PERMISSIONS),

  ADMIN: [
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_EDIT,
    PERMISSIONS.PRODUCT_DELETE,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.MOVEMENT_VIEW,
    PERMISSIONS.MOVEMENT_CREATE,
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_EDIT,
    PERMISSIONS.SUPPLIER_VIEW,
    PERMISSIONS.SUPPLIER_CREATE,
    PERMISSIONS.SUPPLIER_EDIT,
    PERMISSIONS.OFFER_VIEW,
    PERMISSIONS.OFFER_CREATE,
    PERMISSIONS.OFFER_EDIT,
    PERMISSIONS.PREINVOICE_VIEW,
    PERMISSIONS.PREINVOICE_CREATE,
    PERMISSIONS.PREINVOICE_EDIT,
    PERMISSIONS.PREINVOICE_APPROVE,
    PERMISSIONS.INVOICE_VIEW,
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.PAYMENT_REGISTER,
    PERMISSIONS.CONSIGNMENT_VIEW,
    PERMISSIONS.CONSIGNMENT_CREATE,
    PERMISSIONS.CONSIGNMENT_EDIT,
    PERMISSIONS.CONSIGNMENT_LIQUIDATE,
    PERMISSIONS.REGISTER_VIEW,
    PERMISSIONS.REGISTER_OPEN,
    PERMISSIONS.REGISTER_CLOSE,
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.TEAM_CREATE,
    PERMISSIONS.TEAM_EDIT,
    PERMISSIONS.TEAM_DELETE,
    PERMISSIONS.TEAM_ASSIGN,
    PERMISSIONS.SCHEDULE_VIEW,
    PERMISSIONS.SCHEDULE_MANAGE,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_EXPORT,
    PERMISSIONS.REPORT_SALES,
    PERMISSIONS.REPORT_INVENTORY,
    PERMISSIONS.REPORT_FINANCIAL,
    PERMISSIONS.ORG_VIEW,
    PERMISSIONS.ORG_EDIT,
    PERMISSIONS.STORE_VIEW,
    PERMISSIONS.STORE_CREATE,
    PERMISSIONS.STORE_EDIT,
    PERMISSIONS.MEMBER_INVITE,
    PERMISSIONS.MEMBER_ROLE,
    PERMISSIONS.MEMBER_REMOVE,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_PROFILE,
    PERMISSIONS.SETTINGS_ORG,
    PERMISSIONS.SETTINGS_EXCHANGE,
    PERMISSIONS.ROLE_MANAGE,
    PERMISSIONS.AUDIT_VIEW,
  ],

  MEMBER: [
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.MOVEMENT_VIEW,
    PERMISSIONS.MOVEMENT_CREATE,
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.OFFER_VIEW,
    PERMISSIONS.PREINVOICE_VIEW,
    PERMISSIONS.INVOICE_VIEW,
    PERMISSIONS.CONSIGNMENT_VIEW,
    PERMISSIONS.REGISTER_VIEW,
    PERMISSIONS.REGISTER_OPEN,
    PERMISSIONS.REGISTER_CLOSE,
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.SCHEDULE_VIEW,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_EXPORT,
    PERMISSIONS.STORE_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_PROFILE,
  ],
}

// ─── DB fetch ──────────────────────────────────────────────────────────────

export async function fetchRolePermissions(
  userId: string,
  organizationId: string,
): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_role_permissions', {
    p_user_id: userId,
    p_organization_id: organizationId,
  })

  if (error) {
    console.error('[usePermissions] RPC error:', error.message)
    throw error
  }

  const raw = (data as string[]) ?? []
  const mapped: string[] = []
  for (const key of raw) {
    const mappedKey = DB_PERMISSION_KEY_MAP[key]
    if (mappedKey) mapped.push(mappedKey)
  }
  return mapped
}

// ─── Hook to trigger loading ───────────────────────────────────────────────

export function usePermissionsLoad() {
  const setPermissions = useAuthStore((s) => s.setPermissions)
  const setPermissionLoaded = useAuthStore((s) => s.setPermissionLoaded)
  const setPermissionError = useAuthStore((s) => s.setPermissionError)

  const load = useCallback(
    async (userId: string, organizationId: string) => {
      try {
        const perms = await fetchRolePermissions(userId, organizationId)
        setPermissions(perms)
        setPermissionLoaded(true)
        setPermissionError(false)
      } catch {
        setPermissionError(true)
      }
    },
    [setPermissions, setPermissionLoaded, setPermissionError],
  )

  return { load }
}

// ─── Dynamic hook ──────────────────────────────────────────────────────────

export function usePermissions() {
  const storePermissions = useAuthStore((s) => s.permissions)
  const role = useAuthStore((s) => s.user?.role ?? 'MEMBER')
  const normalizedRole = typeof role === 'string' ? role.toUpperCase() : 'MEMBER'

  const staticPerms: string[] =
    ROLE_PERMISSIONS[normalizedRole] ?? ROLE_PERMISSIONS.MEMBER

  // For OWNER/ADMIN, merge DB + static so virtual permissions are never lost
  // For other roles, use DB permissions exactly (restrictive)
  const isPrivileged = normalizedRole === 'OWNER' || normalizedRole === 'ADMIN'
  const userPermissions: string[] =
    storePermissions.length > 0 && isPrivileged
      ? [...new Set([...storePermissions, ...staticPerms])]
      : storePermissions.length > 0
        ? storePermissions
        : staticPerms

  const hasPermission = (permission: string) => userPermissions.includes(permission)
  const hasAnyPermission = (perms: string[]) => perms.some((p) => userPermissions.includes(p))
  const hasAllPermissions = (perms: string[]) => perms.every((p) => userPermissions.includes(p))

  const isOwner = normalizedRole === 'OWNER'
  const isAdmin = normalizedRole === 'ADMIN' || isOwner

  return {
    permissions: userPermissions,
    role,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isOwner,
    isAdmin,
    isLoading: false,
  }
}

export { PERMISSIONS }
