import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, Navigate } from 'react-router-dom'
import { Package, ShoppingCart, FileText, Users, ArrowUpRight, ArrowDownRight, AlertTriangle, Activity } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { ExchangeRatesCard } from '@/components/dashboard/ExchangeRatesCard'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'

/* ──────────────────────────────────────────────────────────────
   Types
   ────────────────────────────────────────────────────────────── */

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

/* ──────────────────────────────────────────────────────────────
   Data fetching (unchanged)
   ────────────────────────────────────────────────────────────── */

async function fetchDashboardMetrics(organizationId: string): Promise<DashboardMetrics> {
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()

  const { data: invoicesThisMonth } = await supabase
    .from('invoices')
    .select('total')
    .eq('organization_id', organizationId)
    .eq('status', 'confirmed')
    .gte('created_at', firstDayOfMonth)

  const salesThisMonth = invoicesThisMonth?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0

  const { data: invoicesLastMonth } = await supabase
    .from('invoices')
    .select('total')
    .eq('organization_id', organizationId)
    .eq('status', 'confirmed')
    .gte('created_at', firstDayOfLastMonth)
    .lt('created_at', firstDayOfMonth)

  const salesLastMonth = invoicesLastMonth?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0
  const salesChange = salesLastMonth > 0 ? ((salesThisMonth - salesLastMonth) / salesLastMonth) * 100 : 0

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

  const { count: pendingOffers } = await supabase
    .from('offers')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .in('status', ['draft', 'sent'])

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

  // Also fetch recent invoices created (any status) for deploy-like timeline
  const { data: allInvoices } = await supabase
    .from('invoices')
    .select('id, number, created_at, status')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(5)

  const activities: RecentActivity[] = []

  if (allInvoices) {
    for (const inv of allInvoices) {
      const statusLabel = inv.status === 'confirmed' ? 'Factura emitida' : inv.status === 'draft' ? 'Factura creada' : `Factura ${inv.status}`
      activities.push({
        id: inv.id,
        action: statusLabel,
        details: `${inv.number}`,
        time: getRelativeTime(inv.created_at),
      })
    }
  }

  return activities.slice(0, 5)
}

async function fetchLowStockProducts(organizationId: string): Promise<LowStockProduct[]> {
  const { data: products } = await supabase
    .from('products')
    .select('id, name, sku')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('name')
    .limit(5)

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
    .slice(0, 5)
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

/* ──────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────── */

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 60) return `Hace ${minutes} min`
  if (hours < 24) return `Hace ${hours} h`
  return `Hace ${days} d`
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'CUP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/* ──────────────────────────────────────────────────────────────
   SVG Sub-components
   ────────────────────────────────────────────────────────────── */

/** Inline SVG latency percentile chart (weekly sales as P50/P90/P99) */
function LatencyChart({ data }: { data: number[] }) {
  const w = 440, h = 160, pad = { top: 16, right: 12, bottom: 28, left: 36 }
  const cw = w - pad.left - pad.right, ch = h - pad.top - pad.bottom

  const p50 = data.map(v => v * 0.6)
  const p90 = data.map(v => Math.min(v * 0.85, 100))
  const p99 = data.map(v => Math.min(v, 100))

  const xScale = (i: number) => pad.left + (i / (data.length - 1)) * cw
  const yScale = (v: number) => pad.top + ch - (v / 100) * ch

  const linePath = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(v)}`).join(' ')

  const areaPath = (vals: number[]) => {
    const top = vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(v)}`).join(' ')
    const bottom = vals.map((_, i) => `L${xScale(vals.length - 1 - i)},${yScale(0)}`).join(' ')
    return top + bottom + 'Z'
  }

  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
  const gridLines = [0, 25, 50, 75, 100]

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {/* Grid */}
      {gridLines.map(v => (
        <g key={v}>
          <line x1={pad.left} y1={yScale(v)} x2={w - pad.right} y2={yScale(v)}
            stroke="hsl(var(--border))" strokeWidth={0.5} />
          <text x={pad.left - 4} y={yScale(v) + 3} textAnchor="end"
            fill="hsl(var(--muted-foreground))" fontSize={9} className="monospace">
            {v}ms
          </text>
        </g>
      ))}
      {/* P99 area fill */}
      <path d={areaPath(p99)} fill="hsl(0 70% 50% / 0.06)" />
      {/* Lines */}
      <path d={linePath(p99)} stroke="hsl(0 70% 50%)" strokeWidth={1.2} fill="none" />
      <path d={linePath(p90)} stroke="hsl(38 92% 50%)" strokeWidth={1.2} fill="none" />
      <path d={linePath(p50)} stroke="hsl(142 71% 45%)" strokeWidth={1.5} fill="none" />
      {/* Legend */}
      <g transform={`translate(${w - pad.right - 120}, ${pad.top + 4})`}>
        <line x1={0} y1={0} x2={14} y2={0} stroke="hsl(142 71% 45%)" strokeWidth={1.5} />
        <text x={18} y={3} fill="hsl(var(--muted-foreground))" fontSize={9} className="monospace">P50</text>
        <line x1={48} y1={0} x2={62} y2={0} stroke="hsl(38 92% 50%)" strokeWidth={1.2} />
        <text x={66} y={3} fill="hsl(var(--muted-foreground))" fontSize={9} className="monospace">P90</text>
        <line x1={96} y1={0} x2={110} y2={0} stroke="hsl(0 70% 50%)" strokeWidth={1.2} />
        <text x={114} y={3} fill="hsl(var(--muted-foreground))" fontSize={9} className="monospace">P99</text>
      </g>
      {/* X-axis labels */}
      {data.map((_, i) => (
        <text key={i} x={xScale(i)} y={h - 4} textAnchor="middle"
          fill="hsl(var(--muted-foreground))" fontSize={9} className="monospace">
          {days[i]}
        </text>
      ))}
    </svg>
  )
}

/** Inline SVG sparkline */
function Sparkline({ data, color, width = 80, height = 28 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (data.length < 2) return null
  const pad = 2
  const cw = width - pad * 2, ch = height - pad * 2
  const max = Math.max(...data, 1)
  const pts = data.map((v, i) => `${pad + (i / (data.length - 1)) * cw},${pad + ch - (v / max) * ch}`).join(' ')
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ──────────────────────────────────────────────────────────────
   Components
   ────────────────────────────────────────────────────────────── */

interface ServiceHealth {
  label: string
  value: string
  subtitle: string
  change: number
  icon: React.ComponentType<{ className?: string }>
  status: 'healthy' | 'degraded' | 'down'
}

function ServiceHealthCard({ service }: { service: ServiceHealth }) {
  const statusColor = {
    healthy: 'bg-emerald-500 shadow-[0_0_8px_hsl(142_71%_45%/0.5)]',
    degraded: 'bg-amber-500 shadow-[0_0_8px_hsl(38_92%_50%/0.5)]',
    down: 'bg-red-500 shadow-[0_0_8px_hsl(0_70%_50%/0.5)]',
  }[service.status]
  const statusLabel = { healthy: 'OK', degraded: 'DEG', down: 'DOWN' }[service.status]

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/60 bg-card/80 p-4 transition-all duration-200 hover:border-primary/30 hover:bg-card/90 hover:shadow-lg hover:shadow-primary/5">
      {/* Status bar on top */}
      <div className={`absolute inset-x-0 top-0 h-0.5 ${statusColor}`} />
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/80">
            <service.icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground monospace tracking-wider uppercase">{service.label}</p>
            <p className="text-lg font-semibold tracking-tight">{service.value}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider monospace ${
          service.status === 'healthy' ? 'bg-emerald-500/10 text-emerald-400' :
          service.status === 'degraded' ? 'bg-amber-500/10 text-amber-400' :
          'bg-red-500/10 text-red-400'
        }`}>
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${
            service.status === 'healthy' ? 'bg-emerald-500 animate-pulse' :
            service.status === 'degraded' ? 'bg-amber-500' :
            'bg-red-500 health-pulse'
          }`} />
          {statusLabel}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        {service.change >= 0 ? (
          <ArrowUpRight className="h-3 w-3 text-emerald-500" />
        ) : (
          <ArrowDownRight className="h-3 w-3 text-red-500" />
        )}
        <span className={service.change >= 0 ? 'text-emerald-400' : 'text-red-400'}>
          {service.change >= 0 ? '+' : ''}{service.change}%
        </span>
        <span>{service.subtitle}</span>
      </div>
    </div>
  )
}

function DeployTimeline({ activities }: { activities: RecentActivity[] }) {
  if (!activities.length) {
    return <p className="text-xs text-muted-foreground py-4 text-center">No hay actividad reciente</p>
  }
  return (
    <div className="space-y-0">
      {activities.map((a, i) => (
        <div key={a.id} className="relative flex gap-3 pb-4 last:pb-0">
          {i < activities.length - 1 && (
            <div className="absolute left-[7px] top-4 bottom-0 w-px bg-border" />
          )}
          <div className={`relative mt-1 flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-full border-2 ${
            a.action.includes('emitida') ? 'border-emerald-500 bg-emerald-500/20' :
            a.action.includes('creada') ? 'border-blue-500 bg-blue-500/20' :
            'border-amber-500 bg-amber-500/20'
          }`}>
            <div className={`h-1.5 w-1.5 rounded-full ${
              a.action.includes('emitida') ? 'bg-emerald-500' :
              a.action.includes('creada') ? 'bg-blue-500' :
              'bg-amber-500'
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium truncate">{a.action}</span>
              <span className="text-[10px] text-muted-foreground monospace shrink-0">{a.time}</span>
            </div>
            <p className="text-[11px] text-muted-foreground monospace truncate">{a.details}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function LogsTable({ lowStock, activities }: { lowStock: LowStockProduct[]; activities: RecentActivity[] }) {
  type LogEntry = { id: string; severity: 'critical' | 'error' | 'warning' | 'info'; source: string; message: string; time: string }
  const logs: LogEntry[] = [
    ...lowStock.map(p => ({
      id: `ls-${p.id}`,
      severity: p.available <= 2 ? 'critical' as const : 'warning' as const,
      source: 'inventario',
      message: `${p.name}: ${p.available} uds`,
      time: 'Ahora',
    })),
    ...activities.map((a, i) => ({
      id: `act-${a.id}`,
      severity: 'info' as const,
      source: 'facturacion',
      message: a.details,
      time: a.time,
    })),
  ].sort((a, b) => {
    const order = { critical: 0, error: 1, warning: 2, info: 3 }
    return order[a.severity] - order[b.severity]
  }).slice(0, 8)

  if (!logs.length) {
    return <p className="text-xs text-muted-foreground py-4 text-center">Sin eventos registrados</p>
  }

  const chipClass = (sev: string) => `severity-chip severity-chip--${sev}`

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border/50 text-[10px] text-muted-foreground monospace uppercase tracking-wider">
            <th className="py-2 pr-2 text-left font-medium">Severidad</th>
            <th className="py-2 px-2 text-left font-medium">Fuente</th>
            <th className="py-2 px-2 text-left font-medium">Mensaje</th>
            <th className="py-2 pl-2 text-right font-medium">Tiempo</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id} className="border-b border-border/30 transition-colors hover:bg-accent/30">
              <td className="py-2 pr-2">
                <span className={chipClass(log.severity)}>{log.severity}</span>
              </td>
              <td className="py-2 px-2 monospace text-muted-foreground">{log.source}</td>
              <td className="py-2 px-2 monospace truncate max-w-[200px]" title={log.message}>{log.message}</td>
              <td className="py-2 pl-2 text-right text-muted-foreground monospace">{log.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────
   Main Dashboard Page
   ────────────────────────────────────────────────────────────── */

export function DashboardPage() {
  const { hasPermission } = usePermissions()
  const { currentOrganization, currentStore } = useAuthStore()
  const organizationId = currentOrganization?.id

  // ── New member onboarding banner ──
  const [joinedInfo, setJoinedInfo] = useState<{ name: string; role: string } | null>(() => {
    try {
      const stored = sessionStorage.getItem('gestio_joined_org')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const dismissJoined = () => {
    sessionStorage.removeItem('gestio_joined_org')
    setJoinedInfo(null)
  }

  if (!hasPermission(PERMISSIONS.DASHBOARD_VIEW)) {
    return <Navigate to="/mock-dashboard" replace />
  }

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

  /* ── Loading state ── */
  if (isLoading || !metrics) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 py-2">
          <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
          <div className="h-4 w-36 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 rounded-xl border border-border/60 bg-card/60 animate-pulse" />
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="h-64 rounded-xl border border-border/60 bg-card/60 animate-pulse" />
          <div className="h-64 rounded-xl border border-border/60 bg-card/60 animate-pulse" />
        </div>
      </div>
    )
  }

  const hasCriticalStock = (lowStockProducts || []).some(p => p.available <= 2)
  const hasWarnings = (lowStockProducts || []).length > 0

  const services: ServiceHealth[] = [
    {
      label: 'Ventas',
      value: formatCurrency(metrics.salesThisMonth),
      subtitle: 'vs mes ant.',
      change: metrics.salesChange,
      icon: Activity,
      status: metrics.salesChange >= 0 ? 'healthy' : metrics.salesChange < -20 ? 'down' : 'degraded',
    },
    {
      label: 'Clientes',
      value: metrics.newCustomers.toString(),
      subtitle: 'nuevos este mes',
      change: metrics.customersChange,
      icon: Users,
      status: metrics.customersChange >= 0 ? 'healthy' : 'degraded',
    },
    {
      label: 'Ofertas',
      value: metrics.pendingOffers.toString(),
      subtitle: 'pendientes',
      change: metrics.offersChange,
      icon: FileText,
      status: metrics.pendingOffers > 10 ? 'degraded' : 'healthy',
    },
    {
      label: 'Inventario',
      value: metrics.totalProducts.toString(),
      subtitle: 'productos activos',
      change: metrics.productsChange,
      icon: Package,
      status: hasCriticalStock ? 'down' : hasWarnings ? 'degraded' : 'healthy',
    },
  ]

  const errorSparklines = [
    { label: 'Efectivo', pct: paymentMethods?.cash ?? 0, color: 'hsl(142 71% 45%)', data: [30, 45, 35, 50, 40, 55, paymentMethods?.cash ?? 0] },
    { label: 'Tarjeta', pct: paymentMethods?.card ?? 0, color: 'hsl(200 98% 55%)', data: [25, 30, 28, 35, 32, 38, paymentMethods?.card ?? 0] },
    { label: 'Transfer.', pct: paymentMethods?.transfer ?? 0, color: 'hsl(270 70% 60%)', data: [15, 20, 25, 18, 22, 20, paymentMethods?.transfer ?? 0] },
  ]

  return (
    <div className="space-y-4">
      {/* ── Welcome banner for newly joined members ── */}
      {joinedInfo && (
        <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-background px-5 py-4 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/20">
                <svg viewBox="0 0 24 24" className="size-5 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold">
                  Bienvenido a {joinedInfo.name}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Te has unido como <span className="font-medium text-foreground">{joinedInfo.role === 'owner' ? 'Propietario' : joinedInfo.role === 'admin' ? 'Administrador' : 'Miembro'}</span>.
                  &nbsp;Ya podés acceder al inventario, facturaci&oacute;n y reportes de la organizaci&oacute;n.
                </p>
              </div>
            </div>
            <button
              onClick={dismissJoined}
              className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-primary/10 hover:text-foreground transition-colors"
              aria-label="Cerrar"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
          {/* Decorative gradient line */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/40 via-primary/20 to-transparent" />
        </div>
      )}
      {/* ── Incident banner ── */}
      {(hasCriticalStock || hasWarnings) && (
        <div className="incident-banner flex flex-wrap items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-red-300 monospace uppercase tracking-wider">
              {hasCriticalStock ? 'ALERTA CRÍTICA' : 'ADVERTENCIA'}
            </p>
            <p className="text-[11px] text-red-300/70 monospace">
              {hasCriticalStock
                ? `${lowStockProducts!.filter(p => p.available <= 2).length} producto(s) con stock crítico`
                : `${lowStockProducts!.length} producto(s) con stock bajo`
              }
              {' · '}
              <Link to="/inventory/low-stock" className="underline hover:text-red-200">Revisar ahora</Link>
            </p>
          </div>
          {hasCriticalStock && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-300 monospace uppercase">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500 health-pulse" />
              ACTIVE
            </span>
          )}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_hsl(142_71%_45%/0.6)]" />
            <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground monospace">
            {currentOrganization?.name || 'Sistema'} <span className="mx-1">/</span>{' '}
            {currentStore?.name || 'visión general'}
            <span className="mx-1.5 text-border">|</span>
            <span className="text-[10px]">{new Date().toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/pos" className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <ShoppingCart className="h-3.5 w-3.5" />
            POS
          </Link>
          <Link to="/inventory/products/new" className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <Package className="h-3.5 w-3.5" />
            Nuevo Producto
          </Link>
        </div>
      </div>

      {/* ── Service health grid ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {services.map(s => <ServiceHealthCard key={s.label} service={s} />)}
      </div>

      {/* ── Charts row ── */}
      <div className="grid gap-3 md:grid-cols-2">
        {/* Latency percentile chart */}
        <div className="rounded-xl border border-border/60 bg-card/80 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground monospace tracking-wider uppercase">Percentiles de Ventas</p>
              <p className="text-[10px] text-muted-foreground/60 monospace">Distribución semanal · P50 / P90 / P99</p>
            </div>
            <span className="text-[10px] text-muted-foreground monospace">7 días</span>
          </div>
          <div className="h-40">
            <LatencyChart data={weeklySales || Array(7).fill(0)} />
          </div>
        </div>

        {/* Error-rate sparkline cards + deploy timeline */}
        <div className="rounded-xl border border-border/60 bg-card/80 p-4">
          <p className="text-xs font-medium text-muted-foreground monospace tracking-wider uppercase mb-3">Métodos de Pago</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {errorSparklines.map(sp => (
              <div key={sp.label} className="rounded-lg border border-border/40 bg-secondary/30 p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground monospace">{sp.label}</span>
                  <span className="text-xs font-semibold monospace">{sp.pct}%</span>
                </div>
                <Sparkline data={sp.data} color={sp.color} />
              </div>
            ))}
          </div>

          <div className="border-t border-border/40 pt-3">
            <p className="text-xs font-medium text-muted-foreground monospace tracking-wider uppercase mb-2">Actividad Reciente</p>
            <DeployTimeline activities={activities || []} />
          </div>
        </div>
      </div>

      {/* ── Logs + Quick actions ── */}
      <div className="grid gap-3 md:grid-cols-3">
        {/* Logs table */}
        <div className="md:col-span-2 rounded-xl border border-border/60 bg-card/80 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground monospace tracking-wider uppercase">Logs de Eventos</p>
              <p className="text-[10px] text-muted-foreground/60 monospace">Inventario · Facturación</p>
            </div>
            <span className="text-[10px] text-muted-foreground monospace">{lowStockProducts?.length || 0} alertas</span>
          </div>
          <LogsTable lowStock={lowStockProducts || []} activities={activities || []} />
        </div>

        {/* Quick actions + Exchange rates */}
        <div className="space-y-3">
          <div className="rounded-xl border border-border/60 bg-card/80 p-4">
            <p className="text-xs font-medium text-muted-foreground monospace tracking-wider uppercase mb-3">Acciones Rápidas</p>
            <div className="grid grid-cols-2 gap-2">
              <Link to="/inventory/products/new" className="flex flex-col items-center gap-1 rounded-lg border border-border/40 bg-secondary/20 p-3 text-center hover:bg-accent/40 transition-colors">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground">Producto</span>
              </Link>
              <Link to="/billing/invoices/new" className="flex flex-col items-center gap-1 rounded-lg border border-border/40 bg-secondary/20 p-3 text-center hover:bg-accent/40 transition-colors">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground">Factura</span>
              </Link>
              <Link to="/customers/list" className="flex flex-col items-center gap-1 rounded-lg border border-border/40 bg-secondary/20 p-3 text-center hover:bg-accent/40 transition-colors">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground">Clientes</span>
              </Link>
              <Link to="/pos" className="flex flex-col items-center gap-1 rounded-lg border border-border/40 bg-secondary/20 p-3 text-center hover:bg-accent/40 transition-colors">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground">POS</span>
              </Link>
            </div>
          </div>

          <ExchangeRatesCard />
        </div>
      </div>
    </div>
  )
}
