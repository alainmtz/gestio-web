import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  DialogFooter,
} from '@/components/ui/dialog'
import { ArrowLeftRight, Plus, Eye, Loader2, Search, Store, Package, Calendar } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/lib/toast'
import { supabase } from '@/lib/supabase'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'
import { createMovement } from '@/api/products'

interface Transfer {
  id: string
  organization_id: string
  from_store_id: string
  to_store_id: string
  product_id: string
  variant_id?: string
  quantity: number
  status: 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED'
  notes?: string
  created_by?: string
  created_at: string
  from_store?: { name: string }
  to_store?: { name: string }
  product?: { name: string; sku: string }
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' }> = {
  PENDING:    { label: 'Pendiente',   variant: 'default' },
  IN_TRANSIT: { label: 'En Tránsito', variant: 'secondary' },
  COMPLETED:  { label: 'Completada',  variant: 'success' },
  CANCELLED:  { label: 'Cancelada',   variant: 'destructive' },
}

export function TransfersPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const userId = useAuthStore((state) => state.user?.id)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [fromStoreId, setFromStoreId] = useState('')
  const [toStoreId, setToStoreId] = useState('')
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState(0)
  const [notes, setNotes] = useState('')

  const { data: storesData } = useQuery({
    queryKey: ['stores', organizationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('stores')
        .select('id, name')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name')
      return data || []
    },
    enabled: !!organizationId,
  })

  const { data: productsData } = useQuery({
    queryKey: ['products', organizationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, sku')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name')
      return data || []
    },
    enabled: !!organizationId,
  })

  const { data: transfersData, isLoading } = useQuery({
    queryKey: ['transfers', organizationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('inventory_transfers')
        .select(`
          *,
          from_store:stores!inventory_transfers_from_store_id_fkey(name),
          to_store:stores!inventory_transfers_to_store_id_fkey(name),
          product:products(name, sku)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
      return (data || []) as Transfer[]
    },
    enabled: !!organizationId,
  })

  const filteredTransfers = (transfersData || []).filter((t) => {
    if (statusFilter && t.status !== statusFilter) return false
    if (search) {
      const s = search.toLowerCase()
      return (
        t.product?.name?.toLowerCase().includes(s) ||
        t.from_store?.name?.toLowerCase().includes(s) ||
        t.to_store?.name?.toLowerCase().includes(s)
      )
    }
    return true
  })

  const createTransferMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId || !userId) throw new Error('No organization or user')

      const { data, error } = await supabase
        .from('inventory_transfers')
        .insert({
          organization_id: organizationId,
          from_store_id: fromStoreId,
          to_store_id: toStoreId,
          product_id: productId,
          quantity,
          status: 'PENDING',
          notes: notes || null,
          created_by: userId,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] })
      toast({ title: 'Transferencia creada', description: 'La transferencia está pendiente de confirmación' })
      setDialogOpen(false)
      resetForm()
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const updateTransferStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('inventory_transfers')
        .update({ status })
        .eq('id', id)
      if (error) throw error

      if (status === 'COMPLETED') {
        const { data: transfer } = await supabase
          .from('inventory_transfers')
          .select('*, product:products(*)')
          .eq('id', id)
          .single()

        if (transfer) {
          await supabase.from('inventory_movements').insert({
            organization_id: transfer.organization_id,
            store_id: transfer.from_store_id,
            product_id: transfer.product_id,
            movement_type: 'TRANSFER_OUT',
            quantity: -transfer.quantity,
            notes: `Transferencia ${id.slice(0, 8)}: ${transfer.from_store?.name} → ${transfer.to_store?.name}`,
            user_id: userId,
          })

          await supabase.from('inventory_movements').insert({
            organization_id: transfer.organization_id,
            store_id: transfer.to_store_id,
            product_id: transfer.product_id,
            movement_type: 'TRANSFER_IN',
            quantity: transfer.quantity,
            notes: `Transferencia ${id.slice(0, 8)}: ${transfer.from_store?.name} → ${transfer.to_store?.name}`,
            user_id: userId,
          })
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast({ title: 'Transferencia actualizada', variant: 'default' })
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const resetForm = () => {
    setFromStoreId('')
    setToStoreId('')
    setProductId('')
    setQuantity(0)
    setNotes('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transferencias</h1>
          <p className="text-muted-foreground">Transferencias de stock entre tiendas</p>
        </div>
        {hasPermission(PERMISSIONS.MOVEMENT_CREATE) && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Transferencia
          </Button>
        )}
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar transferencia..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter || '_all'} onValueChange={(v) => setStatusFilter(v === '_all' ? '' : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todos</SelectItem>
            {Object.entries(statusLabels).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : filteredTransfers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ArrowLeftRight className="mx-auto h-12 w-12 mb-3 text-muted-foreground/50" />
              <p className="font-medium">No hay transferencias</p>
              <p className="text-sm mt-1">Crea una transferencia entre tiendas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransfers.map((t) => {
                const status = statusLabels[t.status] || { label: t.status, variant: 'secondary' as const }
                return (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="rounded-full bg-primary/10 p-2">
                        <ArrowLeftRight className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-sm"><Package className="h-3 w-3" />{t.product?.name}</span>
                          <span className="font-medium">{t.quantity}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1"><Store className="h-3 w-3" />{t.from_store?.name} → {t.to_store?.name}</span>
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(t.created_at).toLocaleDateString('es-ES')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={status.variant}>{status.label}</Badge>
                      {t.status === 'PENDING' && hasPermission(PERMISSIONS.MOVEMENT_CREATE) && (
                        <Button variant="ghost" size="sm" onClick={() => updateTransferStatusMutation.mutate({ id: t.id, status: 'IN_TRANSIT' })}>Enviar</Button>
                      )}
                      {t.status === 'IN_TRANSIT' && hasPermission(PERMISSIONS.MOVEMENT_CREATE) && (
                        <Button variant="ghost" size="sm" onClick={() => updateTransferStatusMutation.mutate({ id: t.id, status: 'COMPLETED' })}>Recibir</Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Transferencia</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tienda de Origen *</Label>
              <Select value={fromStoreId} onValueChange={setFromStoreId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tienda origen" />
                </SelectTrigger>
                <SelectContent>
                  {storesData?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tienda de Destino *</Label>
              <Select value={toStoreId} onValueChange={setToStoreId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tienda destino" />
                </SelectTrigger>
                <SelectContent>
                  {storesData?.filter((s) => s.id !== fromStoreId).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Producto *</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {productsData?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cantidad *</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas opcionales" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => createTransferMutation.mutate()}
              disabled={!fromStoreId || !toStoreId || !productId || quantity <= 0 || createTransferMutation.isPending}
            >
              {createTransferMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Transferencia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
