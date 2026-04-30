import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useMovements, useCreateMovement, useUpdateMovement } from '@/hooks/useProducts'
import { useOrganization } from '@/hooks/useOrganization'
import { useStores } from '@/hooks/useStores'
import { useSuppliers } from '@/hooks/useSuppliers'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ArrowLeftRight, Search, Plus, Package, ChevronLeft, ChevronRight, Edit, Store, Calendar } from 'lucide-react'
import { useToast } from '@/lib/toast'
import { showErrorToast } from '@/lib/errorToast'
import type { MovementType, CreateMovementInput, InventoryMovement } from '@/api/products'
import { Skeleton } from '@/components/ui/skeleton'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'

const MOVEMENT_TYPES: { value: MovementType; label: string }[] = [
  { value: 'PURCHASE', label: 'Compra' },
  { value: 'SALE', label: 'Venta' },
  { value: 'ADJUSTMENT', label: 'Ajuste' },
  { value: 'TRANSFER_IN', label: 'Transferencia Entrada' },
  { value: 'TRANSFER_OUT', label: 'Transferencia Salida' },
  { value: 'RETURN', label: 'Devolución' },
  { value: 'DAMAGE', label: 'Daño' },
  { value: 'CONSIGNMENT_IN', label: 'Consignación Entrada' },
  { value: 'CONSIGNMENT_OUT', label: 'Consignación Salida' },
  { value: 'OPENING', label: 'Apertura' },
]

const typeColors: Record<MovementType, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  SALE: 'destructive',
  PURCHASE: 'default',
  ADJUSTMENT: 'secondary',
  TRANSFER_IN: 'default',
  TRANSFER_OUT: 'secondary',
  RETURN: 'outline',
  DAMAGE: 'destructive',
  CONSIGNMENT_IN: 'default',
  CONSIGNMENT_OUT: 'secondary',
  OPENING: 'secondary',
}

export function MovementsPage() {
  const [search, setSearch] = useState('')
  const [movementType, setMovementType] = useState<string>('all')
  const [storeId, setStoreId] = useState<string>('all')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingMovement, setEditingMovement] = useState<InventoryMovement | null>(null)
  const [editForm, setEditForm] = useState({ movement_type: '' as MovementType, quantity: 0, cost: 0, notes: '', store_id: '', reference_type: '', reference_id: '' })
  const [productSearch, setProductSearch] = useState('')
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    storeId: '',
    sourceStoreId: '',
    movementType: '' as MovementType,
    quantity: 0,
    cost: 0,
    notes: '',
  })

  const { currentStore } = useOrganization()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const userId = useAuthStore((state) => state.user?.id)
  const { data: stores } = useStores()
  const { data: suppliersData } = useSuppliers()
  const { hasPermission } = usePermissions()
  
  const movementTypeFilter = movementType && movementType !== 'all' ? movementType as MovementType : undefined
  const storeIdFilter = storeId && storeId !== 'all' ? storeId : undefined
  
  const { data, isLoading } = useMovements({
    storeId: storeIdFilter,
    movementType: movementTypeFilter,
    page,
    pageSize: PAGE_SIZE,
  })
  
  const createMovement = useCreateMovement()
  const updateMovement = useUpdateMovement()
  const { toast } = useToast()

  // Fetch products for the dialog with search
  const { data: products } = useQuery({
    queryKey: ['productsForMovement', organizationId, productSearch],
    queryFn: async () => {
      if (!organizationId) return []
      let query = supabase
        .from('products')
        .select('id, name, sku, price, cost')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name')
        .limit(50)

      if (productSearch) {
        query = query.or(`name.ilike.%${productSearch}%,sku.ilike.%${productSearch}%`)
      }

      const { data } = await query
      return data || []
    },
    enabled: !!organizationId && dialogOpen,
  })

  // Función para seleccionar producto y cargar costo
  const selectProduct = async (product: any) => {
    setFormData({
      ...formData,
      productId: product.id,
      productName: product.name,
      cost: product.cost || product.price || 0,
    })
    setProductSearch(product.name)
    
    // Cargar inventario actual del producto en la tienda destino
    if (formData.storeId) {
      const { data: inventory } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('product_id', product.id)
        .eq('store_id', formData.storeId)
        .maybeSingle()
      
      if (inventory) {
        toast({ 
          title: `Stock actual: ${inventory.quantity}`, 
          description: `Producto: ${product.name}`,
          variant: 'default'
        })
      }
    }
  }

  // Función para cargar tiendas de origen (todas excepto el destino)
  const sourceStores = stores?.filter(s => s.id !== formData.storeId) || []

  const movements = data?.movements || []

  const filteredMovements = search
    ? movements.filter(
        (m) =>
          m.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
          m.product?.sku?.toLowerCase().includes(search.toLowerCase())
      )
    : movements

  const handleCreateMovement = async () => {
    if (!formData.productId || !formData.storeId || !formData.movementType || !formData.quantity) {
      toast({ title: 'Error', description: 'Completa todos los campos requeridos', variant: 'destructive' })
      return
    }

    try {
      const input: CreateMovementInput = {
        product_id: formData.productId,
        store_id: formData.storeId,
        source_store_id: formData.sourceStoreId || undefined,
        movement_type: formData.movementType,
        quantity: formData.quantity,
        cost: formData.cost || undefined,
        notes: formData.notes || undefined,
      }
      await createMovement.mutateAsync(input)
      setDialogOpen(false)
      setFormData({
        productId: '',
        productName: '',
        storeId: '',
        sourceStoreId: '',
        movementType: '' as MovementType,
        quantity: 0,
        cost: 0,
        notes: '',
      })
      setProductSearch('')
      toast({ title: 'Movimiento registrado', description: 'El movimiento de inventario se ha registrado correctamente.' })
    } catch (error) {
      showErrorToast(toast, error, 'No se pudo registrar el movimiento.')
    }
  }

  const openEditDialog = (movement: InventoryMovement) => {
    setEditingMovement(movement)
    setEditForm({
      movement_type: movement.movement_type,
      quantity: movement.quantity,
      cost: movement.cost ?? 0,
      notes: movement.notes ?? '',
      store_id: movement.store_id ?? '',
      reference_type: movement.reference_type ?? '',
      reference_id: movement.reference_id ?? '',
    })
    setEditDialogOpen(true)
  }

  const handleUpdateMovement = async () => {
    if (!editingMovement) return
    try {
      await updateMovement.mutateAsync({
        id: editingMovement.id,
        input: {
          movement_type: editForm.movement_type,
          quantity: editForm.quantity,
          cost: editForm.cost || undefined,
          notes: editForm.notes || undefined,
          store_id: editForm.store_id !== editingMovement.store_id ? editForm.store_id : undefined,
          reference_type: editForm.reference_type || undefined,
          reference_id: editForm.reference_id || undefined,
          userId: userId ?? undefined,
          organizationId: organizationId ?? undefined,
        },
      })
      setEditDialogOpen(false)
      setEditingMovement(null)
      toast({ title: 'Movimiento actualizado', description: 'Los cambios se guardaron correctamente.' })
    } catch (error) {
      showErrorToast(toast, error, 'No se pudo actualizar el movimiento.')
    }
  }

  const openDialog = () => {
    setFormData({
      productId: '',
      productName: '',
      storeId: currentStore?.id || '',
      sourceStoreId: '',
      movementType: '' as MovementType,
      quantity: 0,
      cost: 0,
      notes: '',
    })
    setProductSearch('')
    setDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-muted animate-pulse rounded" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Movimientos de Stock</h1>
          <p className="text-muted-foreground">Historial de movimientos de inventario</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          {hasPermission(PERMISSIONS.INVENTORY_ADJUST) && (
            <DialogTrigger asChild>
              <Button onClick={openDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Movimiento
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Registrar Movimiento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tipo de Movimiento *</Label>
                <Select
                  value={formData.movementType}
                  onValueChange={(v) => setFormData({ ...formData, movementType: v as MovementType })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOVEMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Producto *</Label>
                <Input
                  placeholder="Buscar producto..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
                <div className="max-h-40 overflow-y-auto border rounded-md">
                  {products?.map((product) => (
                    <div
                      key={product.id}
                      className={`p-2 cursor-pointer hover:bg-muted ${formData.productId === product.id ? 'bg-muted' : ''}`}
                      onClick={() => selectProduct(product)}
                    >
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">SKU: {product.sku} - Costo: ${product.cost || 0}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tienda Destino *</Label>
                <Select
                  value={formData.storeId}
                  onValueChange={(v) => setFormData({ ...formData, storeId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tienda" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores?.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {['TRANSFER_IN', 'TRANSFER_OUT', 'CONSIGNMENT_IN', 'CONSIGNMENT_OUT'].includes(formData.movementType) && (
                <div className="space-y-2">
                  <Label>Tienda Origen *</Label>
                  <Select
                    value={formData.sourceStoreId}
                    onValueChange={(v) => setFormData({ ...formData, sourceStoreId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tienda origen" />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceStores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cantidad *</Label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Costo (opcional)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) =>
                      setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notas</Label>
                <Input
                  placeholder="Notas adicionales"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <Button className="w-full" onClick={handleCreateMovement}>
                Registrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por producto..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Select value={movementType} onValueChange={(v) => { setMovementType(v); setPage(1) }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {MOVEMENT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={storeId} onValueChange={(v) => { setStoreId(v); setPage(1) }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todas las tiendas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las tiendas</SelectItem>
            {stores?.map((store) => (
              <SelectItem key={store.id} value={store.id}>
                {store.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Registro de Movimientos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredMovements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay movimientos registrados
              </div>
            ) : (
              filteredMovements.map((movement) => (
                <div key={movement.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`rounded-full p-2 ${movement.quantity > 0 ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                      <ArrowLeftRight className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant={typeColors[movement.movement_type] || 'outline'}>
                          {MOVEMENT_TYPES.find((t) => t.value === movement.movement_type)?.label || movement.movement_type}
                        </Badge>
                        <span className={`font-medium ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1"><Package className="h-3 w-3" />{movement.product?.name || 'Producto'}</span>
                        <span className="flex items-center gap-1"><Store className="h-3 w-3" />{movement.store?.name || '-'}</span>
                        {movement.cost != null && <span>${movement.cost.toFixed(2)}</span>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(movement.created_at).toLocaleString('es-ES')}</span>
                        {movement.user?.full_name && <span>{movement.user.full_name}</span>}
                        {movement.notes && <span className="truncate max-w-[200px]">{movement.notes}</span>}
                      </div>
                    </div>
                  </div>
                  {hasPermission(PERMISSIONS.INVENTORY_ADJUST) && (
                    <Button variant="ghost" size="icon" className="shrink-0" onClick={() => openEditDialog(movement)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
          {data && data.total > PAGE_SIZE && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, data.total)} de {data.total}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * PAGE_SIZE >= data.total}>
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Movement Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Editar Movimiento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Tipo de movimiento — siempre visible */}
            <div className="space-y-2">
              <Label>Tipo de Movimiento</Label>
              <Select
                value={editForm.movement_type}
                onValueChange={(v) => setEditForm({ ...editForm, movement_type: v as MovementType, reference_type: '', reference_id: '' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOVEMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Proveedor — solo para TRANSFER_IN */}
            {editForm.movement_type === 'TRANSFER_IN' && (
              <div className="space-y-2">
                <Label>Proveedor (origen)</Label>
                <Select
                  value={editForm.reference_type === 'supplier' ? editForm.reference_id : ''}
                  onValueChange={(v) => setEditForm({ ...editForm, reference_type: v ? 'supplier' : '', reference_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proveedor (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">— Sin proveedor —</SelectItem>
                    {suppliersData?.suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Tienda origen — para TRANSFER_IN y CONSIGNMENT_IN */}
            {(editForm.movement_type === 'TRANSFER_IN' || editForm.movement_type === 'CONSIGNMENT_IN') && (
              <div className="space-y-2">
                <Label>
                  {editForm.movement_type === 'TRANSFER_IN' ? 'Tienda / Almacén origen' : 'Tienda en consignación'}
                </Label>
                <Select
                  value={editForm.reference_type === 'store' ? editForm.reference_id : ''}
                  onValueChange={(v) => setEditForm({ ...editForm, reference_type: v ? 'store' : editForm.reference_type, reference_id: v || editForm.reference_id })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tienda origen (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">— Sin tienda origen —</SelectItem>
                    {stores?.filter(s => s.id !== editForm.store_id).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.store_type === 'warehouse' ? 'Almacén' : 'Tienda'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Tienda destino — siempre visible */}
            <div className="space-y-2">
              <Label>Tienda destino</Label>
              <Select
                value={editForm.store_id}
                onValueChange={(v) => setEditForm({ ...editForm, store_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tienda" />
                </SelectTrigger>
                <SelectContent>
                  {stores?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.store_type === 'warehouse' ? 'Almacén' : 'Tienda'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editingMovement && editForm.store_id !== editingMovement.store_id && editForm.store_id !== '' && (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                  <strong>Advertencia:</strong> Cambiar la tienda moverá el inventario desde la tienda original
                  a la tienda seleccionada. Esta acción quedará registrada en el historial de auditoría.
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  value={editForm.quantity}
                  onChange={(e) => setEditForm({ ...editForm, quantity: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Costo</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.cost}
                  onChange={(e) => setEditForm({ ...editForm, cost: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Input
                placeholder="Notas adicionales"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleUpdateMovement} disabled={updateMovement.isPending}>
                {updateMovement.isPending ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}