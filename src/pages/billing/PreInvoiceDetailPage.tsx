import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
import { Loader2, ArrowLeft, FileCheck, X, Plus, Trash2, Search, Package, Save, Send, Check, Pencil } from 'lucide-react'
import { preInvoiceSchema, type PreInvoiceFormData } from '@/schemas'
import {
  getPreInvoice,
  createPreInvoice,
  convertPreInvoiceToInvoice,
  rejectPreInvoice,
  convertPrice,
} from '@/api/billing'
import { getCustomers } from '@/api/customers'
import { getProducts } from '@/api/products'
import { useStores } from '@/hooks/useStores'
import { useCurrencies } from '@/hooks/useSettings'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/lib/toast'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'
import {
  useUpdatePreInvoice,
  useApprovePreInvoice,
  useSubmitPreInvoiceForApproval,
} from '@/hooks/useBilling'
import { useDefaultCurrency } from '@/hooks/useDefaultCurrency'

interface Product {
  id: string
  name: string
  sku: string
  price: number
  price_currency_id?: string
  tax_rate: number
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' }> = {
  draft: { label: 'Borrador', variant: 'secondary' },
  pending_approval: { label: 'Pendiente', variant: 'default' },
  approved: { label: 'Aprobada', variant: 'success' },
  rejected: { label: 'Rechazada', variant: 'destructive' },
}

export function PreInvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const userId = useAuthStore((state) => state.user?.id)
  const currentStore = useAuthStore((state) => state.currentStore)
  const defaultCurrencyId = useDefaultCurrency()

  const isNew = id === 'new'
  const [isEditing, setIsEditing] = useState(false)

  // Product search state (for new form)
  const [productSearch, setProductSearch] = useState('')
  const [openProductPopover, setOpenProductPopover] = useState<number | null>(null)
  const popoverRef = useRef<HTMLButtonElement>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  // ── Data queries ──────────────────────────────────────────────────────────
  const { data: storesData } = useStores()
  const { data: currenciesData } = useCurrencies()

  const { data: customersData } = useQuery({
    queryKey: ['customers', organizationId],
    queryFn: () => getCustomers(organizationId!, {}),
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
      let query = supabase
        .from('inventory')
        .select('product_id, quantity')
        .eq('organization_id', organizationId)
      if (currentStore?.id) query = query.eq('store_id', currentStore.id)
      const { data } = await query
      return data || []
    },
    enabled: !!organizationId,
  })

  const { data: preInvoice, isLoading } = useQuery({
    queryKey: ['preInvoice', id],
    queryFn: () => getPreInvoice(id!),
    enabled: !isNew && !!id,
  })

  // ── Form (only used for new) ───────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<PreInvoiceFormData>({
    resolver: zodResolver(preInvoiceSchema),
    defaultValues: {
      store_id: currentStore?.id || '',
      customer_id: '',
      currency_id: '',
      notes: '',
      items: [
        { product_id: '', description: '', sku: '', quantity: 1, unit_price: 0, tax_rate: 0, discount_percentage: 0, available_stock: 0 },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const items = watch('items')

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data: PreInvoiceFormData) => createPreInvoice(organizationId!, userId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preInvoices'] })
      toast({ title: 'Prefactura creada', description: 'La prefactura se ha creado correctamente', variant: 'default' })
      navigate('/billing/preinvoices')
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const convertToInvoiceMutation = useMutation({
    mutationFn: () => convertPreInvoiceToInvoice(id!, organizationId!, userId!, getValues().currency_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preInvoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast({ title: 'Prefactura convertida', description: 'La prefactura se ha convertido a factura', variant: 'default' })
      navigate('/billing/invoices')
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectPreInvoice(id!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preInvoices'] })
      toast({ title: 'Prefactura rechazada', description: 'La prefactura ha sido rechazada', variant: 'default' })
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const updateMutation = useUpdatePreInvoice()
  const approveMutation = useApprovePreInvoice()
  const submitForApprovalMutation = useSubmitPreInvoiceForApproval()

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getProductStock = (productId: string) =>
    inventoryData?.find((inv) => inv.product_id === productId)?.quantity || 0

  const addProduct = async (product: Product, index: number) => {
    const stock = getProductStock(product.id)
    const preInvoiceCurrencyId = watch('currency_id')
    const productCurrencyId = product.price_currency_id || defaultCurrencyId

    let unitPrice = product.price
    if (preInvoiceCurrencyId && preInvoiceCurrencyId !== productCurrencyId) {
      unitPrice = await convertPrice(organizationId!, product.price, productCurrencyId, preInvoiceCurrencyId)
    }

    setValue(`items.${index}.product_id`, product.id)
    setValue(`items.${index}.description`, product.name)
    setValue(`items.${index}.sku`, product.sku)
    setValue(`items.${index}.unit_price`, Math.round(unitPrice * 100) / 100)
    setValue(`items.${index}.tax_rate`, product.tax_rate || 0)
    setValue(`items.${index}.available_stock`, stock)
    setOpenProductPopover(null)
    setProductSearch('')
  }

  const getItemSubtotal = (index: number) => {
    const item = items?.[index]
    if (!item) return 0
    const subtotal = item.quantity * item.unit_price
    return subtotal - subtotal * (item.discount_percentage || 0) / 100
  }

  const getItemTax = (index: number) => {
    const item = items?.[index]
    if (!item) return 0
    return item.quantity * item.unit_price * (item.tax_rate || 0) / 100
  }

  const getItemTotal = (index: number) => getItemSubtotal(index) + getItemTax(index)

  const totalSubtotal = items?.reduce((s, i) => s + i.quantity * i.unit_price, 0) || 0
  const totalDiscount = items?.reduce((s, i) => s + i.quantity * i.unit_price * (i.discount_percentage || 0) / 100, 0) || 0
  const totalTax = items?.reduce((s, i) => s + i.quantity * i.unit_price * (i.tax_rate || 0) / 100, 0) || 0
  const grandTotal = totalSubtotal - totalDiscount + totalTax

  const handleConvertToInvoice = async () => {
    if (!preInvoice?.items?.length) {
      toast({ title: 'Error', description: 'La prefactura no tiene items', variant: 'destructive' })
      return
    }
    const currentData = getValues()
    try {
      await updateMutation.mutateAsync({ preInvoiceId: id!, input: currentData })
      await convertToInvoiceMutation.mutateAsync()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  const handleReject = async () => {
    setRejectDialogOpen(true)
  }

  const confirmReject = async () => {
    await rejectMutation.mutateAsync(rejectReason || 'Rechazada')
    setRejectDialogOpen(false)
    setRejectReason('')
  }

  // Populate form when entering edit mode for existing pre-invoice
  useEffect(() => {
    if (isEditing && preInvoice) {
      reset({
        store_id: preInvoice.store_id || '',
        customer_id: preInvoice.customer_id || '',
        currency_id: preInvoice.currency_id || defaultCurrencyId,
        notes: preInvoice.notes || '',
        items: preInvoice.items?.map((item) => ({
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
  }, [isEditing, preInvoice, reset, defaultCurrencyId])

  const handleSaveEdit = handleSubmit(async (data) => {
    await updateMutation.mutateAsync(
      { preInvoiceId: id!, input: data },
      {
        onSuccess: () => {
          toast({ title: 'Prefactura guardada', description: 'Los cambios se han guardado correctamente' })
          setIsEditing(false)
        },
        onError: (error: Error) => {
          toast({ title: 'Error', description: error.message, variant: 'destructive' })
        },
      }
    )
  })

  const handleSubmitForApproval = async () => {
    await submitForApprovalMutation.mutateAsync(id!, {
      onSuccess: () => {
        toast({ title: 'Enviada a aprobación', description: 'La prefactura está pendiente de aprobación' })
      },
      onError: (error: Error) => {
        toast({ title: 'Error', description: error.message, variant: 'destructive' })
      },
    })
  }

  const handleApprove = async () => {
    await approveMutation.mutateAsync(id!, {
      onSuccess: () => {
        toast({ title: 'Prefactura aprobada', description: 'La prefactura ha sido aprobada' })
      },
      onError: (error: Error) => {
        toast({ title: 'Error', description: error.message, variant: 'destructive' })
      },
    })
  }

  // ── NEW pre-invoice form ──────────────────────────────────────────────────
  if (isNew) {
    return (
      <form
        onSubmit={handleSubmit((data) => createMutation.mutate(data))}
        className="container py-8 space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/billing/preinvoices">
              <Button variant="ghost" size="icon" type="button">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Nueva Prefactura</h1>
              <p className="text-muted-foreground">Crea una nueva prefactura</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/billing/preinvoices">
              <Button type="button" variant="outline">Cancelar</Button>
            </Link>
            <Button type="submit" disabled={isSubmitting || createMutation.isPending || !hasPermission(PERMISSIONS.PREINVOICE_CREATE)}>
              {(isSubmitting || createMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Save className="mr-2 h-4 w-4" />
              Crear Prefactura
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Items */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Productos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {fields.map((field, index) => {
                    const stock =
                      items?.[index]?.available_stock ||
                      getProductStock(items?.[index]?.product_id || '')
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
                                className={cn(
                                  'w-full justify-between text-left',
                                  !hasProduct && 'text-muted-foreground'
                                )}
                                ref={popoverRef}
                              >
                                {hasProduct ? (
                                  <span className="flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    <span>{items?.[index]?.description}</span>
                                    <span className="text-xs text-muted-foreground">
                                      ({items?.[index]?.sku})
                                    </span>
                                  </span>
                                ) : (
                                  'Buscar producto...'
                                )}
                                <Search className="h-4 w-4 ml-2" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="p-0"
                              align="start"
                              side="bottom"
                              sideOffset={4}
                              style={{ width: popoverRef.current?.offsetWidth }}
                            >
                              <div className="p-2 border-b">
                                <div className="relative">
                                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                  <Input
                                    placeholder="Buscar productos..."
                                    className="pl-8"
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    autoFocus
                                  />
                                </div>
                              </div>
                              <div className="max-h-64 overflow-y-auto">
                                {productsData?.products?.map((product) => {
                                  const prodStock = getProductStock(product.id)
                                  return (
                                    <div
                                      key={product.id}
                                      className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer"
                                      onClick={() => addProduct(product, index)}
                                    >
                                      <div>
                                        <p className="font-medium text-sm">{product.name}</p>
                                        <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-medium text-sm">${product.price}</p>
                                        <p
                                          className={`text-xs ${prodStock > 0 ? 'text-green-600' : 'text-red-600'}`}
                                        >
                                          Stock: {prodStock}
                                        </p>
                                      </div>
                                    </div>
                                  )
                                })}
                                {productsData?.products?.length === 0 && (
                                  <div className="text-center py-4 text-muted-foreground text-sm">
                                    No se encontraron productos
                                  </div>
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
                          <Input
                            type="number"
                            {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                            min={1}
                            max={stock > 0 ? stock : undefined}
                            className="text-center"
                          />
                        </div>
                        <div className="w-24">
                          <Label className="text-xs text-muted-foreground">Precio</Label>
                          <Input
                            type="number"
                            step="0.01"
                            {...register(`items.${index}.unit_price` as const, { valueAsNumber: true })}
                            className="text-right"
                          />
                        </div>
                        <div className="w-16">
                          <Label className="text-xs text-muted-foreground">%Tax</Label>
                          <Input
                            type="number"
                            {...register(`items.${index}.tax_rate` as const, { valueAsNumber: true })}
                            className="text-center"
                          />
                        </div>
                        <div className="w-20">
                          <Label className="text-xs text-muted-foreground">Total</Label>
                          <Input
                            value={getItemTotal(index).toFixed(2)}
                            disabled
                            className="text-right font-medium"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )
                  })}
                </div>

                {errors.items && (
                  <p className="text-sm text-destructive mt-2">
                    {typeof errors.items.message === 'string' ? errors.items.message : 'Error en los items'}
                  </p>
                )}

                <div className="flex justify-between items-center mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      append({
                        product_id: '',
                        description: '',
                        sku: '',
                        quantity: 1,
                        unit_price: 0,
                        tax_rate: 0,
                        discount_percentage: 0,
                        available_stock: 0,
                      })
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Item
                  </Button>
                  <div className="text-right">
                    <p className="text-sm">Subtotal: ${totalSubtotal.toFixed(2)}</p>
                    <p className="text-sm">Descuento: -${totalDiscount.toFixed(2)}</p>
                    <p className="text-sm">Impuesto: +${totalTax.toFixed(2)}</p>
                    <p className="font-bold text-lg">Total: ${grandTotal.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detalles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tienda *</Label>
                  <Select
                    value={watch('store_id')}
                    onValueChange={(v) => setValue('store_id', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tienda" />
                    </SelectTrigger>
                    <SelectContent>
                      {storesData?.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.store_id && (
                    <p className="text-sm text-destructive">{errors.store_id.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Moneda *</Label>
                  <Select
                    value={watch('currency_id')}
                    onValueChange={(v) => setValue('currency_id', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      {currenciesData?.map((currency) => (
                        <SelectItem key={currency.id} value={currency.id}>
                          {currency.code} - {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.currency_id && (
                    <p className="text-sm text-destructive">{errors.currency_id.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <SearchableSelect
                    value={watch('customer_id') || ''}
                    onValueChange={(v) => setValue('customer_id', v || '')}
                    options={[
                      { id: '', label: 'Sin cliente' },
                      ...(customersData?.customers?.map((c) => ({ id: c.id, label: c.name })) || []),
                    ]}
                    placeholder="Seleccionar cliente"
                    searchPlaceholder="Buscar cliente..."
                    emptyMessage="No se encontraron clientes"
                  />
                </div>

                <div className="space-y-2">
                   <Label>Notas</Label>
                  <Textarea {...register('notes')} placeholder="Notas adicionales..." />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    )
  }

  // ── EXISTING pre-invoice view ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="container py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!preInvoice) {
    return (
      <div className="container py-8">
        <p>Prefactura no encontrada</p>
      </div>
    )
  }

  const status = statusLabels[preInvoice.status] || { label: preInvoice.status, variant: 'secondary' as const }

  // ── EDIT MODE ──────────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <>
        <form onSubmit={handleSaveEdit} className="container py-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" type="button" onClick={() => setIsEditing(false)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Editando Prefactura {preInvoice.number}</h1>
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

          <div className="grid gap-6 lg:grid-cols-4">
            <div className="lg:col-span-3 space-y-6">
              <Card>
                <CardHeader><CardTitle>Productos</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {fields.map((field, index) => {
                      const stock =
                        items?.[index]?.available_stock ||
                        getProductStock(items?.[index]?.product_id || '')
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
                            <Input type="number" {...register(`items.${index}.quantity` as const, { valueAsNumber: true })} min={1} max={stock > 0 ? stock : undefined} className="text-center" />
                          </div>
                          <div className="w-24">
                            <Label className="text-xs text-muted-foreground">Precio</Label>
                            <Input type="number" step="0.01" {...register(`items.${index}.unit_price` as const, { valueAsNumber: true })} className="text-right" />
                          </div>
                          <div className="w-16">
                            <Label className="text-xs text-muted-foreground">%Tax</Label>
                            <Input type="number" {...register(`items.${index}.tax_rate` as const, { valueAsNumber: true })} className="text-center" />
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
                      <p className="text-sm">Subtotal: ${totalSubtotal.toFixed(2)}</p>
                      <p className="text-sm">Descuento: -${totalDiscount.toFixed(2)}</p>
                      <p className="text-sm">Impuesto: +${totalTax.toFixed(2)}</p>
                      <p className="font-bold text-lg">Total: ${grandTotal.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
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
                  </div>
                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    <SearchableSelect
                      value={watch('customer_id') || ''}
                      onValueChange={(v) => setValue('customer_id', v || '')}
                      options={[{ id: '', label: 'Sin cliente' }, ...(customersData?.customers?.map((c) => ({ id: c.id, label: c.name })) || [])]}
                      placeholder="Seleccionar cliente"
                      searchPlaceholder="Buscar cliente..."
                      emptyMessage="No se encontraron clientes"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notas</Label>
                    <Textarea {...register('notes')} placeholder="Notas adicionales..." />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </>
    )
  }

  // ── READ-ONLY VIEW ─────────────────────────────────────────────────────────
  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/billing/preinvoices">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Prefactura {preInvoice.number}
            </h1>
            <p className="text-muted-foreground">
              Estado: <Badge variant={status.variant}>{status.label}</Badge>
              {preInvoice.rejection_reason && (
                <span className="ml-2 text-sm text-destructive">
                  ({preInvoice.rejection_reason})
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* draft → edit or submit */}
          {preInvoice.status === 'draft' && hasPermission(PERMISSIONS.PREINVOICE_EDIT) && (
            <Button type="button" variant="outline" onClick={() => setIsEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )}
          {preInvoice.status === 'draft' && hasPermission(PERMISSIONS.PREINVOICE_EDIT) && (
            <Button type="button" onClick={handleSubmitForApproval} disabled={submitForApprovalMutation.isPending}>
              {submitForApprovalMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Enviar a aprobación
            </Button>
          )}
          {/* pending_approval → approve or reject */}
          {preInvoice.status === 'pending_approval' && hasPermission(PERMISSIONS.PREINVOICE_APPROVE) && (
            <>
              <Button type="button" onClick={handleApprove} disabled={approveMutation.isPending}>
                {approveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Aprobar
              </Button>
              <Button type="button" onClick={handleReject} disabled={rejectMutation.isPending} variant="destructive">
                {rejectMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                Rechazar
              </Button>
            </>
          )}
          {/* approved → convert to invoice */}
          {preInvoice.status === 'approved' && hasPermission(PERMISSIONS.INVOICE_CREATE) && (
            <Button type="button" onClick={handleConvertToInvoice} disabled={convertToInvoiceMutation.isPending}>
              {convertToInvoiceMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileCheck className="mr-2 h-4 w-4" />}
              Convertir a Factura
            </Button>
          )}
          <Link to="/billing/preinvoices">
            <Button type="button" variant="outline">Volver</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
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
                    {preInvoice.items?.map((item, index) => (
                      <tr key={item.id || index}>
                        <td className="px-4 py-3">
                          <div>{item.description}</div>
                        </td>
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
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {preInvoice.customer && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-medium">{preInvoice.customer.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>${preInvoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Impuesto:</span>
                <span>${preInvoice.tax_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Descuento:</span>
                <span>-${preInvoice.discount_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-3 text-lg font-bold">
                <span>Total:</span>
                <span>${preInvoice.total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {preInvoice.offer_id && (
            <Card>
              <CardHeader>
                <CardTitle>Origen</CardTitle>
              </CardHeader>
              <CardContent>
                <Link to={`/billing/offers/${preInvoice.offer_id}`} className="text-primary hover:underline">
                  Ver oferta origen
                </Link>
              </CardContent>
            </Card>
          )}

          {preInvoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{preInvoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Rechazar Pre-factura</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Motivo de rechazo</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Escribe el motivo del rechazo..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmReject} disabled={rejectMutation.isPending}>
              {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Rechazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
