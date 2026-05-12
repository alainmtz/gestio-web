import { Package, TrendingUp, Users, FileText, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'


const DEMO_DATA = {
  salesThisMonth: 245800,
  salesChange: 12.5,
  newCustomers: 48,
  customersChange: 8.3,
  pendingOffers: 12,
  offersChange: -3.1,
  totalProducts: 1247,
  productsChange: 5.2,
}

const DEMO_ACTIVITIES = [
  { id: '1', action: 'Nueva factura creada', details: 'FAC-2026-0042', time: 'Hace 15 min' },
  { id: '2', action: 'Producto actualizado', details: 'Laptop HP ProBook 450', time: 'Hace 1 h' },
  { id: '3', action: 'Cliente registrado', details: 'María García López', time: 'Hace 2 h' },
  { id: '4', action: 'Pago registrado', details: 'Factura FAC-2026-0038', time: 'Hace 3 h' },
]

const DEMO_LOW_STOCK = [
  { id: '1', name: 'Toner HP 85A', sku: 'TON-HP-85A', available: 2 },
  { id: '2', name: 'Papel Carta 75g', sku: 'PAP-C75-500', available: 3 },
  { id: '3', name: 'Mouse USB', sku: 'MOU-USB-01', available: 1 },
]

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'CUP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function MockDashboardContent() {
  const metricCards = [
    { title: 'Ventas del Mes', value: formatCurrency(DEMO_DATA.salesThisMonth), change: `+${DEMO_DATA.salesChange}%`, icon: DollarSign, color: 'text-green-600' },
    { title: 'Nuevos Clientes', value: DEMO_DATA.newCustomers.toString(), change: `+${DEMO_DATA.customersChange}%`, icon: Users, color: 'text-blue-600' },
    { title: 'Ofertas Pendientes', value: DEMO_DATA.pendingOffers.toString(), change: `${DEMO_DATA.offersChange}%`, icon: FileText, color: 'text-orange-600' },
    { title: 'Productos', value: DEMO_DATA.totalProducts.toString(), change: `+${DEMO_DATA.productsChange}%`, icon: Package, color: 'text-purple-600' },
  ]

  // Fake weekly sales percentages for bar chart
  const weeklySales = [45, 62, 38, 75, 80, 55, 70]
  const paymentMethods = { cash: 55, card: 30, transfer: 15 }

  return (
    <div className="space-y-6">
      {/* Mock data banner */}
      <div className="rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">
          <strong>Vista previa:</strong> Esta p&aacute;gina muestra datos de ejemplo. Los datos reales no est&aacute;n disponibles.
        </p>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Vista previa con datos de ejemplo</p>
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
                <span className={metric.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
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
            <div className="space-y-4">
              {DEMO_ACTIVITIES.map((activity) => (
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Productos con Stock Bajo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {DEMO_LOW_STOCK.map((product) => (
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
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ventas por D&iacute;a</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[100px] rounded-lg bg-muted p-4">
              <div className="flex h-full items-end justify-between gap-1">
                {weeklySales.map((height, i) => (
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
              <span>Mi&eacute;</span>
              <span>Jue</span>
              <span>Vie</span>
              <span>S&aacute;b</span>
              <span>Dom</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">M&eacute;todos de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Efectivo</span>
                <span className="text-sm font-medium">{paymentMethods.cash}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-green-500" style={{ width: `${paymentMethods.cash}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Tarjeta</span>
                <span className="text-sm font-medium">{paymentMethods.card}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-blue-500" style={{ width: `${paymentMethods.card}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Transferencia</span>
                <span className="text-sm font-medium">{paymentMethods.transfer}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-purple-500" style={{ width: `${paymentMethods.transfer}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Acciones R&aacute;pidas</CardTitle>
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Cambio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>EUR</span>
                <span className="font-medium">165.00 CUP</span>
              </div>
              <div className="flex justify-between">
                <span>USD</span>
                <span className="font-medium">155.00 CUP</span>
              </div>
              <div className="flex justify-between">
                <span>MLC</span>
                <span className="font-medium">155.00 CUP</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
export function MockDashboardPage() {
  return <MockDashboardContent />
}
