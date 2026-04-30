import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useOffers } from '@/hooks/useBilling'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, FileText, Eye, Calendar, DollarSign } from 'lucide-react'
import { useStores } from '@/hooks/useStores'
import { useToast } from '@/lib/toast'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' }> = {
  draft: { label: 'Borrador', variant: 'secondary' },
  sent: { label: 'Enviada', variant: 'default' },
  accepted: { label: 'Aceptada', variant: 'success' },
  rejected: { label: 'Rechazada', variant: 'destructive' },
  expired: { label: 'Expirada', variant: 'destructive' },
}

export function OffersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [storeFilter, setStoreFilter] = useState<string>('_all')

  const { data: storesData } = useStores()
  const { data, isLoading } = useOffers({
    search: search || undefined,
    status: statusFilter || undefined,
    storeId: storeFilter !== '_all' ? storeFilter : undefined,
    page,
    pageSize: 20,
  })
  const { hasPermission } = usePermissions()

  const offers = data?.offers || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ofertas</h1>
          <p className="text-muted-foreground">Gestiona tus ofertas y cotizaciones</p>
        </div>
        {hasPermission(PERMISSIONS.OFFER_CREATE) && (
          <Link to="/billing/offers/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Oferta
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar ofertas..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Tienda:</Label>
            <Select value={storeFilter} onValueChange={(v) => { setStoreFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todas</SelectItem>
                {storesData?.map((store) => (
                  <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Estado:</Label>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todos</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="sent">Enviada</SelectItem>
                <SelectItem value="accepted">Aceptada</SelectItem>
                <SelectItem value="rejected">Rechazada</SelectItem>
                <SelectItem value="expired">Expirada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Lista de Ofertas ({total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {offers.map((offer) => {
                  const status = statusLabels[offer.status] || { label: offer.status, variant: 'secondary' as const }
                  return (
                    <div key={offer.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="rounded-full bg-primary/10 p-2">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <Link to={`/billing/offers/${offer.id}`} className="font-medium hover:underline">{offer.number}</Link>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span>{offer.customer?.name || '-'}</span>
                            <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />${offer.total.toFixed(2)}</span>
                            {offer.valid_until && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(offer.valid_until).toLocaleDateString()}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={status.variant}>{status.label}</Badge>
                        <Link to={`/billing/offers/${offer.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                      Anterior
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
