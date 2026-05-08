import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Boxes, Download, AlertTriangle } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { useToast } from '@/lib/toast'
import { Skeleton } from '@/components/ui/skeleton'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

interface InventoryRow {
  id: string
  organization_id: string
  product_id: string
  variant_id: string | null
  store_id: string
  quantity: number
  reserved_quantity: number
  min_quantity: number
  max_quantity: number | null
  product: { name: string; sku: string; cost: string; price: string; category_id: string | null; category: { name: string } | null } | null
  variant: { sku: string; name: string } | null
  store: { name: string } | null
}

interface ProductSummary {
  name: string
  sku: string
  cost: number
  totalQuantity: number
  totalReserved: number
  stores: { name: string; quantity: number; reserved: number; min_quantity: number }[]
}

export function InventoryReportPage() {
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
    queryKey: ['inventoryReport', organizationId, storeId],
    queryFn: async () => {
      if (!organizationId) return { inventory: [], productSummaries: [], lowStock: [], categories: [], totalUnits: 0, totalValue: 0, lowStockCount: 0 }

      let query = supabase
        .from('inventory')
        .select('*, product:products(name, sku, category_id, category:product_categories(name), cost, price), variant:product_variants(name, sku), store:stores(name)')
        .eq('organization_id', organizationId)

      if (storeId && storeId !== '_all') {
        query = query.eq('store_id', storeId)
      }

      const { data: inventory } = await query

      if (!inventory || inventory.length === 0) {
        return { inventory: [], productSummaries: [], lowStock: [], categories: [], totalUnits: 0, totalValue: 0, lowStockCount: 0 }
      }

      const rows = inventory as InventoryRow[]

      const lowStock = rows.filter(
        (inv) => inv.quantity <= inv.min_quantity
      )

      const byCategory: Record<string, number> = {}
      rows.forEach((inv) => {
        const cat = inv.product?.category?.name || 'Sin categoría'
        byCategory[cat] = (byCategory[cat] || 0) + inv.quantity
      })
      const categories = Object.entries(byCategory).map(([name, value]) => ({ name, value }))

      const totalUnits = rows.reduce((acc, inv) => acc + inv.quantity, 0)

      const totalValue = rows.reduce(
        (acc, inv) => acc + (inv.quantity * (parseFloat(inv.product?.cost || '0'))),
        0
      )

      const productMap = new Map<string, ProductSummary>()
      rows.forEach((inv) => {
        const pid = inv.product_id
        if (!productMap.has(pid)) {
          productMap.set(pid, {
            name: inv.product?.name || 'Desconocido',
            sku: inv.product?.sku || '-',
            cost: parseFloat(inv.product?.cost || '0'),
            totalQuantity: 0,
            totalReserved: 0,
            stores: [],
          })
        }
        const summary = productMap.get(pid)!
        summary.totalQuantity += inv.quantity
        summary.totalReserved += inv.reserved_quantity
        summary.stores.push({
          name: inv.store?.name || 'Sin tienda',
          quantity: inv.quantity,
          reserved: inv.reserved_quantity,
          min_quantity: inv.min_quantity,
        })
      })
      const productSummaries = Array.from(productMap.values())
        .sort((a, b) => b.totalQuantity - a.totalQuantity)

      return {
        inventory: rows,
        productSummaries,
        lowStock,
        categories,
        totalUnits,
        totalValue,
        lowStockCount: lowStock.length,
      }
    },
    enabled: !!organizationId,
  })

  const handleExport = () => {
    if (!data?.inventory?.length) {
      toast({ title: 'Sin datos', description: 'No hay datos para exportar', variant: 'destructive' })
      return
    }

    const csv = [
      ['Producto', 'SKU', 'Variante', 'Tienda', 'Cantidad', 'Reservado', 'Disponible'],
      ...data.inventory.map((inv: InventoryRow) => [
        inv.product?.name || '',
        inv.product?.sku || '',
        inv.variant?.name || '',
        inv.store?.name || '',
        inv.quantity,
        inv.reserved_quantity,
        inv.quantity - inv.reserved_quantity,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'reporte-inventario.csv'
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
          <h1 className="text-3xl font-bold tracking-tight">Reporte de Inventario</h1>
          <p className="text-muted-foreground">Estado actual del inventario</p>
        </div>
        {hasPermission(PERMISSIONS.REPORT_EXPORT) && (
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        )}
      </div>

      <div className="flex gap-4">
        <Select value={storeId} onValueChange={setStoreId}>
          <SelectTrigger className="w-[200px]">
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Unidades Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalUnits || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor Total (costo)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(data?.totalValue || 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stock Bajo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {data?.lowStockCount || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inventario por Producto</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.productSummaries?.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.productSummaries.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey={(p: ProductSummary) => p.name.slice(0, 15)}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8 }}
                    formatter={(value, _name, props) => [
                      value,
                      props.payload.totalReserved > 0
                        ? `Stock: ${props.payload.totalQuantity} (reservado: ${props.payload.totalReserved})`
                        : `Stock: ${value}`,
                    ]}
                  />
                  <Bar dataKey="totalQuantity" fill="#0088FE" name="Stock total" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center py-12 text-muted-foreground">
                No hay datos de inventario
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.categories?.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.categories.slice(0, 5)}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }: any) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {data.categories.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center py-12 text-muted-foreground">
                No hay datos de inventario
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {data?.lowStock?.length ? (
        <Card className="border-amber-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Productos con Stock Bajo ({data.lowStock.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full">
                <thead className="bg-amber-50 dark:bg-amber-950">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium">Producto</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">SKU</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Tienda</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Actual</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Mínimo</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Diferencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.lowStock.slice(0, 10).map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/50">
                      <td className="px-4 py-2">
                        <div>
                          {inv.product?.name || '-'}
                          {inv.variant?.name && (
                            <span className="text-xs text-muted-foreground ml-1">({inv.variant.name})</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {inv.variant?.sku || inv.product?.sku || '-'}
                      </td>
                      <td className="px-4 py-2">{inv.store?.name || '-'}</td>
                      <td className="px-4 py-2 font-medium text-amber-600">
                        {inv.quantity}
                      </td>
                      <td className="px-4 py-2">{inv.min_quantity}</td>
                      <td className="px-4 py-2 font-medium text-red-600">
                        {(inv.quantity - inv.min_quantity).toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-500">
          <CardContent className="py-8 text-center text-green-600">
            <Boxes className="h-8 w-8 mx-auto mb-2" />
            <p className="font-medium">Todo el inventario está por encima del mínimo</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
