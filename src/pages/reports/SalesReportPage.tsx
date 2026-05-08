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
  Legend,
} from 'recharts'
import { useToast } from '@/lib/toast'
import { Skeleton } from '@/components/ui/skeleton'

const CURRENCY_COLORS: Record<string, string> = {
  CUP: '#10b981',
  USD: '#3b82f6',
  EUR: '#f59e0b',
}
const FALLBACK_COLOR = '#8b5cf6'

interface SalesDay {
  date: string
  total: number
  count: number
  byCurrency: Record<string, number>
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
      if (!organizationId) return { sales: [], currencies: [] as string[], totalsByCurrency: {} as Record<string, number>, totalSales: 0, totalCount: 0 }

      let startDate = new Date()
      if (period === '7d') startDate.setDate(startDate.getDate() - 7)
      else if (period === '30d') startDate.setDate(startDate.getDate() - 30)
      else if (period === '90d') startDate.setDate(startDate.getDate() - 90)
      else if (period === 'year') startDate.setFullYear(startDate.getFullYear() - 1)

      const startDateStr = startDate.toISOString().split('T')[0]

      let query = supabase
        .from('invoices')
        .select('created_at, total, currency:currencies(code), payment_status')
        .eq('organization_id', organizationId)
        .gte('created_at', startDateStr)
        .eq('payment_status', 'paid')

      if (storeId && storeId !== '_all') {
        query = query.eq('store_id', storeId)
      }

      const { data: invoices } = await query

      const salesByDate: Record<string, SalesDay> = {}
      const totalsByCurrency: Record<string, number> = {}
      const currencySet = new Set<string>()

      invoices?.forEach((inv: any) => {
        const date = inv.created_at.split('T')[0]
        const code = inv.currency?.code || 'CUP'
        currencySet.add(code)

        if (!salesByDate[date]) {
          salesByDate[date] = { date, total: 0, count: 0, byCurrency: {} }
        }
        const day = salesByDate[date]
        const amount = parseFloat(inv.total.toString())
        day.total += amount
        day.count += 1
        day.byCurrency[code] = (day.byCurrency[code] || 0) + amount
        totalsByCurrency[code] = (totalsByCurrency[code] || 0) + amount
      })

      const currencies = Array.from(currencySet).sort()
      const sales = Object.values(salesByDate)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(day => {
          const flat: Record<string, number> = {}
          for (const code of currencies) {
            flat[`_${code}`] = day.byCurrency[code] || 0
          }
          return { ...day, ...flat }
        })

      const totalSales = sales.reduce((acc, s) => acc + s.total, 0)
      const totalCount = sales.reduce((acc, s) => acc + s.count, 0)

      return { sales, currencies, totalsByCurrency, totalSales, totalCount }
    },
    enabled: !!organizationId,
  })

  const handleExport = () => {
    if (!data?.sales?.length) {
      toast({ title: 'Sin datos', description: 'No hay datos para exportar', variant: 'destructive' })
      return
    }

    const currencyHeaders = data.currencies || []
    const headers = ['Fecha', ...currencyHeaders.map(c => `Total ${c}`), 'Total General', 'Cantidad']
    const csv = [
      headers,
      ...data.sales.map((s: SalesDay) => [
        s.date,
        ...currencyHeaders.map(c => (s.byCurrency[c] || 0).toFixed(2)),
        s.total.toFixed(2),
        s.count,
      ]),
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

      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min((data?.currencies?.length || 0) + 2, 4)}, 1fr)` }}>
        {data?.currencies?.map(code => (
          <Card key={code}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total en {code}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: CURRENCY_COLORS[code] || FALLBACK_COLOR }}>
                ${(data.totalsByCurrency[code] || 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total General</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(data?.totalSales || 0).toFixed(2)}</div>
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
                  formatter={(value, name) => [`$${(Number(value) || 0).toFixed(2)}`, name === 'total' ? 'Total' : name]}
                />
                <Legend />
                {data.currencies?.map((code) => (
                  <Line
                    key={code}
                    type="monotone"
                    dataKey={`_${code}`}
                    name={code}
                    stroke={CURRENCY_COLORS[code] || FALLBACK_COLOR}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
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