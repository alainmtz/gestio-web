import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePreInvoices } from '@/hooks/useBilling'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, FileText, Eye, Calendar } from 'lucide-react'
import { useStores } from '@/hooks/useStores'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { PreInvoice } from '@/api/billing'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'
import { cn } from '@/lib/utils'

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' }> = {
  draft: { label: 'Borrador', variant: 'secondary' },
  pending_approval: { label: 'Pendiente', variant: 'default' },
  approved: { label: 'Aprobada', variant: 'success' },
  rejected: { label: 'Rechazada', variant: 'destructive' },
}

export function PreInvoicesPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [storeFilter, setStoreFilter] = useState<string>('')
  const { hasPermission } = usePermissions()

  const { data: storesData } = useStores()
  const { data, isLoading } = usePreInvoices({
    search: search || undefined,
    status: statusFilter || undefined,
    storeId: storeFilter || undefined,
    page,
    pageSize: 20,
  })

  const preInvoices = data?.preInvoices || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_hsl(142_71%_45%/0.6)]" />
            <h1 className="text-lg font-semibold tracking-tight">Prefacturas</h1>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground monospace">
            Gestiona tus prefacturas y presupuestos
          </p>
        </div>
        {hasPermission(PERMISSIONS.PREINVOICE_CREATE) && (
          <Link to="/billing/preinvoices/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Prefactura
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar prefacturas..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Tienda:</Label>
            <Select value={storeFilter || '_all'} onValueChange={(v) => { setStoreFilter(v === '_all' ? '' : v); setPage(1); }}>
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
            <Select value={statusFilter || '_all'} onValueChange={(v) => { setStatusFilter(v === '_all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todos</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="pending_approval">Pendiente</SelectItem>
                <SelectItem value="approved">Aprobada</SelectItem>
                <SelectItem value="rejected">Rechazada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* List card */}
      <div className="rounded-xl border border-border/60 bg-card/80 p-4">
        <p className="text-xs font-medium text-muted-foreground monospace tracking-wider uppercase mb-3">
          <FileText className="h-3.5 w-3.5 inline mr-1.5" />Lista de Prefacturas ({total})
        </p>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 rounded-lg border border-border/40 bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {preInvoices.map((preInvoice) => {
                const status = statusLabels[preInvoice.status] || { label: preInvoice.status, variant: 'secondary' as const }
                return (
                  <div key={preInvoice.id} className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-colors hover:bg-muted/50",
                    "border-border/40 hover:border-border/60"
                  )}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="rounded-lg bg-secondary/60 p-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <Link to={`/billing/preinvoices/${preInvoice.id}`} className="font-medium hover:underline">{preInvoice.number}</Link>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span>{preInvoice.customer?.name || '-'}</span>
                          <span className="flex items-center gap-1">{preInvoice.currency?.code || 'CUP'} ${preInvoice.total.toFixed(2)}</span>
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(preInvoice.created_at).toLocaleDateString('es-ES')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={status.variant}>{status.label}</Badge>
                      <Link to={`/billing/preinvoices/${preInvoice.id}`}>
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
      </div>
    </div>
  )
}
