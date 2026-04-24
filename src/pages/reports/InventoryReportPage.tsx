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
import { Boxes, Download, AlertTriangle, Package } from 'lucide-react'
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

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
      if (!organizationId) return { inventory: [], lowStock: [], categories: [] }

      let query = supabase
        .from('inventory')
        .select('*, product:products(name, sku, category_id, category:product_categories(name)), store:stores(name)')
        .eq('organization_id', organizationId)

      if (storeId && storeId !== '_all') {
        query = query.eq('store_id', storeId)
      }

      const { data: inventory } = await query

      const lowStock = inventory?.filter(
        (inv) => inv.quantity <= 5
      ) || []

      const byCategory: Record<string, number> = {}
      inventory?.forEach((inv) => {
        const cat = inv.product?.category?.name || 'Sin categoría'
        byCategory[cat] = (byCategory[cat] || 0) + inv.quantity
      })

      const categories = Object.entries(byCategory).map(([name, value]) => ({
        name,
        value,
      }))

      const totalValue = inventory?.reduce(
        (acc, inv) => acc + (inv.quantity * parseFloat(inv.product?.cost || '0')),
        0
      ) || 0

      return { inventory: inventory || [], lowStock, categories, totalValue, totalItems: inventory?.length || 0 }
    },
    enabled: !!organizationId,
  })

  const handleExport = () => {
    if (!data?.inventory?.length) {
      toast({ title: 'Sin datos', description: 'No hay datos para exportar', variant: 'destructive' })
      return
    }

    const csv = [
      ['Producto', 'SKU', 'Tienda', 'Cantidad', 'Reservado'],
      ...data.inventory.map((inv: any) => [
        inv.product?.name || '',
        inv.product?.sku || '',
        inv.store?.name || '',
        inv.quantity,
        inv.reserved_quantity,
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalItems || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor Total</CardTitle>
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
              {data?.lowStock?.length || 0}
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
            {data?.inventory?.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.inventory.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey={(inv: any) => inv.product?.name?.slice(0, 15)}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8 }}
                    formatter={(value: number) => [value, 'Cantidad']}
                  />
                  <Bar dataKey="quantity" fill="#0088FE" name="Stock" />
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
            <CardTitle>Distribución por Producto</CardTitle>
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

      {(data?.lowStock?.length ?? 0) > 0 && (
        <Card className="border-amber-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Productos con Stock Bajo
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
                    <th className="px-4 py-2 text-left text-sm font-medium">Disponible</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data?.lowStock?.slice(0, 10).map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-muted/50">
                      <td className="px-4 py-2">{inv.product?.name || '-'}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {inv.product?.sku || '-'}
                      </td>
                      <td className="px-4 py-2">{inv.store?.name || '-'}</td>
                      <td className="px-4 py-2 font-medium text-amber-600">
                        {inv.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}