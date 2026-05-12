import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ArrowLeft, Save, Loader2, Plus, Trash2, DollarSign, Search, Package, Pencil, XCircle, Download } from 'lucide-react'
import { invoiceSchema, type InvoiceFormData } from '@/schemas'
import { getInvoice, addInvoicePayment, convertPrice } from '@/api/billing'
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
import { useDefaultCurrency } from '@/hooks/useDefaultCurrency'

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
  price_currency_id?: string
  tax_rate: number
}

export function InvoiceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const defaultCurrencyId = useDefaultCurrency()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const organization = useAuthStore((state) => state.currentOrganization)
  const currentStore = useAuthStore((state) => state.currentStore)

  const isNew = !id || id === 'new'
  const [isEditing, setIsEditing] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash')
  const [paymentCardNumber, setPaymentCardNumber] = useState('')
  const [paymentCustomerName, setPaymentCustomerName] = useState('')
  const [paymentIdentityCard, setPaymentIdentityCard] = useState('')
  const [paymentTransferCode, setPaymentTransferCode] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState<string>('none')
  const [productSearch, setProductSearch] = useState('')
  const [openProductPopover, setOpenProductPopover] = useState<number | null>(null)
  const popoverRef = useRef<HTMLButtonElement>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const itemOrigCurrencyRef = useRef<Record<number, string>>({})

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

  const { register, handleSubmit, control, setValue, watch, reset, getValues, formState: { errors, isSubmitting } } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      store_id: currentStore?.id || '',
      customer_id: '',
      currency_id: '',
      due_date: '',
      notes: '',
      items: [{ product_id: '', description: '', sku: '', quantity: 1, unit_price: 0, tax_rate: 0, discount_percentage: 0, available_stock: 0, warranty_duration: undefined, warranty_period: undefined }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const items = watch('items')
  const watchedCurrencyId = watch('currency_id')
  const formCurrencyCode = currenciesData?.find(c => c.id === watchedCurrencyId)?.code || 'CUP'
  const cupCurrencyId = currenciesData?.find(c => c.code === 'CUP')?.id || ''

  // Populate form when loading existing invoice (new) or entering edit mode
  useEffect(() => {
    if (invoice && (isNew || isEditing)) {
      reset({
        store_id: invoice.store_id || '',
        customer_id: invoice.customer_id || '',
        currency_id: invoice.currency_id || defaultCurrencyId,
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
          warranty_duration: item.warranty_duration,
          warranty_period: item.warranty_period,
        })) || [{ product_id: '', description: '', sku: '', quantity: 1, unit_price: 0, tax_rate: 0, discount_percentage: 0, available_stock: 0 }],
      })
    }
  }, [invoice, isEditing, reset, defaultCurrencyId])

  const getProductStock = (productId: string) =>
    inventoryData?.find((inv) => inv.product_id === productId)?.quantity || 0

  const addProduct = async (product: Product, index: number) => {
    const stock = getProductStock(product.id)
    const invoiceCurrencyId = watch('currency_id')
    const productCurrencyId = product.price_currency_id || cupCurrencyId
    itemOrigCurrencyRef.current[index] = productCurrencyId

    let unitPrice = product.price
    if (invoiceCurrencyId && invoiceCurrencyId !== productCurrencyId) {
      unitPrice = await convertPrice(organizationId!, product.price, productCurrencyId, invoiceCurrencyId)
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
    const extra = paymentMethod === 'card' || paymentMethod === 'transfer'
      ? { card_number: paymentCardNumber || undefined, customer_name: paymentCustomerName || undefined, identity_card: paymentIdentityCard || undefined, transfer_code: paymentTransferCode || undefined }
      : undefined
    await paymentMutation.mutateAsync(
      { invoiceId: id!, amount, method: paymentMethod, extra },
      {
        onSuccess: () => {
          toast({ title: 'Pago registrado', description: 'El pago se ha registrado correctamente', variant: 'default' })
          setShowPaymentDialog(false)
          setPaymentAmount('')
          setPaymentCardNumber('')
          setPaymentCustomerName('')
          setPaymentIdentityCard('')
          setPaymentTransferCode('')
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

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow || !invoice) return

    const currencyCode = currenciesData?.find(c => c.id === invoice.currency_id)?.code || ''

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Factura ${invoice.number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1a1a1a; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #1a1a1a; }
    .company-name { font-size: 28px; font-weight: 700; }
    .invoice-title { text-align: right; }
    .invoice-title h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
    .invoice-title .number { font-size: 16px; color: #666; }
    .invoice-title .status { font-size: 14px; font-weight: 600; margin-top: 4px; }
    .status-issued { color: #2563eb; }
    .status-paid { color: #16a34a; }
    .status-draft { color: #666; }
    .status-cancelled { color: #dc2626; }
    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
    .details-section h3 { font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 8px; letter-spacing: 0.05em; }
    .details-section p { font-size: 14px; margin-bottom: 4px; }
    .details-section .label { color: #666; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { text-align: left; padding: 12px 16px; background: #f5f5f5; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #666; }
    th:last-child, td:last-child { text-align: right; }
    th:nth-child(2), td:nth-child(2) { text-align: right; }
    th:nth-child(3), td:nth-child(3) { text-align: right; }
    td { padding: 12px 16px; border-bottom: 1px solid #e5e5e5; font-size: 14px; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 32px; }
    .totals-grid { width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
    .totals-row.total { border-top: 2px solid #1a1a1a; padding-top: 12px; font-size: 18px; font-weight: 700; }
    .notes { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5; }
    .notes h3 { font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 8px; }
    .notes p { font-size: 14px; color: #666; white-space: pre-wrap; }
    .footer { margin-top: 48px; text-align: center; font-size: 12px; color: #999; }
    @media print {
      body { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-name">${organization?.name || 'Mi Empresa'}</div>
    </div>
    <div class="invoice-title">
      <h1>FACTURA</h1>
      <div class="number">${invoice.number}</div>
      <div class="status status-${invoice.status}">${statusLabels[invoice.status]?.label || invoice.status}</div>
      <div style="font-size:14px;color:#666;margin-top:4px;">${new Date(invoice.created_at).toLocaleDateString('es-ES')}</div>
    </div>
  </div>

  <div class="details-grid">
    <div class="details-section">
      <h3>Cliente</h3>
      <p>${invoice.customer?.name || '—'}</p>
      ${invoice.customer?.code ? `<p>Código: ${invoice.customer.code}</p>` : ''}
    </div>
    <div class="details-section">
      <h3>Detalles de pago</h3>
      ${invoice.payments && invoice.payments.length > 0
        ? invoice.payments.map(p => {
          const extra = []
          if (p.customer_name) extra.push(`Cliente: ${p.customer_name}`)
          if (p.identity_card) extra.push(`CI: ${p.identity_card}`)
          if (p.card_number) extra.push(`Tarjeta: ${p.card_number}`)
          if (p.transfer_code) extra.push(`Código: ${p.transfer_code}`)
          if (p.reference) extra.push(`Ref: ${p.reference}`)
          return `
      <p style="margin-bottom:6px;">
        <strong>${new Date(p.created_at).toLocaleDateString('es-ES')}</strong> — ${p.payment_method} — $${p.amount.toFixed(2)}
      </p>
      ${extra.length ? `<p style="font-size:13px;color:#555;margin-bottom:10px;">${extra.join(' | ')}</p>` : ''}`
        }).join('')
        : '<p>—</p>'
      }
      ${invoice.due_date ? `<p><span class="label">Vencimiento:</span> ${new Date(invoice.due_date).toLocaleDateString('es-ES')}</p>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Producto</th>
        <th>Cantidad</th>
        <th>Precio ${currencyCode}</th>
        <th>Total ${currencyCode}</th>
      </tr>
    </thead>
    <tbody>
      ${(invoice.items || []).map(item => `
      <tr>
        <td>${item.description}</td>
        <td>${item.quantity}</td>
        <td>$${item.unit_price.toFixed(2)}</td>
        <td>$${item.total.toFixed(2)}</td>
      </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-grid">
      <div class="totals-row">
        <span>Subtotal</span>
        <span>$${invoice.subtotal.toFixed(2)}</span>
      </div>
      <div class="totals-row">
        <span>Impuestos</span>
        <span>$${invoice.tax_amount.toFixed(2)}</span>
      </div>
      ${invoice.discount_amount > 0 ? `
      <div class="totals-row">
        <span>Descuentos</span>
        <span>-$${invoice.discount_amount.toFixed(2)}</span>
      </div>
      ` : ''}
      <div class="totals-row total">
        <span>Total</span>
        <span>$${invoice.total.toFixed(2)}</span>
      </div>
      <div class="totals-row">
        <span>Pagado</span>
        <span>$${invoice.paid_amount.toFixed(2)}</span>
      </div>
      <div class="totals-row">
        <span>Pendiente</span>
        <span>$${remainingBalance.toFixed(2)}</span>
      </div>
    </div>
  </div>

  ${invoice.notes ? `
  <div class="notes">
    <h3>Notas</h3>
    <p>${invoice.notes}</p>
  </div>
  ` : ''}

  <div class="footer">
    <p>${organization?.name || 'Mi Empresa'} — Factura ${invoice.number}</p>
  </div>

  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`)
    printWindow.document.close()
  }

  // ── Product items form section (shared between new and edit mode) ──────────
  const renderItemsForm = () => (
    <div className="rounded-xl border border-border/60 bg-card/80 p-4 lg:col-span-2">
      <h2 className="text-base font-semibold mb-3">Items de la Factura</h2>
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
              <div className="flex gap-2 items-center w-full mt-1 pt-1 border-t">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Garantía</Label>
                <Input
                  type="number"
                  min={0}
                  {...register(`items.${index}.warranty_duration` as const, { valueAsNumber: true })}
                  className="w-16 text-center"
                  placeholder="0"
                />
                <Select
                  value={items?.[index]?.warranty_period || ''}
                  onValueChange={(v) => setValue(`items.${index}.warranty_period` as const, v ? v as 'days' | 'months' : undefined)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="-" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Días</SelectItem>
                    <SelectItem value="months">Meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex justify-between items-center mt-4">
        <Button type="button" variant="outline" onClick={() => append({ product_id: '', description: '', sku: '', quantity: 1, unit_price: 0, tax_rate: 0, discount_percentage: 0, available_stock: 0, warranty_duration: undefined, warranty_period: undefined })}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Item
        </Button>
        <div className="text-right">
          <p className="text-sm">Subtotal: {formCurrencyCode} ${totals.subtotal.toFixed(2)}</p>
          <p className="text-sm">Descuento: -{formCurrencyCode} ${totals.discount.toFixed(2)}</p>
          <p className="text-sm">Impuesto: +{formCurrencyCode} ${totals.tax.toFixed(2)}</p>
          <p className="font-bold text-lg">Total: {formCurrencyCode} ${totals.total.toFixed(2)}</p>
        </div>
      </div>
    </div>
  )

  // ── NEW invoice form ───────────────────────────────────────────────────────
  if (isNew) {
    return (
      <form onSubmit={handleSubmit(onSubmitNew)} className="container py-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/billing/invoices">
              <Button variant="ghost" size="icon" type="button">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-semibold">Nueva Factura</h1>
              <p className="mt-0.5 text-xs text-muted-foreground font-mono">Crea una nueva factura</p>
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

        <div className="grid gap-4 lg:grid-cols-3">
          {renderItemsForm()}
          <div className="space-y-4">
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
      <form onSubmit={handleSaveEdit} className="container py-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" type="button" onClick={() => setIsEditing(false)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Editando Factura {invoice?.number}</h1>
              <p className="mt-0.5 text-xs text-muted-foreground font-mono">Modo edición</p>
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

        <div className="grid gap-4 lg:grid-cols-3">
          {renderItemsForm()}
          <div className="space-y-4">
            {renderDetailsForm()}
            {renderTotalsCard()}
          </div>
        </div>
      </form>
    )
  }

  // ── READ-ONLY VIEW ─────────────────────────────────────────────────────────
  return (
    <div className="container py-8 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/billing/invoices">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold flex items-center gap-2">
              Factura {invoice?.number || ''}
              {invoice && (
                <span className="h-2 w-2 rounded-full bg-green-500" />
              )}
            </h1>
            <div className="mt-0.5 text-xs text-muted-foreground font-mono flex items-center gap-2">
              {invoiceStatus && <Badge variant={invoiceStatus.variant}>{invoiceStatus.label}</Badge>}
              {invoice && `| Pago: ${invoice.payment_status}`}
            </div>
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
          {invoice?.status !== 'draft' && invoice?.status !== 'cancelled' && (
            <Button type="button" variant="outline" onClick={handlePrint}>
              <Download className="mr-2 h-4 w-4" />
              Descargar PDF
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

      {invoice && (() => {
        const roCurrencyCode = invoice.currency?.code || 'CUP'
        return (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-border/60 bg-card/80 p-4">
            <div className="text-sm text-muted-foreground font-mono uppercase text-xs">Total</div>
            <div className="text-2xl font-bold">{roCurrencyCode} ${invoice.total.toFixed(2)}</div>
          </div>
          <div className="rounded-xl border border-border/60 bg-card/80 p-4">
            <div className="text-sm text-muted-foreground font-mono uppercase text-xs">Pagado</div>
            <div className="text-2xl font-bold text-green-600">{roCurrencyCode} ${invoice.paid_amount.toFixed(2)}</div>
          </div>
          <div className="rounded-xl border border-border/60 bg-card/80 p-4">
            <div className="text-sm text-muted-foreground font-mono uppercase text-xs">Pendiente</div>
            <div className="text-2xl font-bold text-orange-600">{roCurrencyCode} ${remainingBalance.toFixed(2)}</div>
          </div>
          <div className="rounded-xl border border-border/60 bg-card/80 p-4">
            <div className="text-sm text-muted-foreground font-mono uppercase text-xs">Estado pago</div>
            <div className="text-2xl font-bold">{invoice.payment_status}</div>
          </div>
        </div>
        )
      })()}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-card/80 p-4 lg:col-span-2">
          <h2 className="text-base font-semibold mb-3">Items de la Factura</h2>
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
                    <td className="px-4 py-3">
                      <div>{item.description}</div>
                      {(item.warranty_duration && item.warranty_period) && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Garantía: {item.warranty_duration} {item.warranty_period === 'days' ? 'días' : 'meses'}
                          {item.warranty_end_date && ` (hasta ${new Date(item.warranty_end_date).toLocaleDateString('es-ES')})`}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">${item.unit_price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">${item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-card/80 p-4">
            <h2 className="text-base font-semibold mb-3">Detalles</h2>
            <div className="space-y-3">
              {invoice?.customer && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-mono text-xs">Cliente:</span>
                  <span className="font-medium">{invoice.customer.name}</span>
                </div>
              )}
              {invoice?.due_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-mono text-xs">Vencimiento:</span>
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
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/80 p-4">
            <h2 className="text-base font-semibold mb-3">Totales</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-mono text-xs">Subtotal</span>
                <span>{invoice?.currency?.code || 'CUP'} ${invoice?.subtotal?.toFixed(2) ?? '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-mono text-xs">Impuestos</span>
                <span>{invoice?.currency?.code || 'CUP'} ${invoice?.tax_amount?.toFixed(2) ?? '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-mono text-xs">Descuentos</span>
                <span>-{invoice?.currency?.code || 'CUP'} ${invoice?.discount_amount?.toFixed(2) ?? '0.00'}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-lg font-bold">
                <span>Total</span>
                <span>{invoice?.currency?.code || 'CUP'} ${invoice?.total.toFixed(2) ?? '0.00'}</span>
              </div>
            </div>
          </div>

          {invoice?.payments && invoice.payments.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-card/80 p-4">
              <h2 className="text-base font-semibold mb-3">Pagos ({invoice.payments.length})</h2>
              <div className="space-y-3">
                {invoice.payments.map((payment) => (
                  <div key={payment.id} className="text-sm border-b pb-2 last:border-0">
                    <div className="flex justify-between">
                      <span className="font-medium">{new Date(payment.created_at).toLocaleDateString()} - {payment.payment_method}</span>
                      <span className="font-medium">${payment.amount.toFixed(2)}</span>
                    </div>
                    {payment.customer_name && <div className="text-muted-foreground mt-1">Cliente: {payment.customer_name}</div>}
                    {payment.identity_card && <div className="text-muted-foreground">CI: {payment.identity_card}</div>}
                    {payment.card_number && <div className="text-muted-foreground">Tarjeta: {payment.card_number}</div>}
                    {payment.transfer_code && <div className="text-muted-foreground">Código transf.: {payment.transfer_code}</div>}
                    {payment.reference && <div className="text-muted-foreground">Ref: {payment.reference}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {invoice?.notes && (
            <div className="rounded-xl border border-border/60 bg-card/80 p-4">
              <h2 className="text-base font-semibold mb-3">Notas</h2>
              <p className="text-sm text-muted-foreground">{invoice.notes}</p>
            </div>
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
              <Select value={paymentMethod} onValueChange={(v: 'cash' | 'card' | 'transfer') => {
                setPaymentMethod(v)
                if (v === 'cash') { setPaymentCardNumber(''); setPaymentTransferCode('') }
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === 'card' && (
              <>
                <div className="space-y-2">
                  <Label>Número de tarjeta receptora</Label>
                  <Input value={paymentCardNumber} onChange={(e) => setPaymentCardNumber(e.target.value)} placeholder="Últimos 4 dígitos" />
                </div>
                <div className="space-y-2">
                  <Label>Nombre completo del cliente</Label>
                  <Input value={paymentCustomerName} onChange={(e) => setPaymentCustomerName(e.target.value)} placeholder="Nombre y apellidos" />
                </div>
                <div className="space-y-2">
                  <Label>Carnet de identidad</Label>
                  <Input value={paymentIdentityCard} onChange={(e) => setPaymentIdentityCard(e.target.value)} placeholder="Número de carnet" />
                </div>
              </>
            )}

            {paymentMethod === 'transfer' && (
              <>
                <div className="space-y-2">
                  <Label>Código de transferencia</Label>
                  <Input value={paymentTransferCode} onChange={(e) => setPaymentTransferCode(e.target.value)} placeholder="Número de referencia" />
                </div>
                <div className="space-y-2">
                  <Label>Nombre completo del cliente</Label>
                  <Input value={paymentCustomerName} onChange={(e) => setPaymentCustomerName(e.target.value)} placeholder="Nombre y apellidos" />
                </div>
                <div className="space-y-2">
                  <Label>Carnet de identidad</Label>
                  <Input value={paymentIdentityCard} onChange={(e) => setPaymentIdentityCard(e.target.value)} placeholder="Número de carnet" />
                </div>
              </>
            )}

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
      <div className="rounded-xl border border-border/60 bg-card/80 p-4">
        <h2 className="text-base font-semibold mb-3">Detalles</h2>
        <div className="space-y-4">
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
            <Select value={watch('currency_id')} onValueChange={handleCurrencyChange}>
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
        </div>
      </div>
    )
  }

  function renderTotalsCard() {
    return (
      <div className="rounded-xl border border-border/60 bg-card/80 p-4">
        <h2 className="text-base font-semibold mb-3">Totales</h2>
        <div className="space-y-2">
          <div className="flex justify-between"><span className="text-muted-foreground font-mono text-xs">Subtotal</span><span>{formCurrencyCode} ${totals.subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground font-mono text-xs">Impuestos</span><span>{formCurrencyCode} ${totals.tax.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground font-mono text-xs">Descuentos</span><span>-{formCurrencyCode} ${totals.discount.toFixed(2)}</span></div>
          <div className="flex justify-between border-t pt-2 text-lg font-bold"><span>Total</span><span>{formCurrencyCode} ${totals.total.toFixed(2)}</span></div>
        </div>
      </div>
    )
  }
}
