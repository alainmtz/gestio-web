import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Shield, Loader2, Plus, Trash2, Copy, ShoppingCart, CreditCard, Package, Calculator, Users, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/lib/toast'
import { supabase } from '@/lib/supabase'
import { useState, useMemo } from 'react'
import { usePermissions, PERMISSIONS, DB_PERMISSION_KEY_MAP } from '@/hooks/usePermissions'

interface Permission {
  id: string
  module: string
  action: string
  description?: string
}

interface Role {
  id: string
  name: string
  description?: string
  organization_id: string
  is_system_role: boolean
}

interface RolePermission {
  role_id: string
  permission_id: string
}

const ACTION_LABELS: Record<string, string> = {
  view: 'Ver',
  create: 'Crear',
  edit: 'Editar',
  delete: 'Eliminar',
  approve: 'Aprobar',
  reject: 'Rechazar',
  export: 'Exportar',
  manage: 'Gestionar',
  adjust: 'Ajustar',
  liquidate: 'Liquidar',
  cancel: 'Anular',
  register: 'Registrar',
  open: 'Abrir',
  close: 'Cerrar',
  access: 'Acceder',
  assign: 'Asignar',
  invite: 'Invitar',
  role: 'Cambiar rol',
  remove: 'Remover',
  profile: 'Editar perfil',
  org: 'Configuración org',
  exchange: 'Tasas de cambio',
  sales: 'Ventas',
  inventory: 'Inventario',
  financial: 'Financiero',
}

const ACTION_ORDER = [
  'view', 'access', 'create', 'edit', 'delete', 'approve', 'reject',
  'cancel', 'register', 'open', 'close', 'adjust', 'liquidate',
  'assign', 'invite', 'role', 'remove', 'export', 'manage',
  'profile', 'org', 'exchange', 'sales', 'inventory', 'financial',
]

const SYSTEM_ROLE_LABELS: Record<string, string> = {
  org_owner: 'Propietario',
  org_admin: 'Administrador',
  store_manager: 'Gerente de Tienda',
  cashier: 'Cajero',
  viewer: 'Solo Lectura',
}

const SYSTEM_ROLE_DESCRIPTIONS: Record<string, string> = {
  org_owner: 'Acceso completo a toda la organización.',
  org_admin: 'Administra la mayoría de las funciones excepto gestión de roles.',
  store_manager: 'Gestiona operaciones de tienda: productos, ventas, inventario.',
  cashier: 'Acceso al POS y caja registradora.',
  viewer: 'Solo puede visualizar información, sin modificaciones.',
}

function actionLabel(action: string) {
  return ACTION_LABELS[action] ?? action
}

// ─── Reverse lookup: PERMISSIONS key → { module, action } ──────────────────
const PERM_KEY_TO_MODULE_ACTION: Record<string, { module: string; action: string }> = {}
for (const [moduleAction, key] of Object.entries(DB_PERMISSION_KEY_MAP)) {
  const colonIdx = moduleAction.indexOf(':')
  PERM_KEY_TO_MODULE_ACTION[key] = {
    module: moduleAction.slice(0, colonIdx),
    action: moduleAction.slice(colonIdx + 1),
  }
}

// ─── Predefined templates (frontend-only, no DB role required) ─────────────
interface PredefinedTemplate {
  id: string
  name: string
  description: string
  colorClass: string
  Icon: React.ComponentType<{ className?: string }>
  permissions: string[]
}

const PREDEFINED_TEMPLATES: PredefinedTemplate[] = [
  {
    id: 'tpl_vendedor',
    name: 'Vendedor',
    description: 'POS, ofertas y atención a clientes. Ideal para personal de ventas en mostrador.',
    colorClass: 'bg-blue-100 text-blue-700',
    Icon: ShoppingCart,
    permissions: [
      PERMISSIONS.PRODUCT_VIEW, PERMISSIONS.INVENTORY_VIEW, PERMISSIONS.MOVEMENT_VIEW,
      PERMISSIONS.CUSTOMER_VIEW, PERMISSIONS.CUSTOMER_CREATE, PERMISSIONS.CUSTOMER_EDIT,
      PERMISSIONS.OFFER_VIEW, PERMISSIONS.OFFER_CREATE, PERMISSIONS.OFFER_EDIT,
      PERMISSIONS.INVOICE_VIEW, PERMISSIONS.PAYMENT_REGISTER,
      PERMISSIONS.REGISTER_VIEW, PERMISSIONS.REGISTER_OPEN, PERMISSIONS.REGISTER_CLOSE,
      PERMISSIONS.POS_ACCESS,
      PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.SETTINGS_PROFILE,
    ],
  },
  {
    id: 'tpl_cajero',
    name: 'Cajero',
    description: 'Acceso al POS y caja registradora. Sin acceso a inventario ni reportes.',
    colorClass: 'bg-green-100 text-green-700',
    Icon: CreditCard,
    permissions: [
      PERMISSIONS.PRODUCT_VIEW, PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.CUSTOMER_VIEW,
      PERMISSIONS.INVOICE_VIEW, PERMISSIONS.PAYMENT_REGISTER,
      PERMISSIONS.REGISTER_VIEW, PERMISSIONS.REGISTER_OPEN, PERMISSIONS.REGISTER_CLOSE,
      PERMISSIONS.POS_ACCESS,
      PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.SETTINGS_PROFILE,
    ],
  },
  {
    id: 'tpl_almacen',
    name: 'Gerente de Almacén',
    description: 'Control total de inventario: productos, movimientos, consignaciones y proveedores.',
    colorClass: 'bg-orange-100 text-orange-700',
    Icon: Package,
    permissions: [
      PERMISSIONS.PRODUCT_VIEW, PERMISSIONS.PRODUCT_CREATE, PERMISSIONS.PRODUCT_EDIT,
      PERMISSIONS.INVENTORY_VIEW, PERMISSIONS.INVENTORY_ADJUST,
      PERMISSIONS.MOVEMENT_VIEW, PERMISSIONS.MOVEMENT_CREATE,
      PERMISSIONS.CONSIGNMENT_VIEW, PERMISSIONS.CONSIGNMENT_CREATE,
      PERMISSIONS.CONSIGNMENT_EDIT, PERMISSIONS.CONSIGNMENT_LIQUIDATE,
      PERMISSIONS.STORE_VIEW,
      PERMISSIONS.SUPPLIER_VIEW, PERMISSIONS.SUPPLIER_CREATE, PERMISSIONS.SUPPLIER_EDIT,
      PERMISSIONS.REPORT_VIEW, PERMISSIONS.REPORT_INVENTORY,
      PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.SETTINGS_PROFILE,
    ],
  },
  {
    id: 'tpl_contador',
    name: 'Contador',
    description: 'Facturación completa, cobros y reportes financieros. Sin acceso a personas ni POS.',
    colorClass: 'bg-purple-100 text-purple-700',
    Icon: Calculator,
    permissions: [
      PERMISSIONS.PRODUCT_VIEW, PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.CUSTOMER_VIEW,
      PERMISSIONS.SUPPLIER_VIEW,
      PERMISSIONS.OFFER_VIEW, PERMISSIONS.OFFER_CREATE, PERMISSIONS.OFFER_EDIT,
      PERMISSIONS.PREINVOICE_VIEW, PERMISSIONS.PREINVOICE_CREATE,
      PERMISSIONS.PREINVOICE_EDIT, PERMISSIONS.PREINVOICE_APPROVE,
      PERMISSIONS.INVOICE_VIEW, PERMISSIONS.INVOICE_CREATE,
      PERMISSIONS.INVOICE_EDIT, PERMISSIONS.INVOICE_CANCEL,
      PERMISSIONS.PAYMENT_REGISTER,
      PERMISSIONS.REGISTER_VIEW,
      PERMISSIONS.REPORT_VIEW, PERMISSIONS.REPORT_EXPORT,
      PERMISSIONS.REPORT_SALES, PERMISSIONS.REPORT_FINANCIAL,
      PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.SETTINGS_PROFILE,
    ],
  },
  {
    id: 'tpl_crm',
    name: 'Gestor de Clientes',
    description: 'CRM completo: clientes, ofertas y consignaciones. Sin acceso a finanzas.',
    colorClass: 'bg-pink-100 text-pink-700',
    Icon: Users,
    permissions: [
      PERMISSIONS.PRODUCT_VIEW, PERMISSIONS.INVENTORY_VIEW,
      PERMISSIONS.CUSTOMER_VIEW, PERMISSIONS.CUSTOMER_CREATE,
      PERMISSIONS.CUSTOMER_EDIT, PERMISSIONS.CUSTOMER_DELETE,
      PERMISSIONS.OFFER_VIEW, PERMISSIONS.OFFER_CREATE, PERMISSIONS.OFFER_EDIT,
      PERMISSIONS.PREINVOICE_VIEW,
      PERMISSIONS.INVOICE_VIEW,
      PERMISSIONS.CONSIGNMENT_VIEW, PERMISSIONS.CONSIGNMENT_CREATE, PERMISSIONS.CONSIGNMENT_EDIT,
      PERMISSIONS.TEAM_VIEW, PERMISSIONS.SCHEDULE_VIEW,
      PERMISSIONS.REPORT_VIEW,
      PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.SETTINGS_PROFILE,
    ],
  },
]

function sortPermissions(permissions: Permission[]): Permission[] {
  return [...permissions].sort((a, b) => {
    const ai = ACTION_ORDER.indexOf(a.action)
    const bi = ACTION_ORDER.indexOf(b.action)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })
}

// ─── Permissions matrix (reusable for both tabs) ───────────────────────────

interface MatrixProps {
  roles: Role[]
  permissions: Permission[]
  grantedSet: Set<string>
  pendingChanges: Map<string, boolean>
  canEdit: boolean
  onToggle: (roleId: string, permId: string) => void
  onToggleModule: (roleId: string, mod: string) => void
  onDeleteRole?: (roleId: string) => void
}

function PermissionMatrix({
  roles,
  permissions,
  grantedSet,
  pendingChanges,
  canEdit,
  onToggle,
  onToggleModule,
  onDeleteRole,
}: MatrixProps) {
  const modules = useMemo(() => [...new Set(permissions.map((p) => p.module))], [permissions])

  const permissionsByModule = useMemo(() => {
    const map = new Map<string, Permission[]>()
    for (const mod of modules) {
      map.set(mod, sortPermissions(permissions.filter((p) => p.module === mod)))
    }
    return map
  }, [permissions, modules])

  const isGranted = (roleId: string, permissionId: string): boolean => {
    const key = `${roleId}:${permissionId}`
    if (pendingChanges.has(key)) return pendingChanges.get(key)!
    return grantedSet.has(key)
  }

  const isModuleFullyGranted = (roleId: string, mod: string): boolean => {
    const perms = permissionsByModule.get(mod) ?? []
    return perms.length > 0 && perms.every((p) => isGranted(roleId, p.id))
  }

  const isModulePartiallyGranted = (roleId: string, mod: string): boolean => {
    const perms = permissionsByModule.get(mod) ?? []
    return perms.some((p) => isGranted(roleId, p.id)) && !isModuleFullyGranted(roleId, mod)
  }

  if (permissions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No hay permisos configurados en el sistema.
        </CardContent>
      </Card>
    )
  }

  if (roles.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No hay roles en esta sección. Crea un rol personalizado para comenzar.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 font-medium min-w-[220px]">Permiso</th>
              {roles.map((role) => (
                <th key={role.id} className="px-4 py-3 font-medium text-center min-w-[130px]">
                  <div className="flex flex-col items-center gap-1">
                    <span>{SYSTEM_ROLE_LABELS[role.name] ?? role.name}</span>
                    {canEdit && !role.is_system_role && onDeleteRole && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground hover:text-destructive"
                        onClick={() => onDeleteRole(role.id)}
                        title="Eliminar rol"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((mod) => {
              const modPerms = permissionsByModule.get(mod) ?? []
              return [
                <tr key={`mod-${mod}`} className="bg-muted/30 border-b">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      {mod}
                    </div>
                  </td>
                  {roles.map((role) => {
                    const full = isModuleFullyGranted(role.id, mod)
                    const partial = isModulePartiallyGranted(role.id, mod)
                    return (
                      <td key={role.id} className="px-4 py-2 text-center">
                        <Checkbox
                          checked={full}
                          indeterminate={partial}
                          disabled={!canEdit || role.is_system_role}
                          onCheckedChange={() => canEdit && !role.is_system_role && onToggleModule(role.id, mod)}
                          title={`Alternar módulo ${mod}`}
                        />
                      </td>
                    )
                  })}
                </tr>,
                ...modPerms.map((perm) => (
                  <tr key={perm.id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2 pl-10">
                      <Badge variant="outline" className="mr-2 text-xs font-normal">
                        {actionLabel(perm.action)}
                      </Badge>
                      {perm.description && (
                        <span className="text-muted-foreground text-xs">{perm.description}</span>
                      )}
                    </td>
                    {roles.map((role) => (
                      <td key={role.id} className="px-4 py-2 text-center">
                        <Checkbox
                          checked={isGranted(role.id, perm.id)}
                          disabled={!canEdit || role.is_system_role}
                          onCheckedChange={() => canEdit && !role.is_system_role && onToggle(role.id, perm.id)}
                        />
                      </td>
                    ))}
                  </tr>
                )),
              ]
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export function PermissionsPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)

  const canManage = hasPermission(PERMISSIONS.ROLE_MANAGE)

  // Dialogs
  const [showNewRole, setShowNewRole] = useState(false)
  const [newRoleStep, setNewRoleStep] = useState<1 | 2>(1)
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleDescription, setNewRoleDescription] = useState('')
  const [newRoleTemplate, setNewRoleTemplate] = useState<string>('none')
  // Permisos seleccionados manualmente en el paso 2 (set de permission IDs de DB)
  const [newRoleSelectedPerms, setNewRoleSelectedPerms] = useState<Set<string>>(new Set())
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null)

  // Pending changes for custom roles
  const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map())
  const [saving, setSaving] = useState(false)

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: permissions = [], isLoading: loadingPermissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('module')
        .order('action')
      if (error) throw error
      return data as Permission[]
    },
  })

  const { data: allRoles = [], isLoading: loadingRoles } = useQuery({
    queryKey: ['roles', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name')
      if (error) throw error
      return data as Role[]
    },
    enabled: !!organizationId,
  })

  const systemRoles = useMemo(() => allRoles.filter((r) => r.is_system_role), [allRoles])
  const customRoles = useMemo(() => allRoles.filter((r) => !r.is_system_role), [allRoles])

  const allRoleIds = allRoles.map((r) => r.id)

  const { data: rolePermissions = [], isLoading: loadingRolePerms } = useQuery({
    queryKey: ['rolePermissions', organizationId, allRoleIds.join(',')],
    queryFn: async () => {
      if (!allRoleIds.length) return []
      const { data, error } = await supabase
        .from('role_permissions')
        .select('role_id, permission_id')
        .in('role_id', allRoleIds)
      if (error) throw error
      return data as RolePermission[]
    },
    enabled: !!organizationId && allRoleIds.length > 0,
  })

  const grantedSet = useMemo(() => {
    const set = new Set<string>()
    for (const rp of rolePermissions) set.add(`${rp.role_id}:${rp.permission_id}`)
    return set
  }, [rolePermissions])

  // ── Toggle helpers ───────────────────────────────────────────────────────

  const togglePermission = (roleId: string, permissionId: string) => {
    const key = `${roleId}:${permissionId}`
    const current = pendingChanges.has(key) ? pendingChanges.get(key)! : grantedSet.has(key)
    setPendingChanges((prev) => {
      const next = new Map(prev)
      const original = grantedSet.has(key)
      if (current !== original) {
        next.delete(key)
      } else {
        next.set(key, !current)
      }
      return next
    })
  }

  const modules = useMemo(() => [...new Set(permissions.map((p) => p.module))], [permissions])
  const permissionsByModule = useMemo(() => {
    const map = new Map<string, Permission[]>()
    for (const mod of modules) {
      map.set(mod, sortPermissions(permissions.filter((p) => p.module === mod)))
    }
    return map
  }, [permissions, modules])

  const toggleModule = (roleId: string, mod: string) => {
    const perms = permissionsByModule.get(mod) ?? []
    const allGranted = perms.every((p) => {
      const key = `${roleId}:${p.id}`
      return pendingChanges.has(key) ? pendingChanges.get(key)! : grantedSet.has(key)
    })
    setPendingChanges((prev) => {
      const next = new Map(prev)
      for (const p of perms) {
        const key = `${roleId}:${p.id}`
        const original = grantedSet.has(key)
        const desired = !allGranted
        if (desired === original) next.delete(key)
        else next.set(key, desired)
      }
      return next
    })
  }

  const hasPendingChanges = pendingChanges.size > 0

  // ── Save / Discard ───────────────────────────────────────────────────────

  const saveChanges = async () => {
    setSaving(true)
    try {
      const toInsert: { role_id: string; permission_id: string }[] = []
      const toDelete: { role_id: string; permission_id: string }[] = []

      for (const [key, value] of pendingChanges.entries()) {
        const [role_id, permission_id] = key.split(':')
        if (value) toInsert.push({ role_id, permission_id })
        else toDelete.push({ role_id, permission_id })
      }

      for (const item of toInsert) {
        const { error } = await supabase
          .from('role_permissions')
          .upsert(item, { onConflict: 'role_id,permission_id' })
        if (error) throw error
      }

      for (const item of toDelete) {
        const { error } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', item.role_id)
          .eq('permission_id', item.permission_id)
        if (error) throw error
      }

      setPendingChanges(new Map())
      queryClient.invalidateQueries({ queryKey: ['rolePermissions'] })
      toast({ title: 'Permisos guardados', variant: 'default' })
    } catch (err: unknown) {
      toast({ title: 'Error al guardar', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // ── Helpers para el wizard de nuevo rol ─────────────────────────────────

  /**
   * Mapa local módulo → lista de { key, action } construido desde DB_PERMISSION_KEY_MAP.
   * No depende de la tabla permissions de la DB; funciona siempre.
   */
  const localPermissionsByModule = useMemo(() => {
    const map = new Map<string, Array<{ key: string; action: string }>>()
    for (const [moduleAction, key] of Object.entries(DB_PERMISSION_KEY_MAP)) {
      const colonIdx = moduleAction.indexOf(':')
      const mod = moduleAction.slice(0, colonIdx)
      const action = moduleAction.slice(colonIdx + 1)
      if (!map.has(mod)) map.set(mod, [])
      map.get(mod)!.push({ key, action })
    }
    return map
  }, [])

  /**
   * Convierte la selección de plantilla a un Set de PERMISSIONS keys (no UUIDs).
   * La conversión a UUIDs se hace al guardar.
   */
  const resolveTemplatePermKeys = (templateId: string): Set<string> => {
    if (templateId === 'none') return new Set()
    if (templateId.startsWith('tpl_')) {
      const tpl = PREDEFINED_TEMPLATES.find((t) => t.id === templateId)
      return tpl ? new Set(tpl.permissions) : new Set()
    }
    // System or custom role: copy their permission keys via DB permissions lookup
    const keys = new Set<string>()
    for (const rp of rolePermissions) {
      if (rp.role_id !== templateId) continue
      const dbPerm = permissions.find((p) => p.id === rp.permission_id)
      if (!dbPerm) continue
      const key = DB_PERMISSION_KEY_MAP[`${dbPerm.module}:${dbPerm.action}`]
      if (key) keys.add(key)
    }
    return keys
  }

  const handleNewRoleNext = () => {
    const initial = resolveTemplatePermKeys(newRoleTemplate)
    setNewRoleSelectedPerms(initial)
    setNewRoleStep(2)
  }

  const toggleNewPerm = (permKey: string) => {
    setNewRoleSelectedPerms((prev) => {
      const next = new Set(prev)
      if (next.has(permKey)) next.delete(permKey)
      else next.add(permKey)
      return next
    })
  }

  const toggleNewModule = (mod: string) => {
    const modPerms = localPermissionsByModule.get(mod) ?? []
    const allOn = modPerms.every((p) => newRoleSelectedPerms.has(p.key))
    setNewRoleSelectedPerms((prev) => {
      const next = new Set(prev)
      for (const p of modPerms) {
        if (allOn) next.delete(p.key)
        else next.add(p.key)
      }
      return next
    })
  }

  const resetNewRoleDialog = () => {
    setShowNewRole(false)
    setNewRoleStep(1)
    setNewRoleName('')
    setNewRoleDescription('')
    setNewRoleTemplate('none')
    setNewRoleSelectedPerms(new Set())
  }

  // ── Create custom role ────────────────────────────────────────────────────

  const createRoleMutation = useMutation({
    mutationFn: async () => {
      // 1. Create the role
      const { data: newRole, error } = await supabase
        .from('roles')
        .insert({
          name: newRoleName.trim(),
          description: newRoleDescription.trim() || null,
          organization_id: organizationId,
          is_system_role: false,
        })
        .select()
        .single()
      if (error) throw error

      // 2. Convertir PERMISSIONS keys a UUIDs y asignar al rol
      if (newRoleSelectedPerms.size > 0) {
        const toInsert: { role_id: string; permission_id: string }[] = []
        for (const key of newRoleSelectedPerms) {
          const ma = PERM_KEY_TO_MODULE_ACTION[key]
          if (!ma) continue
          const dbPerm = permissions.find((p) => p.module === ma.module && p.action === ma.action)
          if (dbPerm) toInsert.push({ role_id: newRole.id, permission_id: dbPerm.id })
        }
        if (toInsert.length > 0) {
          const { error: rpError } = await supabase.from('role_permissions').insert(toInsert)
          if (rpError) throw rpError
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      queryClient.invalidateQueries({ queryKey: ['rolePermissions'] })
      toast({ title: 'Rol creado', variant: 'default' })
      resetNewRoleDialog()
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    },
  })

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase.from('roles').delete().eq('id', roleId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      queryClient.invalidateQueries({ queryKey: ['rolePermissions'] })
      toast({ title: 'Rol eliminado', variant: 'default' })
      setDeletingRoleId(null)
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
      setDeletingRoleId(null)
    },
  })

  const isLoading = loadingPermissions || loadingRoles || loadingRolePerms

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  const emptyGranted = new Map<string, boolean>()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Permisos</h1>
          <p className="text-muted-foreground">Configura los permisos por rol de tu organización</p>
        </div>
        <div className="flex items-center gap-2">
          {hasPendingChanges && (
            <>
              <Button variant="outline" size="sm" onClick={() => setPendingChanges(new Map())} disabled={saving}>
                Descartar
              </Button>
              {canManage && (
                <Button size="sm" onClick={saveChanges} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar cambios
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {hasPendingChanges && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 px-4 py-2 text-sm text-yellow-800">
          Tienes {pendingChanges.size} cambio{pendingChanges.size !== 1 ? 's' : ''} sin guardar.
        </div>
      )}

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Plantillas del sistema</TabsTrigger>
          <TabsTrigger value="custom">Roles personalizados</TabsTrigger>
        </TabsList>

        {/* ── Tab: System role templates ── */}
        <TabsContent value="templates" className="space-y-6 mt-4">
          <p className="text-sm text-muted-foreground">
            Plantillas listas para usar como base de nuevos roles personalizados.
          </p>

          {/* ── Predefined quick templates ── */}
          <div className="space-y-3">
            <h2 className="text-base font-semibold">Plantillas rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PREDEFINED_TEMPLATES.map((tpl) => (
                <Card key={tpl.id} className="flex flex-col">
                  <CardContent className="pt-5 flex flex-col flex-1 gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`rounded-lg p-2 shrink-0 ${tpl.colorClass}`}>
                        <tpl.Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold">{tpl.name}</p>
                          <Badge variant="secondary" className="shrink-0 text-xs">{tpl.permissions.length} permisos</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{tpl.description}</p>
                      </div>
                    </div>
                    {canManage && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-auto"
                        onClick={() => {
                          setNewRoleTemplate(tpl.id)
                          setShowNewRole(true)
                        }}
                      >
                        <Copy className="mr-2 h-3.5 w-3.5" />
                        Usar como base
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* ── System roles (read-only) ── */}
          <div className="space-y-3">
            <h2 className="text-base font-semibold">Roles del sistema</h2>
            <p className="text-sm text-muted-foreground">
              Roles predefinidos. Sus permisos no se pueden modificar directamente.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {systemRoles.map((role) => {
                const permCount = rolePermissions.filter((rp) => rp.role_id === role.id).length
                return (
                  <Card key={role.id} className="flex flex-col">
                    <CardContent className="pt-5 flex flex-col flex-1 gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{SYSTEM_ROLE_LABELS[role.name] ?? role.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {SYSTEM_ROLE_DESCRIPTIONS[role.name] ?? role.description ?? ''}
                          </p>
                        </div>
                        <Badge variant="secondary" className="shrink-0 text-xs">{permCount} permisos</Badge>
                      </div>
                      {canManage && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-auto"
                          onClick={() => {
                            setNewRoleTemplate(role.id)
                            setShowNewRole(true)
                          }}
                        >
                          <Copy className="mr-2 h-3.5 w-3.5" />
                          Usar como base
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Read-only matrix for system roles */}
          <PermissionMatrix
            roles={systemRoles}
            permissions={permissions}
            grantedSet={grantedSet}
            pendingChanges={emptyGranted}
            canEdit={false}
            onToggle={() => {}}
            onToggleModule={() => {}}
          />
        </TabsContent>

        {/* ── Tab: Custom roles ── */}
        <TabsContent value="custom" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Roles creados por tu organización con permisos personalizados.
            </p>
            {canManage && (
              <Button size="sm" onClick={() => { setNewRoleTemplate('none'); setShowNewRole(true) }}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo rol
              </Button>
            )}
          </div>

          <PermissionMatrix
            roles={customRoles}
            permissions={permissions}
            grantedSet={grantedSet}
            pendingChanges={pendingChanges}
            canEdit={canManage}
            onToggle={togglePermission}
            onToggleModule={toggleModule}
            onDeleteRole={setDeletingRoleId}
          />
        </TabsContent>
      </Tabs>

      {/* ── New Role Wizard Dialog ── */}
      <Dialog open={showNewRole} onOpenChange={(open) => { if (!open) resetNewRoleDialog() }}>
        <DialogContent className={newRoleStep === 2 ? 'max-w-2xl' : 'max-w-md'}>
          <DialogHeader>
            <DialogTitle>
              {newRoleStep === 1 ? 'Nuevo rol personalizado' : `Permisos para "${newRoleName}"`}
            </DialogTitle>
            <DialogDescription>
              {newRoleStep === 1
                ? 'Paso 1 de 2 — Nombre y plantilla de partida'
                : `Paso 2 de 2 — Ajusta los permisos granulares (${newRoleSelectedPerms.size} seleccionados)`}
            </DialogDescription>
          </DialogHeader>

          {/* ── Step 1: name + description + template ── */}
          {newRoleStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="role-name">Nombre *</Label>
                <Input
                  id="role-name"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="ej. Supervisor"
                />
              </div>
              <div>
                <Label htmlFor="role-desc">Descripción (opcional)</Label>
                <Textarea
                  id="role-desc"
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  placeholder="Describe las responsabilidades de este rol..."
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="role-template">Partir desde una plantilla</Label>
                <Select value={newRoleTemplate} onValueChange={setNewRoleTemplate}>
                  <SelectTrigger id="role-template">
                    <SelectValue placeholder="Sin plantilla (permisos vacíos)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin plantilla (permisos vacíos)</SelectItem>
                    <SelectGroup>
                      <SelectLabel>Plantillas rápidas</SelectLabel>
                      {PREDEFINED_TEMPLATES.map((tpl) => (
                        <SelectItem key={tpl.id} value={tpl.id}>
                          {tpl.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    {systemRoles.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Roles del sistema</SelectLabel>
                        {systemRoles.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {SYSTEM_ROLE_LABELS[r.name] ?? r.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    {customRoles.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Roles personalizados</SelectLabel>
                        {customRoles.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* ── Step 2: granular permission selector ── */}
          {newRoleStep === 2 && (
            <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-3">
              {[...localPermissionsByModule.entries()].map(([mod, modPerms]) => {
                const allOn = modPerms.every((p) => newRoleSelectedPerms.has(p.key))
                const someOn = modPerms.some((p) => newRoleSelectedPerms.has(p.key))
                return (
                  <Card key={mod} className="overflow-hidden">
                    <CardHeader className="py-2 px-4 bg-muted/40">
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                        <Checkbox
                          checked={allOn}
                          indeterminate={someOn && !allOn}
                          onCheckedChange={() => toggleNewModule(mod)}
                          id={`mod-${mod}`}
                        />
                        <label htmlFor={`mod-${mod}`} className="cursor-pointer flex items-center gap-1.5">
                          <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                          {mod}
                        </label>
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {modPerms.filter((p) => newRoleSelectedPerms.has(p.key)).length}/{modPerms.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-4">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                        {modPerms.map((perm) => (
                          <label
                            key={perm.key}
                            className="flex items-center gap-2 text-sm cursor-pointer"
                          >
                            <Checkbox
                              checked={newRoleSelectedPerms.has(perm.key)}
                              onCheckedChange={() => toggleNewPerm(perm.key)}
                            />
                            <span>{actionLabel(perm.action)}</span>
                            {newRoleSelectedPerms.has(perm.key) && (
                              <Check className="h-3 w-3 text-primary ml-auto" />
                            )}
                          </label>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          <DialogFooter className="gap-2">
            {newRoleStep === 1 ? (
              <>
                <Button variant="outline" onClick={resetNewRoleDialog}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleNewRoleNext}
                  disabled={!newRoleName.trim()}
                >
                  Siguiente
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setNewRoleStep(1)}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Atrás
                </Button>
                <Button
                  onClick={() => createRoleMutation.mutate()}
                  disabled={createRoleMutation.isPending}
                >
                  {createRoleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear rol ({newRoleSelectedPerms.size} permisos)
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Role Confirm Dialog ── */}
      <Dialog open={!!deletingRoleId} onOpenChange={(open) => !open && setDeletingRoleId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar rol</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Estás seguro de que deseas eliminar este rol? Se revocarán todos los permisos asociados y
            los miembros asignados a este rol perderán sus permisos.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingRoleId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingRoleId && deleteRoleMutation.mutate(deletingRoleId)}
              disabled={deleteRoleMutation.isPending}
            >
              {deleteRoleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
