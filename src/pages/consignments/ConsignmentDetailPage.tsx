import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, ShoppingCart, Undo } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/lib/toast'
import { supabase } from '@/lib/supabase'
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

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  ACTIVE:    { label: 'Activa',     variant: 'default' },
  PARTIAL:   { label: 'Parcial',    variant: 'secondary' },
  COMPLETED: { label: 'Completada', variant: 'secondary' },
  CANCELLED: { label: 'Cancelada',  variant: 'destructive' },
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

  const registerSaleMutation = useMutation({
    mutationFn: async (qty: number) => {
      const newSold = (row!.quantity_sold || 0) + qty
      const { error } = await supabase
        .from('consignment_stock')
        .update({ quantity_sold: newSold })
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
      const { error } = await supabase
        .from('consignment_stock')
        .update({ quantity_returned: newReturned })
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consignment_stock', id] })
      queryClient.invalidateQueries({ queryKey: ['consignments'] })
      toast({ title: 'Devolución registrada', variant: 'default' })
      setShowReturnDialog(false)
      setReturnQuantity('')
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
          {hasPermission(PERMISSIONS.CONSIGNMENT_EDIT) && (
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
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Enviado</div>
            <div className="text-2xl font-bold">{row.quantity_sent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Vendido</div>
            <div className="text-2xl font-bold">{row.quantity_sold}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Devuelto</div>
            <div className="text-2xl font-bold">{row.quantity_returned}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Disponible</div>
            <div className="text-2xl font-bold">{available}</div>
          </CardContent>
        </Card>
      </div>

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
            <span className="text-muted-foreground">Comisión</span>
            <span>{row.commission_rate}%</span>
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

      {showSaleDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-[360px] space-y-4">
            <h2 className="text-xl font-bold">Registrar Venta</h2>
            <p className="text-sm text-muted-foreground">Disponible: {available}</p>
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
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSaleDialog(false)}>Cancelar</Button>
              <Button
                onClick={() => registerSaleMutation.mutate(parseInt(saleQuantity))}
                disabled={!saleQuantity || parseInt(saleQuantity) <= 0 || parseInt(saleQuantity) > available || registerSaleMutation.isPending}
              >
                {registerSaleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {showReturnDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-[360px] space-y-4">
            <h2 className="text-xl font-bold">Registrar Devolución</h2>
            <p className="text-sm text-muted-foreground">Disponible: {available}</p>
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
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowReturnDialog(false)}>Cancelar</Button>
              <Button
                onClick={() => registerReturnMutation.mutate(parseInt(returnQuantity))}
                disabled={!returnQuantity || parseInt(returnQuantity) <= 0 || parseInt(returnQuantity) > available || registerReturnMutation.isPending}
              >
                {registerReturnMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
