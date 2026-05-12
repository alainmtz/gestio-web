import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Package, Search, ArrowDown, ArrowUp, Store } from 'lucide-react'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'
import { Skeleton } from '@/components/ui/skeleton'

interface LowStockItem {
  product_id: string
  product_name: string
  sku: string
  store_id: string
  store_name: string
  quantity: number
  threshold: number
  cost?: number
  category_name?: string
}

interface InventoryRow {
  id: string
  product_id: string
  store_id: string
  quantity: number
  product: { name: string; sku: string; cost: number; category?: { name: string } } | null
  store: { name: string } | null
}

export function LowStockPage() {
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const { hasPermission } = usePermissions()
  const [searchTerm, setSearchTerm] = useState('')
  const [storeFilter, setStoreFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning'>('all')
  const [sortBy, setSortBy] = useState<'quantity' | 'ratio'>('ratio')

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

  const { data: lowStockItems, isLoading } = useQuery({
    queryKey: ['lowStock', organizationId],
    queryFn: async () => {
      const { data: inventory } = await supabase
        .from('inventory')
        .select(`
          id,
          product_id,
          store_id,
          quantity,
          product:products(id, name, sku, cost, category_id, category:product_categories(name)),
          store:stores(name)
        `)
        .eq('product.organization_id', organizationId)

      const { data: thresholds } = await supabase
        .from('product_thresholds')
        .select('product_id, store_id, low_stock_threshold')
        .eq('organization_id', organizationId)

      if (!inventory) return []

      const thresholdMap = new Map<string, Map<string, number>>()
      thresholds?.forEach(t => {
        if (!thresholdMap.has(t.product_id)) thresholdMap.set(t.product_id, new Map())
        thresholdMap.get(t.product_id)!.set(t.store_id, t.low_stock_threshold)
      })

      const items: LowStockItem[] = []
      for (const inv of (inventory as unknown) as InventoryRow[]) {
        const threshold = thresholdMap.get(inv.product_id)?.get(inv.store_id) ?? 10
        if (inv.quantity < threshold) {
          items.push({
            product_id: inv.product_id,
            product_name: inv.product?.name || 'Sin nombre',
            sku: inv.product?.sku || '',
            store_id: inv.store_id,
            store_name: inv.store?.name || 'Sin tienda',
            quantity: inv.quantity,
            threshold,
            cost: inv.product?.cost,
            category_name: inv.product?.category?.name,
          })
        }
      }
      return items
    },
    enabled: !!organizationId,
  })

  const filtered = (lowStockItems || [])
    .filter(item => {
      if (searchTerm && !item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) && !item.sku.toLowerCase().includes(searchTerm.toLowerCase())) return false
      if (storeFilter !== 'all' && item.store_id !== storeFilter) return false
      if (severityFilter === 'critical' && item.quantity > 0) return false
      if (severityFilter === 'warning' && item.quantity === 0) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'quantity') return a.quantity - b.quantity
      return (a.quantity / a.threshold) - (b.quantity / b.threshold)
    })

  if (!hasPermission(PERMISSIONS.PRODUCT_VIEW)) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold">Sin acceso</h2>
        <p className="text-sm text-muted-foreground">No tienes permiso para ver las alertas de stock.</p>
      </div>
    )
  }

  const criticalCount = (lowStockItems || []).filter(i => i.quantity === 0).length
  const warningCount = (lowStockItems || []).filter(i => i.quantity > 0).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_hsl(142_71%_45%/0.6)]" />
            <h1 className="text-lg font-semibold tracking-tight">Alertas de Stock Bajo</h1>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground monospace">Productos con inventario por debajo del umbral</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border/60 bg-card/80 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-2"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
            <div><p className="text-sm text-muted-foreground">Sin stock</p><p className="text-2xl font-bold text-destructive">{criticalCount}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/80 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-500/10 p-2"><Package className="h-5 w-5 text-amber-500" /></div>
            <div><p className="text-sm text-muted-foreground">Stock bajo</p><p className="text-2xl font-bold text-amber-500">{warningCount}</p></div>
          </div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/80 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2"><Store className="h-5 w-5 text-primary" /></div>
            <div><p className="text-sm text-muted-foreground">Total alertas</p><p className="text-2xl font-bold">{(lowStockItems || []).length}</p></div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/80 p-4">
        <p className="text-xs font-medium text-muted-foreground monospace tracking-wider uppercase mb-3">
          <AlertTriangle className="h-3.5 w-3.5 inline mr-1.5" />
          Productos con stock bajo
        </p>
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar producto o SKU..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <Select value={storeFilter} onValueChange={setStoreFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Todas las tiendas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {stores?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={v => setSeverityFilter(v as 'all' | 'critical' | 'warning')}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Severidad" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="critical">Sin stock</SelectItem>
                <SelectItem value="warning">Stock bajo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={v => setSortBy(v as 'quantity' | 'ratio')}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Ordenar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ratio">Menor ratio</SelectItem>
                <SelectItem value="quantity">Menor cantidad</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="mx-auto h-8 w-8 mb-2" />
              <p>No hay alertas de stock bajo</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(item => (
                <div key={`${item.product_id}-${item.store_id}`} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-2 ${item.quantity === 0 ? 'bg-destructive/10' : 'bg-amber-500/10'}`}>
                      {item.quantity === 0 ? <ArrowDown className="h-4 w-4 text-destructive" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">{item.sku} {item.category_name && <>· {item.category_name}</>}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{item.store_name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={item.quantity === 0 ? 'destructive' : 'outline'} className="text-xs">
                          {item.quantity} / {item.threshold}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  )
}
