import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ArrowLeft, Save, Loader2, Plus, Trash2, DollarSign, Search, Package, Pencil, XCircle } from 'lucide-react'
import { invoiceSchema, type InvoiceFormData } from '@/schemas'
import { getInvoice, addInvoicePayment } from '@/api/billing'
import { getCustomers } from '@/api/customers'
import { getProducts } from '@/api/products'
import { useStores } from '@/hooks/useStores'
import { useCurrencies } from '@/hooks/useSettings'
import { useAssignTeamToInvoice, useInvoiceSchedule, useRemoveTeamFromInvoice } from '@/hooks/useSchedules'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/lib/toast'
import { supabase } from '@/lib/supabase'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'
import { useCreateInvoice, useUpdateInvoice, useCancelInvoice, useAddInvoicePayment } from '@/hooks/useBilling'
import { cn } from '@/lib/utils'

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' | 'outline' }> = {
  draft: { label: 'Borrador', variant: 'secondary' },
  issued: { label: 'Emitida', variant: 'default' },
  paid: { label: 'Pagada', variant: 'success' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
}

interface Product {
  id: string
  name: string
  sku: string
  price: number
  tax_rate: number
}

export function InvoiceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const currentStore = useAuthStore((state) => state.currentStore)

  const isNew = !id || id === 'new'
  const [isEditing, setIsEditing] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash')
  const [selectedTeamId, setSelectedTeamId] = useState<string>('none')
  const [productSearch, setProductSearch] = useState('')
  const [openProductPopover, setOpenProductPopover] = useState<number | null>(null)
  const popoverRef = useRef<HTMLButtonElement>(null)

  const { data: storesData } = useStores()
  const { data: currenciesData } = useCurrencies()
  const { data: customersData } = useQuery({
    queryKey: ['customers', organizationId],
    queryFn: () => getCustomers(organizationId!, {}),
    enabled: !!organizationId,
  })
  const { data: teamsData } = useQuery({
    queryKey: ['teams', organizationId],
    queryFn: async () => {
      const { data } = await supabase.from('teams').select('id, name, color').eq('organization_id', organizationId).eq('is_active', true).order('name')
      return data || []
    },
    enabled: !!organizationId,
  })
  const { data: productsData } = useQuery({
    queryKey: ['products', organizationId, productSearch],
    queryFn: () => getProducts(organizationId!, { search: productSearch || undefined, pageSize: 20 }),
    enabled: !!organizationId,
  })
  const { data: inventoryData } = useQuery({
    queryKey: ['inventory', organizationId, currentStore?.id],
    queryFn: async () => {
      if (!organizationId) return []
      let query = supabase.from('inventory').select('product_id, quantity').eq('organization_id', organizationId)
      if (currentStore?.id) query = query.eq('store_id', currentStore.id)
      const { data } = await query
      return data || []
    },
    enabled: !!organizationId,
  })

  const { data: invoiceSchedule } = useInvoiceSchedule(id!)
  const assignTeamMutation = useAssignTeamToInvoice()
  const removeTeamMutation = useRemoveTeamFromInvoice()

  const { data: invoice, isLoading: loadingInvoice } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoice(id!),
    enabled: !isNew && !!id,
  })

  const createMutation = useCreateInvoice()
  const updateMutation = useUpdateInvoice()
  const cancelMutation = useCancelInvoice()
  const paymentMutation = useAddInvoicePayment()

  const { register, handleSubmit, control, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      store_id: currentStore?.id || '',
      customer_id: '',
      currency_id: '',
      due_date: '',
      notes: '',
      items: [{ product_id: '', description: '', sku: '', quantity: 1, unit_price: 0, tax_rate: 0, discount_percentage: 0, available_stock: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const items = watch('items')

  // Populate form when loading existing invoice (new) or entering edit mode
  useEffect(() => {
    if (invoice && (isNew || isEditing)) {
      reset({
        store_id: invoice.store_id,
        customer_id: invoice.customer_id || '',
        currency_id: invoice.currency_id || '',
        due_date: invoice.due_date ? invoice.due_date.split('T')[0] : '',
        notes: invoice.notes || '',
        items: invoice.items?.map(item => ({
          product_id: item.product_id || '',
          description: item.description,
          sku: '',
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
          discount_percentage: item.discount_percentage,
          available_stock: 0,
        })) || [{ product_id: '', description: '', sku: '', quantity: 1, unit_price: 0, tax_rate: 0, discount_percentage: 0, available_stock: 0 }],
      })
    }
  }, [invoice, isEditing, reset])

  const getProductStock = (productId: string) =>
    inventoryData?.find((inv) => inv.product_id === productId)?.quantity || 0

  const addProduct = (product: Product, index: number) => {
    const stock = getProductStock(product.id)
    setValue(`items.${index}.product_id`, product.id)
    setValue(`items.${index}.description`, product.name)
    setValue(`items.${index}.sku`, product.sku)
    setValue(`items.${index}.unit_price`, product.price)
    setValue(`items.${index}.tax_rate`, product.tax_rate || 0)
    setValue(`items.${index}.available_stock`, stock)
    setOpenProductPopover(null)
    setProductSearch('')
  }

  const getItemTotal = (index: number) => {
    const item = items?.[index]
    if (!item) return 0
    const sub = item.quantity * item.unit_price
    const discount = sub * (item.discount_percentage || 0) / 100
    const tax = sub * (item.tax_rate || 0) / 100
    return sub - discount + tax
  }

  const calculateTotals = () => {
    const its = items || []
    const subtotal = its.reduce((s, i) => s + i.quantity * i.unit_price, 0)
    const tax = its.reduce((s, i) => s + i.quantity * i.unit_price * (i.tax_rate || 0) / 100, 0)
    const discount = its.reduce((s, i) => s + i.quantity * i.unit_price * (i.discount_percentage || 0) / 100, 0)
    return { subtotal, tax, discount, total: subtotal + tax - discount }
  }

  const totals = calculateTotals()

  const onSubmitNew = async (data: InvoiceFormData) => {
    await createMutation.mutateAsync(data, {
      onSuccess: () => {
        toast({ title: 'Factura creada', description: 'La factura se ha creado correctamente', variant: 'default' })
        navigate('/billing/invoices')
      },
      onError: (error: Error) => {
        toast({ title: 'Error', description: error.message, variant: 'destructive' })
      },
    })
  }

  const handleSaveEdit = handleSubmit(async (data) => {
    await updateMutation.mutateAsync(
      { invoiceId: id!, input: data },
      {
        onSuccess: () => {
          toast({ title: 'Factura guardada', description: 'Los cambios se han guardado correctamente' })
          setIsEditing(false)
        },
        onError: (error: Error) => {
          toast({ title: 'Error', description: error.message, variant: 'destructive' })
        },
      }
    )
  })

  const handleCancel = async () => {
    await cancelMutation.mutateAsync(id!, {
      onSuccess: () => {
        toast({ title: 'Factura cancelada', description: 'La factura ha sido cancelada' })
      },
      onError: (error: Error) => {
        toast({ title: 'Error', description: error.message, variant: 'destructive' })
      },
    })
  }

  const handleAddPayment = async () => {
    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Error', description: 'Monto inválido', variant: 'destructive' })
      return
    }
    await paymentMutation.mutateAsync(
      { invoiceId: id!, amount, method: paymentMethod },
      {
        onSuccess: () => {
          toast({ title: 'Pago registrado', description: 'El pago se ha registrado correctamente', variant: 'default' })
          setShowPaymentDialog(false)
          setPaymentAmount('')
        },
        onError: (error: Error) => {
          toast({ title: 'Error', description: error.message, variant: 'destructive' })
        },
      }
    )
  }

  if (!isNew && loadingInvoice) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const remainingBalance = invoice ? invoice.total - invoice.paid_amount : 0
  const invoiceStatus = invoice ? (statusLabels[invoice.status] || { label: invoice.status, variant: 'secondary' as const }) : null
  const canEdit = isNew || (invoice?.status === 'draft')
  const editable = isNew || isEditing

  // ── Product items form section (shared between new and edit mode) ──────────
  const renderItemsForm = () => (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Items de la Factura</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {fields.map((field, index) => {
            const stock = items?.[index]?.available_stock || getProductStock(items?.[index]?.product_id || '')
            const hasProduct = !!items?.[index]?.product_id
            return (
              <div key={field.id} className="flex gap-2 items-start border p-2 rounded">
                <div className="flex-1">
                  <Popover
                    open={openProductPopover === index}
                    onOpenChange={(open) => {
                      setOpenProductPopover(open ? index : null)
                      if (!open) setProductSearch('')
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn('w-full justify-between text-left', !hasProduct && 'text-muted-foreground')}
                        ref={popoverRef}
                      >
                        {hasProduct ? (
                          <span className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            <span>{items?.[index]?.description}</span>
                            <span className="text-xs text-muted-foreground">({items?.[index]?.sku})</span>
                          </span>
                        ) : 'Buscar producto...'}
                        <Search className="h-4 w-4 ml-2" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" align="start" side="bottom" sideOffset={4} style={{ width: popoverRef.current?.offsetWidth }}>
                      <div className="p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input placeholder="Buscar productos..." className="pl-8" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} autoFocus />
                        </div>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {productsData?.products?.map((product) => {
                          const prodStock = getProductStock(product.id)
                          return (
                            <div key={product.id} className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer" onClick={() => addProduct(product, index)}>
                              <div>
                                <p className="font-medium text-sm">{product.name}</p>
                                <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-sm">${product.price}</p>
                                <p className={`text-xs ${prodStock > 0 ? 'text-green-600' : 'text-red-600'}`}>Stock: {prodStock}</p>
                              </div>
                            </div>
                          )
                        })}
                        {productsData?.products?.length === 0 && (
                          <div className="text-center py-4 text-muted-foreground text-sm">No se encontraron productos</div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="w-20">
                  <Label className="text-xs text-muted-foreground">Stock</Label>
                  <Input value={stock} disabled className="text-center" />
                </div>
                <div className="w-20">
                  <Label className="text-xs text-muted-foreground">Cant *</Label>
                  <Input type="number" {...register(`items.${index}.quantity` as const, { valueAsNumber: true })} min={1} className="text-center" />
                </div>
                <div className="w-24">
                  <Label className="text-xs text-muted-foreground">Precio</Label>
                  <Input type="number" step="0.01" {...register(`items.${index}.unit_price` as const, { valueAsNumber: true })} className="text-right" />
                </div>
                <div className="w-16">
                  <Label className="text-xs text-muted-foreground">%Tax</Label>
                  <Input type="number" {...register(`items.${index}.tax_rate` as const, { valueAsNumber: true })} className="text-center" />
                </div>
                <div className="w-16">
                  <Label className="text-xs text-muted-foreground">%Desc</Label>
                  <Input type="number" {...register(`items.${index}.discount_percentage` as const, { valueAsNumber: true })} className="text-center" />
                </div>
                <div className="w-20">
                  <Label className="text-xs text-muted-foreground">Total</Label>
                  <Input value={getItemTotal(index).toFixed(2)} disabled className="text-right font-medium" />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length === 1}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            )
          })}
        </div>
        <div className="flex justify-between items-center mt-4">
          <Button type="button" variant="outline" onClick={() => append({ product_id: '', description: '', sku: '', quantity: 1, unit_price: 0, tax_rate: 0, discount_percentage: 0, available_stock: 0 })}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Item
          </Button>
          <div className="text-right">
            <p className="text-sm">Subtotal: ${totals.subtotal.toFixed(2)}</p>
            <p className="text-sm">Descuento: -${totals.discount.toFixed(2)}</p>
            <p className="text-sm">Impuesto: +${totals.tax.toFixed(2)}</p>
            <p className="font-bold text-lg">Total: ${totals.total.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // ── NEW invoice form ───────────────────────────────────────────────────────
  if (isNew) {
    return (
      <form onSubmit={handleSubmit(onSubmitNew)} className="container py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/billing/invoices">
              <Button variant="ghost" size="icon" type="button">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Nueva Factura</h1>
              <p className="text-muted-foreground">Crea una nueva factura</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/billing/invoices">
              <Button type="button" variant="outline">Cancelar</Button>
            </Link>
            {hasPermission(PERMISSIONS.INVOICE_CREATE) && (
              <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
                {(isSubmitting || createMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Crear Factura
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {renderItemsForm()}
          <div className="space-y-6">
            {renderDetailsForm()}
            {renderTotalsCard()}
          </div>
        </div>
      </form>
    )
  }

  // ── EDIT MODE ──────────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <form onSubmit={handleSaveEdit} className="container py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" type="button" onClick={() => setIsEditing(false)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Editando Factura {invoice?.number}</h1>
              <p className="text-muted-foreground">Modo edición</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || updateMutation.isPending}>
              {(isSubmitting || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Guardar Cambios
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {renderItemsForm()}
          <div className="space-y-6">
            {renderDetailsForm()}
            {renderTotalsCard()}
          </div>
        </div>
      </form>
    )
  }

  // ── READ-ONLY VIEW ─────────────────────────────────────────────────────────
  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/billing/invoices">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Factura {invoice?.number || ''}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              {invoiceStatus && <Badge variant={invoiceStatus.variant}>{invoiceStatus.label}</Badge>}
              {invoice && `| Pago: ${invoice.payment_status}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {invoice?.status === 'draft' && hasPermission(PERMISSIONS.INVOICE_EDIT) && (
            <Button type="button" variant="outline" onClick={() => setIsEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )}
          {invoice?.status === 'issued' && remainingBalance > 0 && hasPermission(PERMISSIONS.PAYMENT_REGISTER) && (
            <Button type="button" onClick={() => setShowPaymentDialog(true)}>
              <DollarSign className="mr-2 h-4 w-4" />
              Registrar Pago
            </Button>
          )}
          {(invoice?.status === 'draft' || invoice?.status === 'issued') && hasPermission(PERMISSIONS.INVOICE_CANCEL) && (
            <Button type="button" variant="destructive" onClick={handleCancel} disabled={cancelMutation.isPending}>
              {cancelMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
              Cancelar Factura
            </Button>
          )}
          <Link to="/billing/invoices">
            <Button type="button" variant="outline">Volver</Button>
          </Link>
        </div>
      </div>

      {invoice && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="text-2xl font-bold">${invoice.total.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Pagado</div>
              <div className="text-2xl font-bold text-green-600">${invoice.paid_amount.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Pendiente</div>
              <div className="text-2xl font-bold text-orange-600">${remainingBalance.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Estado pago</div>
              <div className="text-2xl font-bold">{invoice.payment_status}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Items de la Factura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium">Producto</th>
                    <th className="px-4 py-2 text-right text-sm font-medium">Cantidad</th>
                    <th className="px-4 py-2 text-right text-sm font-medium">Precio</th>
                    <th className="px-4 py-2 text-right text-sm font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoice?.items?.map((item, index) => (
                    <tr key={item.id || index}>
                      <td className="px-4 py-3">{item.description}</td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">${item.unit_price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Detalles</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {invoice?.customer && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-medium">{invoice.customer.name}</span>
                </div>
              )}
              {invoice?.due_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vencimiento:</span>
                  <span>{new Date(invoice.due_date).toLocaleDateString('es-ES')}</span>
                </div>
              )}
              {/* Team assignment */}
              <div>
                <Label className="text-muted-foreground text-sm">Equipo asignado</Label>
                {invoiceSchedule ? (
                  <div className="flex items-center justify-between rounded-lg border p-2 bg-muted/50 mt-1">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full" style={{ backgroundColor: invoiceSchedule.team?.color || '#6366f1' }} />
                      <span className="text-sm font-medium">{invoiceSchedule.team?.name}</span>
                    </div>
                    {hasPermission(PERMISSIONS.TEAM_ASSIGN) && (
                      <Button variant="ghost" size="sm" className="text-destructive h-6 px-2" onClick={() => removeTeamMutation.mutate(id!)} disabled={removeTeamMutation.isPending}>
                        Quitar
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2 mt-1">
                    <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Sin equipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin equipo</SelectItem>
                        {teamsData?.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: team.color }} />
                              {team.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedTeamId !== 'none' && hasPermission(PERMISSIONS.TEAM_ASSIGN) && (
                      <Button size="sm" onClick={() => assignTeamMutation.mutate({ invoiceId: id!, teamId: selectedTeamId })} disabled={assignTeamMutation.isPending}>
                        {assignTeamMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Asignar'}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Totales</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span><span>${invoice?.subtotal?.toFixed(2) ?? '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span>Impuestos</span><span>${invoice?.tax_amount?.toFixed(2) ?? '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span>Descuentos</span><span>-${invoice?.discount_amount?.toFixed(2) ?? '0.00'}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-lg font-bold">
                <span>Total</span><span>${invoice?.total.toFixed(2) ?? '0.00'}</span>
              </div>
            </CardContent>
          </Card>

          {invoice?.payments && invoice.payments.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Pagos ({invoice.payments.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {invoice.payments.map((payment) => (
                    <div key={payment.id} className="flex justify-between text-sm">
                      <span>{new Date(payment.created_at).toLocaleDateString()} - {payment.payment_method}</span>
                      <span className="font-medium">${payment.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {invoice?.notes && (
            <Card>
              <CardHeader><CardTitle>Notas</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Monto</Label>
              <Input type="number" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Método de pago</Label>
              <Select value={paymentMethod} onValueChange={(v: 'cash' | 'card' | 'transfer') => setPaymentMethod(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">Pendiente: ${remainingBalance.toFixed(2)}</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Cancelar</Button>
            <Button onClick={handleAddPayment} disabled={paymentMutation.isPending}>
              {paymentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

  // Helper render functions used by new/edit forms
  function renderDetailsForm() {
    return (
      <Card>
        <CardHeader><CardTitle>Detalles</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tienda *</Label>
            <Select value={watch('store_id')} onValueChange={(v) => setValue('store_id', v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar tienda" /></SelectTrigger>
              <SelectContent>
                {storesData?.map((store) => (
                  <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.store_id && <p className="text-sm text-destructive">{errors.store_id.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Moneda *</Label>
            <Select value={watch('currency_id')} onValueChange={(v) => setValue('currency_id', v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar moneda" /></SelectTrigger>
              <SelectContent>
                {currenciesData?.map((currency) => (
                  <SelectItem key={currency.id} value={currency.id}>{currency.code} - {currency.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.currency_id && <p className="text-sm text-destructive">{errors.currency_id.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Cliente</Label>
            <SearchableSelect
              value={watch('customer_id') || ''}
              onValueChange={(v) => setValue('customer_id', v)}
              options={[{ id: '', label: 'Sin cliente' }, ...(customersData?.customers?.map(c => ({ id: c.id, label: c.name })) || [])]}
              placeholder="Seleccionar cliente"
              searchPlaceholder="Buscar cliente..."
              emptyMessage="No se encontraron clientes"
            />
          </div>
          <div className="space-y-2">
            <Label>Fecha de vencimiento</Label>
            <Input type="date" {...register('due_date')} />
          </div>
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea {...register('notes')} placeholder="Notas de la factura" />
          </div>
        </CardContent>
      </Card>
    )
  }

  function renderTotalsCard() {
    return (
      <Card>
        <CardHeader><CardTitle>Totales</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between"><span>Subtotal</span><span>${totals.subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Impuestos</span><span>${totals.tax.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Descuentos</span><span>-${totals.discount.toFixed(2)}</span></div>
          <div className="flex justify-between border-t pt-2 text-lg font-bold"><span>Total</span><span>${totals.total.toFixed(2)}</span></div>
        </CardContent>
      </Card>
    )
  }
}
