import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Download, TrendingUp, TrendingDown, Wallet, Clock } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useToast } from '@/lib/toast'
import { Skeleton } from '@/components/ui/skeleton'

interface DayBucket {
  date: string
  ingresos: number
  egresos: number
}

const PERIODS = [
  { value: '7d', label: 'Últimos 7 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: '90d', label: 'Últimos 90 días' },
  { value: 'year', label: 'Este año' },
]

function startDateFor(period: string): string {
  const d = new Date()
  if (period === '7d') d.setDate(d.getDate() - 7)
  else if (period === '30d') d.setDate(d.getDate() - 30)
  else if (period === '90d') d.setDate(d.getDate() - 90)
  else if (period === 'year') d.setFullYear(d.getFullYear() - 1)
  return d.toISOString()
}

export function FinancialReportPage() {
  const [period, setPeriod] = useState('30d')
  const [storeId, setStoreId] = useState<string>('_all')
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const { toast } = useToast()
  const { hasPermission } = usePermissions()

  const { data: stores } = useQuery({
    queryKey: ['stores', organizationId],
    queryFn: async () => {
      const { data } = await supabase
        .from('stores')
        .select('id, name')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
      return data || []
    },
    enabled: !!organizationId,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['financialReport', organizationId, period, storeId],
    queryFn: async () => {
      if (!organizationId) return null
      const startDate = startDateFor(period)

      // ── 1. Ingresos: facturas pagadas (PAID / PARTIAL) ──────────────────────
      let invQuery = supabase
        .from('invoices')
        .select('created_at, total, paid_amount, payment_status, currency_id')
        .eq('organization_id', organizationId)
        .gte('created_at', startDate)
        .in('payment_status', ['paid', 'partial'])

      if (storeId !== '_all') invQuery = invQuery.eq('store_id', storeId)

      const { data: invoices } = await invQuery

      // ── 2. Cuentas por cobrar: facturas emitidas no pagadas ─────────────────
      let arQuery = supabase
        .from('invoices')
        .select('total, paid_amount, payment_status')
        .eq('organization_id', organizationId)
        .eq('status', 'issued')
        .in('payment_status', ['pending', 'partial'])

      if (storeId !== '_all') arQuery = arQuery.eq('store_id', storeId)

      const { data: arInvoices } = await arQuery

      // ── 3. Egresos: movimientos de caja EXPENSE/WITHDRAWAL ──────────────────
      let movQuery = supabase
        .from('cash_register_movements')
        .select('created_at, amount, currency, movement_type, register_id')
        .gte('created_at', startDate)
        .in('movement_type', ['EXPENSE', 'WITHDRAWAL'])

      const { data: expenses } = await movQuery

      // ── Aggregate by date ───────────────────────────────────────────────────
      const buckets: Record<string, DayBucket> = {}

      invoices?.forEach((inv) => {
        const date = inv.created_at.split('T')[0]
        if (!buckets[date]) buckets[date] = { date, ingresos: 0, egresos: 0 }
        buckets[date].ingresos += parseFloat(inv.paid_amount ?? inv.total)
      })

      expenses?.forEach((mov) => {
        const date = mov.created_at.split('T')[0]
        if (!buckets[date]) buckets[date] = { date, ingresos: 0, egresos: 0 }
        buckets[date].egresos += parseFloat(mov.amount)
      })

      const chart = Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date))

      const totalIngresos = chart.reduce((acc, d) => acc + d.ingresos, 0)
      const totalEgresos = chart.reduce((acc, d) => acc + d.egresos, 0)
      const utilidadNeta = totalIngresos - totalEgresos

      const cuentasPorCobrar = (arInvoices ?? []).reduce((acc, inv) => {
        const pendiente = parseFloat(inv.total) - parseFloat(inv.paid_amount ?? '0')
        return acc + pendiente
      }, 0)

      return { chart, totalIngresos, totalEgresos, utilidadNeta, cuentasPorCobrar }
    },
    enabled: !!organizationId,
  })

  function handleExport() {
    if (!data?.chart?.length) {
      toast({ title: 'Sin datos', description: 'No hay datos para exportar', variant: 'destructive' })
      return
    }
    const rows = [
      ['Fecha', 'Ingresos', 'Egresos', 'Utilidad Neta'],
      ...data.chart.map((d: DayBucket) => [
        d.date,
        d.ingresos.toFixed(2),
        d.egresos.toFixed(2),
        (d.ingresos - d.egresos).toFixed(2),
      ]),
      [],
      ['TOTAL', data.totalIngresos.toFixed(2), data.totalEgresos.toFixed(2), data.utilidadNeta.toFixed(2)],
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-financiero-${period}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    )
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reporte Financiero</h1>
          <p className="text-muted-foreground">Ingresos, egresos y cuentas por cobrar</p>
        </div>
        {hasPermission(PERMISSIONS.REPORT_EXPORT) && (
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={storeId} onValueChange={setStoreId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tienda" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todas las tiendas</SelectItem>
            {stores?.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Ingresos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${fmt(data?.totalIngresos ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Facturas cobradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Egresos</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${fmt(data?.totalEgresos ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Gastos y extracciones</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Utilidad Neta</CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(data?.utilidadNeta ?? 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              ${fmt(data?.utilidadNeta ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ingresos – Egresos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Por Cobrar</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              ${fmt(data?.cuentasPorCobrar ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Facturas pendientes</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Ingresos vs Egresos</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.chart?.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data.chart} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8 }}
                  formatter={(value, name) => [
                    `$${fmt(Number(value ?? 0))}`,
                    name === 'ingresos' ? 'Ingresos' : 'Egresos',
                  ]}
                />
                <Legend
                  formatter={(value) => (value === 'ingresos' ? 'Ingresos' : 'Egresos')}
                />
                <Bar dataKey="ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="egresos" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center py-12 text-muted-foreground">
              No hay datos financieros en el período seleccionado
            </p>
          )}
        </CardContent>
      </Card>

      {/* Detail table */}
      {data?.chart && data.chart.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detalle por Día</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Fecha</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-green-700">Ingresos</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-red-700">Egresos</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-blue-700">Neto del día</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.chart.map((row: DayBucket) => {
                    const neto = row.ingresos - row.egresos
                    return (
                      <tr key={row.date} className="hover:bg-muted/50">
                        <td className="px-4 py-3 text-sm">{row.date}</td>
                        <td className="px-4 py-3 text-right text-sm text-green-700">
                          ${fmt(row.ingresos)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-red-700">
                          ${fmt(row.egresos)}
                        </td>
                        <td className={`px-4 py-3 text-right text-sm font-medium ${neto >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                          ${fmt(neto)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="bg-muted font-semibold border-t-2">
                  <tr>
                    <td className="px-4 py-3 text-sm">TOTAL</td>
                    <td className="px-4 py-3 text-right text-sm text-green-700">
                      ${fmt(data.totalIngresos)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-red-700">
                      ${fmt(data.totalEgresos)}
                    </td>
                    <td className={`px-4 py-3 text-right text-sm font-bold ${data.utilidadNeta >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                      ${fmt(data.utilidadNeta)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
