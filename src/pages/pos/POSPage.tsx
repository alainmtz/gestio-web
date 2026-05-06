import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Package, ShoppingCart, CreditCard, User, Plus, Minus, Trash2, Search, Loader2, DollarSign, ShieldX, Pause, Clock, Receipt } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/lib/toast'
import { supabase } from '@/lib/supabase'
import { createMovement } from '@/api/products'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'
import { useDefaultCurrency } from '@/hooks/useDefaultCurrency'
import { convertPrice } from '@/api/billing'

interface Product {
  id: string
  name: string
  sku: string
  price: number
  price_currency_id?: string
  cost?: number
  category?: { name: string }
}

interface CartItem {
  product: Product
  quantity: number
}

interface CashSession {
  id: string
  store_id: string
  status: string
}

interface HeldOrder {
  id: string
  cart: CartItem[]
  customerName?: string
  customerId?: string
  total: number
  createdAt: string
}

const HELD_ORDERS_KEY = 'pos-held-orders'

function getHeldOrders(): HeldOrder[] {
  try {
    const stored = localStorage.getItem(HELD_ORDERS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveHeldOrders(orders: HeldOrder[]) {
  localStorage.setItem(HELD_ORDERS_KEY, JSON.stringify(orders))
}

export function POSPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const userId = useAuthStore((state) => state.user?.id)
  const currentStore = useAuthStore((state) => state.currentStore)

  if (!hasPermission(PERMISSIONS.POS_ACCESS)) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <ShieldX className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold">Sin acceso al POS</h2>
        <p className="text-sm text-muted-foreground">No tienes permiso para acceder al punto de venta.</p>
      </div>
    )
  }

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCheckout, setShowCheckout] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash')
  const [cashReceived, setCashReceived] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [showHeldOrders, setShowHeldOrders] = useState(false)
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>(getHeldOrders)

  const defaultCurrencyId = useDefaultCurrency()

  const { data: activeCurrency } = useQuery({
    queryKey: ['defaultCurrency', defaultCurrencyId],
    queryFn: async () => defaultCurrencyId,
  })

  const { data: activeSession } = useQuery({
    queryKey: ['activeCashSession', organizationId, userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('cash_register_sessions')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .eq('status', 'open')
        .maybeSingle()
      return data as CashSession | null
    },
    enabled: !!organizationId && !!userId,
  })

  const { data: products, isLoading } = useQuery({
    queryKey: ['posProducts', organizationId, searchTerm, selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('id, name, sku, price, price_currency_id, category:product_categories(name)')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .limit(50)

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`)
      }

      if (selectedCategory && selectedCategory !== '_all') {
        query = query.eq('category_id', selectedCategory)
      }

      const { data } = await query
      return (data as unknown as Product[]) || []
    },
    enabled: !!organizationId,
  })

  const { data: categories } = useQuery({
    queryKey: ['categories', organizationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('product_categories')
        .select('id, name')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
      return data || []
    },
    enabled: !!organizationId,
  })

  const { data: customers } = useQuery({
    queryKey: ['customersSearch', organizationId, customerSearch],
    queryFn: async () => {
      if (!customerSearch) return []
      const { data } = await supabase
        .from('customers')
        .select('id, name, code')
        .eq('organization_id', organizationId)
        .ilike('name', `%${customerSearch}%`)
        .limit(5)
      return data || []
    },
    enabled: !!organizationId && customerSearch.length > 0,
  })

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      let convertedTotal = 0
      const convertedItems = await Promise.all(cart.map(async (item) => {
        const productCurrencyId = item.product.price_currency_id || defaultCurrencyId
        let unitPrice = item.product.price
        if (activeCurrency && activeCurrency !== productCurrencyId) {
          unitPrice = await convertPrice(organizationId!, item.product.price, productCurrencyId, activeCurrency)
        }
        const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100
        convertedTotal += lineTotal
        return {
          invoice_id: '',
          product_id: item.product.id,
          product_name: item.product.name,
          sku: item.product.sku,
          quantity: item.quantity,
          unit_price: Math.round(unitPrice * 100) / 100,
          tax_rate: 0,
          tax_amount: 0,
          discount_amount: 0,
          total: lineTotal,
        }
      }))

      // Create invoice
      const year = new Date().getFullYear()
      const { count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)

      const documentNumber = `POS-${year}-${String((count || 0) + 1).padStart(4, '0')}`

      const { data: invoice, error } = await supabase
        .from('invoices')
        .insert({
          organization_id: organizationId,
          store_id: currentStore?.id,
          customer_id: selectedCustomerId || null,
          number: documentNumber,
          status: 'confirmed',
          payment_status: 'paid',
          subtotal: convertedTotal,
          tax_amount: 0,
          discount_amount: 0,
          total: convertedTotal,
          paid_amount: convertedTotal,
          currency_id: activeCurrency,
        })
        .select()
        .single()

      if (error) throw error

      // Create invoice items
      const items = convertedItems.map(i => ({ ...i, invoice_id: invoice.id }))

      await supabase.from('invoice_items').insert(items)

      // Record payment
      await supabase.from('payments').insert({
        invoice_id: invoice.id,
        organization_id: organizationId!,
        amount: convertedTotal,
        payment_method: paymentMethod,
        currency_id: invoice.currency_id,
        exchange_rate: invoice.exchange_rate,
        transaction_date: new Date().toISOString().split('T')[0],
        created_by: userId,
      })

      // If cash payment, add to cash register
      if (paymentMethod === 'cash' && activeSession) {
        await supabase.from('cash_register_movements').insert({
          session_id: activeSession.id,
          type: 'sale',
          payment_method: 'cash',
          amount: convertedTotal,
          user_id: userId,
        })
      }

      // Create inventory movements for each item (SALE = decrease stock)
      for (const item of cart) {
        await createMovement(organizationId!, userId!, {
          store_id: currentStore!.id,
          product_id: item.product.id,
          variant_id: undefined,
          movement_type: 'SALE',
          quantity: item.quantity,
          cost: item.product.cost,
          reference_type: 'invoice',
          reference_id: invoice.id,
          notes: `Venta POS`,
        })
      }

      return invoice
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['cashMovements', activeSession?.id] })
      toast({ title: 'Venta completada', description: 'La venta se ha registrado correctamente', variant: 'default' })
      setCart([])
      setShowCheckout(false)
      setSelectedCustomerId('')
      setCashReceived('')
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    },
  })

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta
        return newQty > 0 ? { ...item, quantity: newQty } : item
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId))
  }

  const holdOrder = () => {
    if (cart.length === 0) return
    const order: HeldOrder = {
      id: `order-${Date.now()}`,
      cart: [...cart],
      customerName: customerSearch || undefined,
      customerId: selectedCustomerId || undefined,
      total: cartTotal,
      createdAt: new Date().toISOString(),
    }
    const updated = [...heldOrders, order]
    setHeldOrders(updated)
    saveHeldOrders(updated)
    setCart([])
    setCustomerSearch('')
    setSelectedCustomerId('')
    toast({ title: 'Pedido retenido', description: `Orden ${order.id.slice(-6)} guardada` })
  }

  const recallOrder = (order: HeldOrder) => {
    setCart(order.cart)
    if (order.customerId) setSelectedCustomerId(order.customerId)
    if (order.customerName) setCustomerSearch(order.customerName)
    const updated = heldOrders.filter(o => o.id !== order.id)
    setHeldOrders(updated)
    saveHeldOrders(updated)
    setShowHeldOrders(false)
    toast({ title: 'Pedido recuperado', description: `Orden ${order.id.slice(-6)} cargada` })
  }

  const deleteHeldOrder = (orderId: string) => {
    const updated = heldOrders.filter(o => o.id !== orderId)
    setHeldOrders(updated)
    saveHeldOrders(updated)
    toast({ title: 'Pedido eliminado', variant: 'destructive' })
  }

  const cartTotal = useMemo(() =>
    cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  , [cart])

  const changeAmount = parseFloat(cashReceived || '0') - cartTotal

  if (!activeSession) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Caja cerrada</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Debes abrir una sesión de caja desde el módulo de Caja registradora antes de usar el POS.
            </p>
            <Button className="mt-4" onClick={() => window.location.href = '/cash-register/sessions'}>
              Ir a Caja
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Products Grid */}
      <div className="flex-1 rounded-lg border bg-card p-4 flex flex-col overflow-hidden">
        <div className="mb-4 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar producto..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Todas</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-4 content-start">
            {products?.map((product: any) => (
              <Card
                key={product.id}
                className="cursor-pointer p-3 hover:bg-muted/50 transition-colors"
                onClick={() => addToCart(product)}
              >
                <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                  <Package className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="mt-2 text-sm font-medium truncate">{product.name}</p>
                <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Cart */}
      <div className="w-96 rounded-lg border bg-card p-4 flex flex-col">
        <h3 className="flex items-center gap-2 font-medium text-lg">
          <ShoppingCart className="h-5 w-5" />
          Carrito ({cart.length})
        </h3>

        <div className="flex-1 overflow-y-auto mt-4 space-y-2">
          {cart.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">El carrito está vacío</p>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">${item.product.price.toFixed(2)} c/u</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, -1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFromCart(item.product.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="border-t pt-4 mt-4 space-y-2">
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              size="lg"
              disabled={cart.length === 0}
              onClick={() => setShowCheckout(true)}
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Cobrar
            </Button>
            <Button
              variant="outline"
              size="lg"
              disabled={cart.length === 0}
              onClick={holdOrder}
              title="Retener pedido"
            >
              <Pause className="h-5 w-5" />
            </Button>
          </div>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setShowHeldOrders(true)}
          >
            <Clock className="mr-2 h-4 w-4" />
            Pedidos retenidos ({heldOrders.length})
          </Button>
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Finalizar Venta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between text-xl font-bold">
              <span>Total a pagar</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>

            <div className="space-y-2">
              <Label>Cliente (opcional)</Label>
              <Input
                placeholder="Buscar cliente..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
              {customers && customers.length > 0 && (
                <div className="border rounded-lg mt-1">
                  {customers.map((c) => (
                    <button
                      key={c.id}
                      className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                      onClick={() => {
                        setSelectedCustomerId(c.id)
                        setCustomerSearch(c.name)
                      }}
                    >
                      {c.name} ({c.code})
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Método de pago</Label>
              <Select value={paymentMethod} onValueChange={(v: 'cash' | 'card' | 'transfer') => setPaymentMethod(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === 'cash' && (
              <div className="space-y-2">
                <Label>Efectivo recibido</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="0.00"
                />
                {changeAmount > 0 && (
                  <div className="text-green-600 font-medium">
                    Cambio: ${changeAmount.toFixed(2)}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckout(false)}>Cancelar</Button>
            <Button
              onClick={() => checkoutMutation.mutate()}
              disabled={checkoutMutation.isPending || (paymentMethod === 'cash' && changeAmount < 0)}
            >
              {checkoutMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Completar Venta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Held Orders Dialog */}
      <Dialog open={showHeldOrders} onOpenChange={setShowHeldOrders}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pause className="h-5 w-5" />
              Pedidos Retenidos
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {heldOrders.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No hay pedidos retenidos</p>
            ) : (
              heldOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                  <div>
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm font-mono">#{order.id.slice(-6)}</span>
                      {order.customerName && (
                        <Badge variant="outline" className="text-xs">{order.customerName}</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {order.cart.length} productos · {new Date(order.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">${order.total.toFixed(2)}</span>
                    <Button variant="outline" size="sm" onClick={() => recallOrder(order)}>
                      Cargar
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteHeldOrder(order.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}