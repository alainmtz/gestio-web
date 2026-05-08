import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ArrowLeft, Save, Loader2, Trash2, Plus, FileCheck, Search, Package, Check, X, FileText } from 'lucide-react'
import { offerSchema, type OfferFormData } from '@/schemas'
import { getOffer, createOffer, convertOfferToInvoice, convertOfferToPreInvoice, rejectOffer, convertPrice } from '@/api/billing'
import { getCustomers } from '@/api/customers'
import { getProducts } from '@/api/products'
import { useStores } from '@/hooks/useStores'
import { useCurrencies } from '@/hooks/useSettings'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/lib/toast'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'
import { useUpdateOffer } from '@/hooks/useBilling'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { useDefaultCurrency } from '@/hooks/useDefaultCurrency'

interface Product {
  id: string
  name: string
  sku: string
  price: number
  price_currency_id?: string
  tax_rate: number
  store_id?: string | null
  stock?: number
}

export function OfferDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const userId = useAuthStore((state) => state.user?.id)
  const { hasPermission } = usePermissions()
  const defaultCurrencyId = useDefaultCurrency()
  const currentStore = useAuthStore((state) => state.currentStore)

  const isNew = !id || id === 'new'
  const [productSearch, setProductSearch] = useState('')
  const [openProductPopover, setOpenProductPopover] = useState<number | null>(null)
  const popoverRef = useRef<HTMLButtonElement>(null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const itemOrigCurrencyRef = useRef<Record<number, string>>({})

  const { data: storesData } = useStores()
  const { data: currenciesData } = useCurrencies()
  const { data: customersData } = useQuery({
    queryKey: ['customers', organizationId],
    queryFn: () => getCustomers(organizationId!, {}),
    enabled: !!organizationId,
  })

  const { data: productsData } = useQuery({
    queryKey: ['products', organizationId, productSearch],
    queryFn: () => getProducts(organizationId!, { 
      search: productSearch || undefined,
      pageSize: 20 
    }),
    enabled: !!organizationId,
  })

  const { data: offer, isLoading: loadingOffer } = useQuery({
    queryKey: ['offer', id],
    queryFn: () => getOffer(id!),
    enabled: !isNew && !!id,
  })

  const { data: inventoryData } = useQuery({
    queryKey: ['inventory', organizationId, currentStore?.id],
    queryFn: async () => {
      if (!organizationId) return []
      let query = supabase
        .from('inventory')
        .select('product_id, quantity')
        .eq('organization_id', organizationId)
      
      if (currentStore?.id) {
        query = query.eq('store_id', currentStore.id)
      }
      
      const { data } = await query
      return data || []
    },
    enabled: !!organizationId,
  })

  const createMutation = useMutation({
    mutationFn: (data: OfferFormData) => createOffer(organizationId!, userId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      toast({ title: 'Oferta creada', description: 'La oferta se ha creado correctamente', variant: 'default' })
      navigate('/billing/offers')
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const updateMutation = useUpdateOffer()

  const convertToInvoiceMutation = useMutation({
    mutationFn: () => convertOfferToInvoice(id!, organizationId!, userId!, getValues().currency_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast({ title: 'Oferta convertida', description: 'La oferta se ha convertido a factura', variant: 'default' })
      navigate('/billing/invoices')
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const convertToPreInvoiceMutation = useMutation({
    mutationFn: () => convertOfferToPreInvoice(id!, organizationId!, userId!, getValues().currency_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      queryClient.invalidateQueries({ queryKey: ['preInvoices'] })
      toast({ title: 'Oferta convertida', description: 'La oferta se ha convertido a pre-factura', variant: 'default' })
      navigate('/billing/preinvoices')
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectOffer(id!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      toast({ title: 'Oferta rechazada', description: 'La oferta ha sido rechazada', variant: 'default' })
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const { register, handleSubmit, control, setValue, watch, reset, getValues, formState: { errors, isSubmitting } } = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      store_id: currentStore?.id || '',
      customer_id: '',
      currency_id: '',
      notes: '',
      valid_until: '',
      items: [{ product_id: '', description: '', sku: '', quantity: 1, unit_price: 0, tax_rate: 0, discount_percentage: 0, available_stock: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const items = watch('items')
  const watchedCurrencyId = watch('currency_id')
  const currencyCode = currenciesData?.find(c => c.id === watchedCurrencyId)?.code || 'CUP'
  const cupCurrencyId = currenciesData?.find(c => c.code === 'CUP')?.id || ''

  useEffect(() => {
    if (offer) {
      reset({
        store_id: offer.store_id || '',
        customer_id: offer.customer_id || '',
        currency_id: offer.currency_id || defaultCurrencyId,
        notes: offer.notes || '',
        valid_until: offer.valid_until ? offer.valid_until.split('T')[0] : '',
        items: offer.items?.map(item => ({
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
  }, [offer, reset, defaultCurrencyId])

  const onSubmit = async (data: OfferFormData) => {
    if (isNew) {
      await createMutation.mutateAsync(data)
    } else {
      await updateMutation.mutateAsync(
        { offerId: id!, input: data },
        {
          onSuccess: () => {
            toast({ title: 'Oferta guardada', description: 'Los cambios se han guardado correctamente' })
          },
          onError: (error: Error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' })
          },
        }
      )
    }
  }

  const addProduct = async (product: Product, index: number) => {
    const stock = inventoryData?.find(inv => inv.product_id === product.id)?.quantity || 0
    const offerCurrencyId = watch('currency_id')
    const productCurrencyId = product.price_currency_id || cupCurrencyId
    itemOrigCurrencyRef.current[index] = productCurrencyId

    let unitPrice = product.price
    if (offerCurrencyId && offerCurrencyId !== productCurrencyId) {
      unitPrice = await convertPrice(organizationId!, product.price, productCurrencyId, offerCurrencyId)
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

  const handleCurrencyChange = async (newCurrencyId: string) => {
    if (!organizationId) return
    const oldCurrencyId = getValues().currency_id
    if (!newCurrencyId || newCurrencyId === oldCurrencyId) return
    setValue('currency_id', newCurrencyId)

    for (let i = 0; i < fields.length; i++) {
      const item = items?.[i]
      if (!item?.product_id || !item.unit_price) continue
      const fromId = oldCurrencyId || itemOrigCurrencyRef.current[i] || cupCurrencyId
      if (!fromId || fromId === newCurrencyId) continue
      const convertedPrice = await convertPrice(organizationId!, item.unit_price, fromId, newCurrencyId)
      setValue(`items.${i}.unit_price`, Math.round(convertedPrice * 100) / 100)
    }
  }

  const getProductStock = (productId: string): number => {
    return inventoryData?.find(inv => inv.product_id === productId)?.quantity || 0
  }

  const handleConvertToInvoice = async () => {
    if (!offer?.items?.length) {
      toast({ title: 'Error', description: 'La oferta no tiene items', variant: 'destructive' })
      return
    }
    const currentData = getValues()
    try {
      await updateMutation.mutateAsync({ offerId: id!, input: currentData })
      await convertToInvoiceMutation.mutateAsync()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  const handleConvertToPreInvoice = async () => {
    if (!offer?.items?.length) {
      toast({ title: 'Error', description: 'La oferta no tiene items', variant: 'destructive' })
      return
    }
    const currentData = getValues()
    try {
      await updateMutation.mutateAsync({ offerId: id!, input: currentData })
      await convertToPreInvoiceMutation.mutateAsync()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) return
    await rejectMutation.mutateAsync(rejectReason.trim())
    setShowRejectDialog(false)
    setRejectReason('')
  }

  const getItemSubtotal = (index: number) => {
    const item = items?.[index]
    if (!item) return 0
    const subtotal = item.quantity * item.unit_price
    const discount = subtotal * (item.discount_percentage || 0) / 100
    return subtotal - discount
  }

  const getItemTax = (index: number) => {
    const item = items?.[index]
    if (!item) return 0
    const subtotal = item.quantity * item.unit_price
    return subtotal * (item.tax_rate || 0) / 100
  }

  const getItemTotal = (index: number) => {
    return getItemSubtotal(index) + getItemTax(index)
  }

  const totalSubtotal = items?.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) || 0
  const totalDiscount = items?.reduce((sum, item) => sum + (item.quantity * item.unit_price * (item.discount_percentage || 0) / 100), 0) || 0
  const totalTax = items?.reduce((sum, item) => sum + (item.quantity * item.unit_price * (item.tax_rate || 0) / 100), 0) || 0
  const grandTotal = totalSubtotal - totalDiscount + totalTax

  if (loadingOffer) {
    return (
      <div className="container py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <>
    <form onSubmit={handleSubmit(onSubmit)} className="container py-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/billing/offers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {isNew ? 'Nueva Oferta' : `Oferta ${offer?.number || ''}`}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isNew ? 'Crea una nueva oferta' : offer?.status ? `Estado: ${offer.status}` : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isNew && offer && offer.status !== 'accepted' && hasPermission(PERMISSIONS.INVOICE_CREATE) && (
            <>
              <Button type="button" onClick={handleConvertToInvoice} disabled={convertToInvoiceMutation.isPending}>
                {convertToInvoiceMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileCheck className="mr-2 h-4 w-4" />}
                <span className="hidden sm:inline">Factura</span>
              </Button>
              <Button type="button" onClick={handleConvertToPreInvoice} disabled={convertToPreInvoiceMutation.isPending} variant="outline">
                {convertToPreInvoiceMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                <span className="hidden sm:inline">Pre-factura</span>
              </Button>
              <Button type="button" onClick={() => setShowRejectDialog(true)} disabled={rejectMutation.isPending} variant="destructive">
                {rejectMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                <span className="hidden sm:inline">Rechazar</span>
              </Button>
            </>
          )}
          <Link to="/billing/offers">
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
          {(isNew ? hasPermission(PERMISSIONS.OFFER_CREATE) : hasPermission(PERMISSIONS.OFFER_EDIT)) && (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isNew ? 'Crear' : 'Guardar'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Productos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {fields.map((field, index) => {
                  const stock = items?.[index]?.available_stock || getProductStock(items?.[index]?.product_id || '')
                  const hasProduct = !!items?.[index]?.product_id
                  
                  return (
                    <div key={field.id} className="rounded-lg border p-3 space-y-3">
                      {/* Product selector */}
                      <Popover open={openProductPopover === index} onOpenChange={(open) => {
                        setOpenProductPopover(open ? index : null)
                        if (!open) setProductSearch('')
                      }}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn("w-full justify-between text-left", !hasProduct && "text-muted-foreground")}
                            ref={popoverRef}
                          >
                            {hasProduct ? (
                              <span className="flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                 <span>{items?.[index]?.description}</span>
                                <span className="text-xs text-muted-foreground">({items?.[index]?.sku})</span>
                              </span>
                            ) : (
                              "Buscar producto..."
                            )}
                            <Search className="h-4 w-4 ml-2 shrink-0" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-[calc(100vw-2rem)] sm:w-[400px]" align="start" side="bottom" sideOffset={4}>
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
                            {productsData?.products?.map(product => {
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
                                    <p className={`text-xs ${prodStock > 0 ? 'text-green-600' : 'text-red-600'}`}>
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

                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Stock</Label>
                          <Input value={stock} disabled className="text-center" />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Cant *</Label>
                          <Input
                            type="number"
                            {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                            min={1}
                            max={stock > 0 ? stock : 1}
                            className="text-center"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Precio</Label>
                          <Input
                            type="number"
                            step="0.01"
                            {...register(`items.${index}.unit_price` as const, { valueAsNumber: true })}
                            className="text-right"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">%Tax</Label>
                          <Input
                            type="number"
                            {...register(`items.${index}.tax_rate` as const, { valueAsNumber: true })}
                            className="text-center"
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <Label className="text-xs text-muted-foreground">Total</Label>
                          <Input value={getItemTotal(index).toFixed(2)} disabled className="text-right font-medium" />
                        </div>
                        <div className="flex items-end">
                          <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => remove(index)} disabled={fields.length === 1}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mt-4 pt-4 border-t">
                <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => append({ product_id: '', description: '', sku: '', quantity: 1, unit_price: 0, tax_rate: 0, discount_percentage: 0, available_stock: 0 })}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Item
                </Button>
                <div className="text-right space-y-0.5">
                  <p className="text-sm">Subtotal: {currencyCode} ${totalSubtotal.toFixed(2)}</p>
                  <p className="text-sm">Descuento: -{currencyCode} ${totalDiscount.toFixed(2)}</p>
                  <p className="text-sm">Impuesto: +{currencyCode} ${totalTax.toFixed(2)}</p>
                  <p className="font-bold text-lg">Total: {currencyCode} ${grandTotal.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="order-first lg:order-none space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tienda *</Label>
                <Select value={watch('store_id')} onValueChange={(v) => setValue('store_id', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tienda" />
                  </SelectTrigger>
                  <SelectContent>
                    {storesData?.map(store => (
                      <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.store_id && <p className="text-sm text-destructive">{errors.store_id.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Moneda *</Label>
                <Select value={watch('currency_id')} onValueChange={handleCurrencyChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    {currenciesData?.map(currency => (
                      <SelectItem key={currency.id} value={currency.id}>
                        {currency.code} - {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.currency_id && <p className="text-sm text-destructive">{errors.currency_id.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Cliente</Label>
                <SearchableSelect
                  value={watch('customer_id') || ''}
                  onValueChange={(v) => setValue('customer_id', v || '')}
                  options={[{ id: '', label: 'Sin cliente' }, ...(customersData?.customers?.map(c => ({ id: c.id, label: c.name })) || [])]}
                  placeholder="Seleccionar cliente"
                  searchPlaceholder="Buscar cliente..."
                  emptyMessage="No se encontraron clientes"
                />
              </div>

              <div className="space-y-2">
                <Label>Validez hasta</Label>
                <Input type="date" {...register('valid_until')} />
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

    <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rechazar oferta</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Motivo del rechazo *</Label>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Explique el motivo del rechazo..."
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setShowRejectDialog(false); setRejectReason('') }}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim() || rejectMutation.isPending}>
            {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Rechazar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  )
}