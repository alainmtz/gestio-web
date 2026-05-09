import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Loader2, ShoppingCart, Undo, DollarSign, FileText } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/lib/toast'
import { supabase } from '@/lib/supabase'
import { createMovement } from '@/api/products'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'

interface ConsignmentStockRow {
  id: string
  organization_id: string
  store_id: string
  product_id: string
  partner_id: string
  partner_type: 'CUSTOMER' | 'SUPPLIER'
  customer_id?: string | null
  supplier_id?: string | null
  quantity_sent: number
  quantity_sold: number
  quantity_returned: number
  commission_rate: number
  status: string
  sent_date: string
  notes?: string
  product?: { name: string; sku: string }
  customer?: { name: string } | null
  supplier?: { name: string } | null
  store?: { name: string }
}

interface ConsignmentMovement {
  id: string
  type: string
  quantity: number
  user_id?: string
  created_at: string
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'success' }> = {
  ACTIVE:    { label: 'Activa',     variant: 'default' },
  PARTIAL:   { label: 'Parcial',    variant: 'secondary' },
  COMPLETED: { label: 'Completada', variant: 'success' },
  CANCELLED: { label: 'Cancelada',  variant: 'destructive' },
  LIQUIDATED:{ label: 'Liquidada',  variant: 'success' },
}

const movementTypeLabels: Record<string, string> = {
  SALE: 'Venta',
  RETURN: 'Devolución',
  LIQUIDATION: 'Liquidación',
  CANCELLATION: 'Cancelación',
}

export function ConsignmentDetailPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { hasPermission } = usePermissions()

  const [showSaleDialog, setShowSaleDialog] = useState(false)
  const [saleQuantity, setSaleQuantity] = useState('')
  const [showReturnDialog, setShowReturnDialog] = useState(false)
  const [returnQuantity, setReturnQuantity] = useState('')
  const [showLiquidateDialog, setShowLiquidateDialog] = useState(false)
  const [liquidatePurchaseQty, setLiquidatePurchaseQty] = useState(0)

  const { data: row, isLoading } = useQuery({
    queryKey: ['consignment_stock', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consignment_stock')
        .select(`
          *,
          product:products(name, sku),
          customer:customers(name),
          supplier:suppliers(name),
          store:stores(name)
        `)
        .eq('id', id)
        .single()
      if (error) throw error
      return data as ConsignmentStockRow
    },
    enabled: !!id,
  })

  const { data: movements } = useQuery({
    queryKey: ['consignment_movements', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consignment_movements')
        .select('*')
        .eq('consignment_stock_id', id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data || []) as ConsignmentMovement[]
    },
    enabled: !!id,
  })

  const registerSaleMutation = useMutation({
    mutationFn: async (qty: number) => {
      const newSold = (row!.quantity_sold || 0) + qty
      const available = (row!.quantity_sent || 0) - (row!.quantity_sold || 0) - (row!.quantity_returned || 0)
      
      let newStatus = row!.status
      if (newSold >= (row!.quantity_sent || 0) - (row!.quantity_returned || 0)) {
        newStatus = 'COMPLETED'
      } else if (newSold > 0) {
        newStatus = 'PARTIAL'
      }

      const { error } = await supabase
        .from('consignment_stock')
        .update({ quantity_sold: newSold, status: newStatus })
        .eq('id', id)
      if (error) throw error

      await supabase.from('consignment_movements').insert({
        consignment_stock_id: id,
        organization_id: row!.organization_id,
        type: 'SALE',
        product_id: row!.product_id,
        quantity: qty,
        user_id: useAuthStore.getState().user?.id,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consignment_stock', id] })
      queryClient.invalidateQueries({ queryKey: ['consignments'] })
      queryClient.invalidateQueries({ queryKey: ['consignment_movements', id] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      toast({ title: 'Venta registrada', variant: 'default' })
      setShowSaleDialog(false)
      setSaleQuantity('')
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const registerReturnMutation = useMutation({
    mutationFn: async (qty: number) => {
      const newReturned = (row!.quantity_returned || 0) + qty
      const newSold = row!.quantity_sold || 0
      const total = row!.quantity_sent || 0
      
      let newStatus = row!.status
      if (newReturned + newSold >= total) {
        newStatus = 'COMPLETED'
      }

      const { error } = await supabase
        .from('consignment_stock')
        .update({ quantity_returned: newReturned, status: newStatus })
        .eq('id', id)
      if (error) throw error

      await supabase.from('consignment_movements').insert({
        consignment_stock_id: id,
        organization_id: row!.organization_id,
        type: 'RETURN',
        product_id: row!.product_id,
        quantity: qty,
        user_id: useAuthStore.getState().user?.id,
      })

      const currentUserId = useAuthStore.getState().user?.id
      if (currentUserId) {
        try {
          await createMovement(row!.organization_id, currentUserId, {
            product_id: row!.product_id,
            store_id: row!.store_id,
            movement_type: 'RETURN',
            quantity: qty,
            notes: 'Devolución de consignación',
          })
        } catch {
          console.warn('return registered but inventory sync failed')
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consignment_stock', id] })
      queryClient.invalidateQueries({ queryKey: ['consignments'] })
      queryClient.invalidateQueries({ queryKey: ['consignment_movements', id] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      toast({ title: 'Devolución registrada', variant: 'default' })
      setShowReturnDialog(false)
      setReturnQuantity('')
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const liquidateMutation = useMutation({
    mutationFn: async () => {
      if (!row) return

      const total = row.quantity_sent || 0
      const sold = row.quantity_sold || 0
      const returned = row.quantity_returned || 0
      const pending = total - sold - returned

      const currentUserId = useAuthStore.getState().user?.id

      if (pending > 0) {
        const isSupplier = row.partner_type === 'SUPPLIER'
        const toPurchase = isSupplier ? Math.min(liquidatePurchaseQty, pending) : 0
        const toReturn = pending - toPurchase
        const newReturned = returned + toReturn

        if (toReturn > 0) {
          const { error: updateError } = await supabase
            .from('consignment_stock')
            .update({ quantity_returned: newReturned, status: 'LIQUIDATED' })
            .eq('id', id)
          if (updateError) throw updateError

          if (currentUserId) {
            try {
              await createMovement(row.organization_id, currentUserId, {
                product_id: row.product_id,
                store_id: row.store_id,
                movement_type: 'RETURN',
                quantity: toReturn,
                notes: 'Devolución por liquidación de consignación',
              })
            } catch {
              console.warn('liquidation return inventory sync failed')
            }
          }
        } else {
          const { error } = await supabase
            .from('consignment_stock')
            .update({ status: 'LIQUIDATED' })
            .eq('id', id)
          if (error) throw error
        }

        if (toPurchase > 0 && currentUserId) {
          try {
            await createMovement(row.organization_id, currentUserId, {
              product_id: row.product_id,
              store_id: row.store_id,
              movement_type: 'CONSIGNMENT_IN',
              quantity: toPurchase,
              reference_type: 'consignment',
              reference_id: id,
              notes: 'Compra de stock pendiente por liquidación',
            })
          } catch {
            console.warn('consignment_in purchase failed during liquidation')
          }
        }
      } else {
        const { error } = await supabase
          .from('consignment_stock')
          .update({ status: 'LIQUIDATED' })
          .eq('id', id)
        if (error) throw error
      }

      await supabase.from('consignment_movements').insert({
        consignment_stock_id: id,
        organization_id: row.organization_id,
        type: 'LIQUIDATION',
        product_id: row.product_id,
        quantity: sold,
        user_id: currentUserId,
      })

      if (currentUserId && row.partner_type === 'SUPPLIER' && sold > 0) {
        try {
          await createMovement(row.organization_id, currentUserId, {
            product_id: row.product_id,
            store_id: row.store_id,
            movement_type: 'CONSIGNMENT_IN',
            quantity: sold,
            reference_type: 'consignment',
            reference_id: id,
            notes: 'Reconocimiento de stock por liquidación de consignación',
          })
        } catch {
          console.warn('consignment_in movement failed during liquidation')
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consignment_stock', id] })
      queryClient.invalidateQueries({ queryKey: ['consignments'] })
      queryClient.invalidateQueries({ queryKey: ['consignment_movements', id] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      toast({ title: 'Consignación liquidada', variant: 'default' })
      setShowLiquidateDialog(false)
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!row) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/consignments/list">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <h1 className="text-3xl font-bold">Consignación no encontrada</h1>
        </div>
      </div>
    )
  }

  const available = (row.quantity_sent || 0) - (row.quantity_sold || 0) - (row.quantity_returned || 0)
  const status = statusLabels[row.status] || { label: row.status, variant: 'secondary' as const }
  const isCompleted = ['COMPLETED', 'LIQUIDATED', 'CANCELLED'].includes(row.status)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/consignments/list">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {row.product?.name || 'Consignación'}
            </h1>
            <p className="text-muted-foreground">
              {row.customer?.name || row.supplier?.name || row.partner_id} · {row.store?.name} · {row.sent_date}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {hasPermission(PERMISSIONS.CONSIGNMENT_EDIT) && !isCompleted && (
            <>
              <Button variant="outline" onClick={() => setShowReturnDialog(true)}>
                <Undo className="mr-2 h-4 w-4" />
                Registrar Devolución
              </Button>
              <Button onClick={() => setShowSaleDialog(true)}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Registrar Venta
              </Button>
            </>
          )}
          {hasPermission(PERMISSIONS.CONSIGNMENT_LIQUIDATE) && !isCompleted && (
            <Button variant="secondary" onClick={() => setShowLiquidateDialog(true)}>
              <DollarSign className="mr-2 h-4 w-4" />
              Liquidar
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Enviado</div>
            <div className="text-2xl font-bold">{row.quantity_sent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Vendido</div>
            <div className="text-2xl font-bold text-green-600">{row.quantity_sold}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Devuelto</div>
            <div className="text-2xl font-bold text-orange-600">{row.quantity_returned}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Disponible</div>
            <div className="text-2xl font-bold text-blue-600">{available}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Comisión</div>
            <div className="text-2xl font-bold">{row.commission_rate}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Detalles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Producto</span>
              <span>{row.product?.name} ({row.product?.sku})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tipo</span>
              <span>{row.partner_type === 'CUSTOMER' ? 'Cliente' : 'Proveedor'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tienda</span>
              <span>{row.store?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estado</span>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            {row.notes && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Notas</span>
                <span>{row.notes}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Historial de Movimientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {movements && movements.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {movementTypeLabels[m.type] || m.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{m.quantity}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(m.created_at).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay movimientos registrados
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sale Dialog */}
      <Dialog open={showSaleDialog} onOpenChange={setShowSaleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Venta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Disponible para vender: <span className="font-medium text-green-600">{available} uds</span>
            </div>
            <div className="space-y-2">
              <Label>Cantidad</Label>
              <Input
                type="number"
                min={1}
                max={available}
                value={saleQuantity}
                onChange={(e) => setSaleQuantity(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaleDialog(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                const qty = parseInt(saleQuantity)
                if (qty > 0 && qty <= available) registerSaleMutation.mutate(qty)
              }}
              disabled={!saleQuantity || parseInt(saleQuantity) <= 0 || parseInt(saleQuantity) > available || registerSaleMutation.isPending}
            >
              {registerSaleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Venta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Devolución</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Disponible para devolver: <span className="font-medium text-orange-600">{available} uds</span>
            </div>
            <div className="space-y-2">
              <Label>Cantidad</Label>
              <Input
                type="number"
                min={1}
                max={available}
                value={returnQuantity}
                onChange={(e) => setReturnQuantity(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReturnDialog(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                const qty = parseInt(returnQuantity)
                if (qty > 0 && qty <= available) registerReturnMutation.mutate(qty)
              }}
              disabled={!returnQuantity || parseInt(returnQuantity) <= 0 || parseInt(returnQuantity) > available || registerReturnMutation.isPending}
            >
              {registerReturnMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Devolución
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Liquidate Dialog */}
      <Dialog open={showLiquidateDialog} onOpenChange={(open) => {
        setShowLiquidateDialog(open)
        if (open) setLiquidatePurchaseQty(0)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Liquidar Consignación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Esta acción finalizará la consignación. Los artículos no vendidos pueden devolverse al socio o comprarse para la tienda.
            </p>
            <div className="rounded-lg border p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total enviado:</span>
                <span className="font-medium">{row.quantity_sent} uds</span>
              </div>
              <div className="flex justify-between">
                <span>Vendido:</span>
                <span className="font-medium text-green-600">{row.quantity_sold} uds</span>
              </div>
              <div className="flex justify-between">
                <span>Devuelto:</span>
                <span className="font-medium text-orange-600">{row.quantity_returned} uds</span>
              </div>
              <div className="flex justify-between">
                <span>Comisión:</span>
                <span className="font-medium">{row.commission_rate}%</span>
              </div>
              {available > 0 && (
                <>
                  <div className="border-t pt-2 flex justify-between text-amber-600 font-medium">
                    <span>Pendiente:</span>
                    <span>{available} uds</span>
                  </div>
                  {row.partner_type === 'SUPPLIER' && (
                    <div className="space-y-2 pt-2 border-t">
                      <Label className="text-xs">Comprar para la tienda (resto se devuelve)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={available}
                        value={liquidatePurchaseQty}
                        onChange={(e) => setLiquidatePurchaseQty(Math.min(parseInt(e.target.value) || 0, available))}
                      />
                      <p className="text-xs text-muted-foreground">
                        {liquidatePurchaseQty > 0
                          ? `${liquidatePurchaseQty} uds → inventario · ${available - liquidatePurchaseQty} uds → devolución`
                          : 'Todas las unidades pendientes se devolverán'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLiquidateDialog(false)}>Cancelar</Button>
            <Button
              variant="secondary"
              onClick={() => liquidateMutation.mutate()}
              disabled={liquidateMutation.isPending}
            >
              {liquidateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Liquidación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
