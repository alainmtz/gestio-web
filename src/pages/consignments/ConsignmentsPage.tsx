import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, ClipboardList, ArrowUpRight, ArrowDownLeft, Eye, Loader2, AlertTriangle, Store, Package } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/lib/toast'
import { supabase } from '@/lib/supabase'
import { useStores } from '@/hooks/useStores'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'

interface Consignment {
  id: string
  organization_id: string
  store_id: string
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
  created_at: string
  customer?: { name: string } | null
  supplier?: { name: string } | null
  store?: { name: string }
  product?: { name: string }
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' }> = {
  ACTIVE: { label: 'Activa', variant: 'default' },
  PARTIAL: { label: 'Parcial', variant: 'secondary' },
  COMPLETED: { label: 'Completada', variant: 'success' },
  RETURNED: { label: 'Devuelta', variant: 'destructive' },
  LIQUIDATED: { label: 'Liquidada', variant: 'success' },
  CANCELLED: { label: 'Cancelada', variant: 'destructive' },
}

const deliveryStatusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' }> = {
  pending: { label: 'Pendiente', variant: 'default' },
  partial: { label: 'Parcial', variant: 'secondary' },
  received: { label: 'Recibida', variant: 'success' },
  rejected: { label: 'Rechazada', variant: 'destructive' },
}

export function ConsignmentsPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const { hasPermission } = usePermissions()
  const { data: storesData } = useStores()

  const [activeTab, setActiveTab] = useState('outbound')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'outbound' | 'inbound'>('outbound')
  
  // Form state
  const [selectedPartnerId, setSelectedPartnerId] = useState('')
  const [selectedStoreId, setSelectedStoreId] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantity, setQuantity] = useState(0)
  const [commissionRate, setCommissionRate] = useState(0)
  const [notes, setNotes] = useState('')
  const [selectedParentId, setSelectedParentId] = useState('')
  const [receivedQuantity, setReceivedQuantity] = useState(0)

  // Fetch consignments
  const { data: consignmentsData, isLoading } = useQuery({
    queryKey: ['consignments', organizationId],
    queryFn: async () => {
      if (!organizationId) return []
      const { data } = await supabase
        .from('consignment_stock')
        .select('*, customer:customers(name), supplier:suppliers(name), store:stores(name), product:products(name)')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
      return data || []
    },
    enabled: !!organizationId,
  })

  // Fetch customers for outbound partner selection
  const { data: customersData } = useQuery({
    queryKey: ['customers', organizationId],
    queryFn: async () => {
      if (!organizationId) return []
      const { data } = await supabase
        .from('customers')
        .select('id, name')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name')
      return data || []
    },
    enabled: !!organizationId,
  })

  // Fetch suppliers for inbound partner selection
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers', organizationId],
    queryFn: async () => {
      if (!organizationId) return []
      const { data } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name')
      return data || []
    },
    enabled: !!organizationId,
  })

  // Fetch products for selection
  const { data: productsData } = useQuery({
    queryKey: ['products', organizationId],
    queryFn: async () => {
      if (!organizationId) return []
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

  const consignments = consignmentsData || []
  
  // Filter by type
  const outboundConsignments = consignments.filter(c => c.partner_type === 'CUSTOMER')
  const inboundConsignments = consignments.filter(c => c.partner_type === 'SUPPLIER')

  // Get parent consignments available for reception (ACTIVE status)
  const parentConsignments = outboundConsignments.filter(c => c.status === 'ACTIVE')

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId) throw new Error('No organization')

      if (dialogType === 'outbound') {
        // Create outbound consignment (SENT)
        const { error } = await supabase
          .from('consignment_stock')
          .insert({
            organization_id: organizationId,
            store_id: selectedStoreId,
            product_id: selectedProductId,
            partner_id: selectedPartnerId,
            customer_id: selectedPartnerId,
            partner_type: 'CUSTOMER',
            quantity_sent: quantity,
            commission_rate: commissionRate,
            notes: notes || null,
            status: 'ACTIVE',
          })
        if (error) throw error
        toast({ title: 'Consignación de salida creada', description: 'La consignación se ha creado correctamente' })
      } else {
        // Create inbound consignment (RECEIVED)
        const parent = parentConsignments.find(c => c.id === selectedParentId)
        
        if (!parent) {
          toast({ title: 'Advertencia', description: 'No se seleccionó una consignación de origen', variant: 'default' })
        }

        // Calculate delivery status
        let deliveryStatus = 'pending'
        if (parent) {
          if (receivedQuantity === parent.quantity_sent) {
            deliveryStatus = 'received' // Auto-confirm if quantities match
          } else if (receivedQuantity > 0 && receivedQuantity < parent.quantity_sent) {
            deliveryStatus = 'partial'
          }
        }

        const { error } = await supabase
          .from('consignment_stock')
          .insert({
            organization_id: organizationId,
            store_id: selectedStoreId,
            product_id: selectedProductId,
            partner_id: selectedPartnerId,
            supplier_id: selectedPartnerId,
            partner_type: 'SUPPLIER',
            quantity_sent: receivedQuantity || quantity,
            commission_rate: commissionRate,
            notes: notes || null,
            status: deliveryStatus === 'received' ? 'COMPLETED' : 'PARTIAL',
          })
        if (error) throw error

        // Update parent if exists
        if (parent && receivedQuantity > 0) {
          const newDelivered = (parent.quantity_returned || 0) + receivedQuantity
          const newStatus = newDelivered >= parent.quantity_sent ? 'COMPLETED' : 'PARTIAL'
          await supabase
            .from('consignment_stock')
            .update({ 
              quantity_returned: newDelivered,
              status: newStatus 
            })
            .eq('id', parent.id)
        }

        const statusMsg = deliveryStatus === 'received' 
          ? 'Consignación recibida y confirmada automáticamente'
          : deliveryStatus === 'partial'
          ? 'Consignación parcialmente recibida'
          : 'Consignación creada'

        toast({ title: statusMsg, description: parent ? `Vinculada a: ${parent.id.slice(0,8)}...` : 'Sin consignación de origen' })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consignments'] })
      setDialogOpen(false)
      resetForm()
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const resetForm = () => {
    setSelectedPartnerId('')
    setSelectedStoreId('')
    setSelectedProductId('')
    setQuantity(0)
    setCommissionRate(0)
    setNotes('')
    setSelectedParentId('')
    setReceivedQuantity(0)
  }

  const openDialog = (type: 'outbound' | 'inbound') => {
    setDialogType(type)
    resetForm()
    setDialogOpen(true)
  }

  const handleParentSelect = (parentId: string) => {
    setSelectedParentId(parentId)
    const parent = parentConsignments.find(c => c.id === parentId)
    if (parent) {
      setSelectedPartnerId(parent.partner_id)
      setSelectedStoreId(parent.store_id)
      setSelectedProductId(parent.product_id)
      setQuantity(parent.quantity_sent)
      setReceivedQuantity(parent.quantity_sent) // Pre-fill with full quantity
    }
  }

  const renderOutboundCards = () => {
    return outboundConsignments.map(c => {
      const status = statusLabels[c.status] || { label: c.status, variant: 'secondary' }
      return (
        <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="rounded-full bg-primary/10 p-2">
              <ArrowUpRight className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-medium">{c.customer?.name || c.partner_id}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1"><Store className="h-3 w-3" />{c.store?.name || '-'}</span>
                <span className="flex items-center gap-1"><Package className="h-3 w-3" />{c.product?.name || '-'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs mt-1">
                <span>Enviado: {c.quantity_sent}</span>
                <span>Vendido: {c.quantity_sold}</span>
                <span>Devuelto: {c.quantity_returned}</span>
                <span>Comisión: {c.commission_rate}%</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={status.variant}>{status.label}</Badge>
            <Link to={`/consignments/${c.id}`}>
              <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      )
    })
  }

  const renderInboundCards = () => {
    return inboundConsignments.map(c => {
      const status = statusLabels[c.status] || { label: c.status, variant: 'secondary' }
      return (
        <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="rounded-full bg-primary/10 p-2">
              <ArrowDownLeft className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-medium">{c.supplier?.name || c.partner_id}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1"><Store className="h-3 w-3" />{c.store?.name || '-'}</span>
                <span className="flex items-center gap-1"><Package className="h-3 w-3" />{c.product?.name || '-'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs mt-1">
                <span>Recibido: {c.quantity_sent}</span>
                <span>Comisión: {c.commission_rate}%</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={status.variant}>{status.label}</Badge>
            <Link to={`/consignments/${c.id}`}>
              <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      )
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Consignaciones</h1>
          <p className="text-muted-foreground">Gestiona el stock en consignación</p>
        </div>
        <div className="flex gap-2">
          {hasPermission(PERMISSIONS.CONSIGNMENT_CREATE) && (
            <Button variant="outline" onClick={() => openDialog('inbound')}>
              <ArrowDownLeft className="mr-2 h-4 w-4" />
              Recepción
            </Button>
          )}
          {hasPermission(PERMISSIONS.CONSIGNMENT_CREATE) && (
            <Button onClick={() => openDialog('outbound')}>
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Envío
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="outbound" className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4" />
            Envíos ({outboundConsignments.length})
          </TabsTrigger>
          <TabsTrigger value="inbound" className="flex items-center gap-2">
            <ArrowDownLeft className="h-4 w-4" />
            Recepciones ({inboundConsignments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="outbound">
          <Card>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : outboundConsignments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No hay consignaciones de salida</div>
              ) : (
                <div className="space-y-3">
                  {renderOutboundCards()}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inbound">
          <Card>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : inboundConsignments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No hay consignaciones de entrada</div>
              ) : (
                <div className="space-y-3">
                  {renderInboundCards()}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'outbound' ? 'Nueva Consignación de Envío' : 'Nueva Recepción de Consignación'}
            </DialogTitle>
          </DialogHeader>
          
          {dialogType === 'inbound' && parentConsignments.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Selecciona una consignación de origen</span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {dialogType === 'inbound' && parentConsignments.length > 0 && (
              <div className="space-y-2">
                <Label>Consignación de Origen (Salida)</Label>
                <Select value={selectedParentId} onValueChange={handleParentSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar consignación de salida" />
                  </SelectTrigger>
                  <SelectContent>
                    {parentConsignments.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.customer?.name || c.supplier?.name} - {c.product?.name} - Cant: {c.quantity_sent}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>{dialogType === 'outbound' ? 'Cliente *' : 'Proveedor *'}</Label>
              <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {(dialogType === 'outbound' ? customersData : suppliersData)?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tienda *</Label>
              <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tienda" />
                </SelectTrigger>
                <SelectContent>
                  {storesData?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Producto *</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
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

            {dialogType === 'inbound' && selectedParentId && (
              <div className="space-y-2">
                <Label>Cantidad Recibida</Label>
                <Input
                  type="number"
                  value={receivedQuantity}
                  onChange={(e) => setReceivedQuantity(parseFloat(e.target.value) || 0)}
                />
                <p className="text-sm text-muted-foreground">
                  Cantidad original enviada: {quantity}
                </p>
              </div>
            )}

            {dialogType === 'outbound' && (
              <div className="space-y-2">
                <Label>Cantidad a Enviar</Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Comisión (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={commissionRate}
                onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
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
              onClick={() => createMutation.mutate()} 
              disabled={!selectedPartnerId || !selectedStoreId || !selectedProductId || createMutation.isPending}
            >
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {dialogType === 'outbound' ? 'Crear Envío' : 'Crear Recepción'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}