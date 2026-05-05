import { useQuery } from '@tanstack/react-query'
import { Package, TrendingUp, Users, FileText, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { Link } from 'react-router-dom'
import { ExchangeRatesCard } from '@/components/dashboard/ExchangeRatesCard'

interface DashboardMetrics {
  salesThisMonth: number
  salesChange: number
  newCustomers: number
  customersChange: number
  pendingOffers: number
  offersChange: number
  totalProducts: number
  productsChange: number
}

interface RecentActivity {
  id: string
  action: string
  details: string
  time: string
}

interface LowStockProduct {
  id: string
  name: string
  sku: string
  available: number
}

async function fetchDashboardMetrics(organizationId: string): Promise<DashboardMetrics> {
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()

  // Get total sales this month
  const { data: invoicesThisMonth } = await supabase
    .from('invoices')
    .select('total')
    .eq('organization_id', organizationId)
    .eq('status', 'confirmed')
    .gte('created_at', firstDayOfMonth)

  const salesThisMonth = invoicesThisMonth?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0

  // Get total sales last month
  const { data: invoicesLastMonth } = await supabase
    .from('invoices')
    .select('total')
    .eq('organization_id', organizationId)
    .eq('status', 'confirmed')
    .gte('created_at', firstDayOfLastMonth)
    .lt('created_at', firstDayOfMonth)

  const salesLastMonth = invoicesLastMonth?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0
  const salesChange = salesLastMonth > 0 ? ((salesThisMonth - salesLastMonth) / salesLastMonth) * 100 : 0

  // Get new customers this month
  const { count: newCustomers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('created_at', firstDayOfMonth)

  const { count: newCustomersLastMonth } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('created_at', firstDayOfLastMonth)
    .lt('created_at', firstDayOfMonth)

  const customersChange = (newCustomersLastMonth || 0) > 0
    ? (((newCustomers || 0) - (newCustomersLastMonth || 0)) / (newCustomersLastMonth || 1)) * 100
    : 0

  // Get pending offers
  const { count: pendingOffers } = await supabase
    .from('offers')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .in('status', ['draft', 'sent'])

  // Get total products
  const { count: totalProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('is_active', true)

  return {
    salesThisMonth,
    salesChange: Math.round(salesChange * 10) / 10,
    newCustomers: newCustomers || 0,
    customersChange: Math.round(customersChange * 10) / 10,
    pendingOffers: pendingOffers || 0,
    offersChange: 0,
    totalProducts: totalProducts || 0,
    productsChange: 0,
  }
}

async function fetchRecentActivity(organizationId: string): Promise<RecentActivity[]> {
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, number, created_at')
    .eq('organization_id', organizationId)
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false })
    .limit(3)

  const activities: RecentActivity[] = []

  if (invoices) {
    for (const inv of invoices) {
      activities.push({
        id: inv.id,
        action: 'Nueva factura creada',
        details: `${inv.number}`,
        time: getRelativeTime(inv.created_at),
      })
    }
  }

  return activities.slice(0, 4)
}

async function fetchLowStockProducts(organizationId: string): Promise<LowStockProduct[]> {
  const { data: products } = await supabase
    .from('products')
    .select('id, name, sku')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('name')
    .limit(3)

  if (!products) return []

  const productIds = products.map(p => p.id)
  const { data: inventory } = await supabase
    .from('inventory')
    .select('product_id, quantity')
    .in('product_id', productIds)

  return products
    .map(p => {
      const inv = inventory?.find(i => i.product_id === p.id)
      return {
        id: p.id,
        name: p.name,
        sku: p.sku || 'N/A',
        available: inv?.quantity || 0,
      }
    })
    .filter(p => p.available <= 5)
    .slice(0, 3)
}

async function fetchWeeklySales(organizationId: string): Promise<number[]> {
  const now = new Date()
  const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).toISOString()

  const { data: invoices } = await supabase
    .from('invoices')
    .select('created_at, total')
    .eq('organization_id', organizationId)
    .eq('status', 'confirmed')
    .gte('created_at', weekAgo)

  const dailySales = Array(7).fill(0)
  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  if (invoices) {
    invoices.forEach(inv => {
      const date = new Date(inv.created_at!)
      const dayIndex = (date.getDay() + 6) % 7
      dailySales[dayIndex] += inv.total || 0
    })
  }

  const maxSale = Math.max(...dailySales, 1)
  return dailySales.map(s => Math.round((s / maxSale) * 100))
}

async function fetchPaymentMethods(organizationId: string): Promise<{ cash: number; card: number; transfer: number }> {
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { data: payments } = await supabase
    .from('payments')
    .select('payment_method, amount')
    .eq('organization_id', organizationId)
    .gte('created_at', firstDayOfMonth)

  if (!payments || payments.length === 0) return { cash: 0, card: 0, transfer: 0 }

  const totals = { cash: 0, card: 0, transfer: 0 }
  let grandTotal = 0
  for (const p of payments) {
    const amount = p.amount || 0
    grandTotal += amount
    if (p.payment_method === 'cash') totals.cash += amount
    else if (p.payment_method === 'card') totals.card += amount
    else totals.transfer += amount
  }

  if (grandTotal === 0) return { cash: 0, card: 0, transfer: 0 }

  return {
    cash: Math.round((totals.cash / grandTotal) * 100),
    card: Math.round((totals.card / grandTotal) * 100),
    transfer: Math.round((totals.transfer / grandTotal) * 100),
  }
}

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `Hace ${minutes} min`
  if (hours < 24) return `Hace ${hours} h`
  return `Hace ${days} días`
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'CUP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function DashboardPage() {
  const { currentOrganization, currentStore } = useAuthStore()
  const organizationId = currentOrganization?.id

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['dashboardMetrics', organizationId],
    queryFn: () => fetchDashboardMetrics(organizationId!),
    enabled: !!organizationId,
  })

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['dashboardActivity', organizationId],
    queryFn: () => fetchRecentActivity(organizationId!),
    enabled: !!organizationId,
  })

  const { data: lowStockProducts, isLoading: lowStockLoading } = useQuery({
    queryKey: ['dashboardLowStock', organizationId],
    queryFn: () => fetchLowStockProducts(organizationId!),
    enabled: !!organizationId,
  })

  const { data: weeklySales } = useQuery({
    queryKey: ['dashboardWeeklySales', organizationId],
    queryFn: () => fetchWeeklySales(organizationId!),
    enabled: !!organizationId,
  })

  const { data: paymentMethods } = useQuery({
    queryKey: ['dashboardPaymentMethods', organizationId],
    queryFn: () => fetchPaymentMethods(organizationId!),
    enabled: !!organizationId,
  })

  const isLoading = metricsLoading || activitiesLoading || lowStockLoading

  if (isLoading || !metrics) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-72 bg-muted rounded animate-pulse mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-20 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const metricCards = [
    { title: 'Ventas del Mes', value: formatCurrency(metrics.salesThisMonth), change: `${metrics.salesChange >= 0 ? '+' : ''}${metrics.salesChange}%`, icon: DollarSign, color: 'text-green-600' },
    { title: 'Nuevos Clientes', value: metrics.newCustomers.toString(), change: `${metrics.customersChange >= 0 ? '+' : ''}${metrics.customersChange}%`, icon: Users, color: 'text-blue-600' },
    { title: 'Ofertas Pendientes', value: metrics.pendingOffers.toString(), change: `${metrics.offersChange >= 0 ? '+' : ''}${metrics.offersChange}%`, icon: FileText, color: 'text-orange-600' },
    { title: 'Productos', value: metrics.totalProducts.toString(), change: `${metrics.productsChange >= 0 ? '+' : ''}${metrics.productsChange}%`, icon: Package, color: 'text-purple-600' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          {currentStore 
            ? `${currentOrganization?.name} - ${currentStore.name}` 
            : currentOrganization?.name || 'Bienvenido'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={metric.change.startsWith('+') ? 'text-green-600' : metric.change.startsWith('-') ? 'text-red-600' : ''}>
                  {metric.change}
                </span>{' '}
                vs mes anterior
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities && activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4">
                    <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.details}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay actividad reciente</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Productos con Stock Bajo</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts && lowStockProducts.length > 0 ? (
              <div className="space-y-4">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                    </div>
                    <Badge variant={product.available <= 3 ? 'destructive' : 'warning'}>
                      {product.available} uds
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay productos con stock bajo</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ventas por Día</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[100px] rounded-lg bg-muted p-4">
              <div className="flex h-full items-end justify-between gap-1">
                {(weeklySales || Array(7).fill(0)).map((height, i) => (
                  <div
                    key={i}
                    className="w-full rounded-t bg-primary/80"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>Lun</span>
              <span>Mar</span>
              <span>Mié</span>
              <span>Jue</span>
              <span>Vie</span>
              <span>Sáb</span>
              <span>Dom</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Métodos de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Efectivo</span>
                <span className="text-sm font-medium">{paymentMethods?.cash ?? '-'}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-green-500" style={{ width: `${paymentMethods?.cash ?? 0}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Tarjeta</span>
                <span className="text-sm font-medium">{paymentMethods?.card ?? '-'}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-blue-500" style={{ width: `${paymentMethods?.card ?? 0}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Transferencia</span>
                <span className="text-sm font-medium">{paymentMethods?.transfer ?? '-'}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-purple-500" style={{ width: `${paymentMethods?.transfer ?? 0}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Link to="/inventory/products/new" className="rounded-lg border p-3 text-center hover:bg-muted">
              <Package className="mx-auto h-6 w-6" />
              <span className="mt-1 block text-xs">Nuevo Producto</span>
            </Link>
            <Link to="/billing/invoices/new" className="rounded-lg border p-3 text-center hover:bg-muted">
              <FileText className="mx-auto h-6 w-6" />
              <span className="mt-1 block text-xs">Nueva Factura</span>
            </Link>
            <Link to="/customers/list" className="rounded-lg border p-3 text-center hover:bg-muted">
              <Users className="mx-auto h-6 w-6" />
              <span className="mt-1 block text-xs">Nuevo Cliente</span>
            </Link>
            <Link to="/pos" className="rounded-lg border p-3 text-center hover:bg-muted">
              <DollarSign className="mx-auto h-6 w-6" />
              <span className="mt-1 block text-xs">Abrir POS</span>
            </Link>
          </CardContent>
        </Card>

        <ExchangeRatesCard />
      </div>
    </div>
  )
}