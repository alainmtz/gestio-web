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
import { Download } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useToast } from '@/lib/toast'
import { Skeleton } from '@/components/ui/skeleton'

interface SalesData {
  date: string
  total: number
  count: number
}

const PERIODS = [
  { value: '7d', label: 'Últimos 7 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: '90d', label: 'Últimos 90 días' },
  { value: 'year', label: 'Este año' },
]

export function SalesReportPage() {
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
    queryKey: ['salesReport', organizationId, period, storeId],
    queryFn: async () => {
      if (!organizationId) return { sales: [], byPayment: [] }

      let startDate = new Date()
      if (period === '7d') startDate.setDate(startDate.getDate() - 7)
      else if (period === '30d') startDate.setDate(startDate.getDate() - 30)
      else if (period === '90d') startDate.setDate(startDate.getDate() - 90)
      else if (period === 'year') startDate.setFullYear(startDate.getFullYear() - 1)

      const startDateStr = startDate.toISOString().split('T')[0]

      let query = supabase
        .from('invoices')
        .select('created_at, total, payment_status')
        .eq('organization_id', organizationId)
        .gte('created_at', startDateStr)
        .eq('payment_status', 'paid')

      if (storeId && storeId !== '_all') {
        query = query.eq('store_id', storeId)
      }

      const { data: invoices } = await query

      const salesByDate: Record<string, SalesData> = {}
      const salesByPayment: Record<string, number> = {}

      invoices?.forEach((inv) => {
        const date = inv.created_at.split('T')[0]
        if (!salesByDate[date]) {
          salesByDate[date] = { date, total: 0, count: 0 }
        }
        salesByDate[date].total += parseFloat(inv.total.toString())
        salesByDate[date].count += 1
      })

      const sales = Object.values(salesByDate)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30)

      const totalSales = sales.reduce((acc, s) => acc + s.total, 0)
      const totalCount = sales.reduce((acc, s) => acc + s.count, 0)

      return { sales, totalSales, totalCount }
    },
    enabled: !!organizationId,
  })

  const handleExport = () => {
    if (!data?.sales?.length) {
      toast({ title: 'Sin datos', description: 'No hay datos para exportar', variant: 'destructive' })
      return
    }

    const csv = [
      ['Fecha', 'Total', 'Cantidad'],
      ...data.sales.map((s: SalesData) => [s.date, s.total.toFixed(2), s.count]),
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-ventas-${period}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reporte de Ventas</h1>
          <p className="text-muted-foreground">Análisis de ventas por período</p>
        </div>
        {hasPermission(PERMISSIONS.REPORT_EXPORT) && (
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        )}
      </div>

      <div className="flex gap-4">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(data?.totalSales || 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transacciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${data?.totalCount ? (data.totalSales / data.totalCount).toFixed(2) : '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ventas por Día</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.sales?.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.sales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8 }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Ventas']}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center py-12 text-muted-foreground">
              No hay datos de ventas en el período seleccionado
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}