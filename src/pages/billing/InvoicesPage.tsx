import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useInvoices } from '@/hooks/useBilling'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, FileText, Eye, Download, Calendar } from 'lucide-react'
import { useStores } from '@/hooks/useStores'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' }> = {
  draft: { label: 'Borrador', variant: 'secondary' },
  issued: { label: 'Emitida', variant: 'default' },
  paid: { label: 'Pagada', variant: 'success' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
}

const paymentLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' }> = {
  pending: { label: 'Pendiente', variant: 'secondary' },
  partial: { label: 'Parcial', variant: 'default' },
  paid: { label: 'Pagada', variant: 'success' },
}

export function InvoicesPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [storeFilter, setStoreFilter] = useState<string>('')

  const { data: storesData } = useStores()
  const { data, isLoading } = useInvoices({
    search: search || undefined,
    status: statusFilter || undefined,
    storeId: storeFilter || undefined,
    page,
    pageSize: 20,
  })
  const { hasPermission } = usePermissions()

  const invoices = data?.invoices || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_hsl(142_71%_45%/0.6)]" />
            <h1 className="text-lg font-semibold tracking-tight">Facturas</h1>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground monospace">
            Gestiona tus facturas
          </p>
        </div>
        {hasPermission(PERMISSIONS.INVOICE_CREATE) && (
          <Link to="/billing/invoices/new">
            <Button><Plus className="mr-2 h-4 w-4" />Nueva Factura</Button>
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar facturas..."
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
                <SelectItem value="issued">Emitida</SelectItem>
                <SelectItem value="paid">Pagada</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/80 p-4">
        <p className="text-xs font-medium text-muted-foreground monospace tracking-wider uppercase mb-3">
          <FileText className="h-3.5 w-3.5 inline mr-1.5" />Lista de Facturas ({total})
        </p>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 rounded-lg border border-border/40 bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {invoices.map((invoice) => {
                const status = statusLabels[invoice.status] || { label: invoice.status, variant: 'secondary' as const }
                const payment = paymentLabels[invoice.payment_status] || { label: invoice.payment_status, variant: 'secondary' as const }
                return (
                  <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="rounded-full bg-primary/10 p-2">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <Link to={`/billing/invoices/${invoice.id}`} className="font-medium hover:underline">{invoice.number}</Link>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span>{invoice.customer?.name || '-'}</span>
                          <span className="flex items-center gap-1">{invoice.currency?.code || 'CUP'} ${invoice.total.toFixed(2)}</span>
                          {invoice.created_at && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(invoice.created_at).toLocaleDateString('es-ES')}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={status.variant}>{status.label}</Badge>
                      <Badge variant={payment.variant}>{payment.label}</Badge>
                      <Link to={`/billing/invoices/${invoice.id}`}>
                        <Button variant="ghost" size="icon" title="Ver detalle">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link to={`/billing/invoices/${invoice.id}`}>
                        <Button variant="ghost" size="icon" title="Descargar">
                          <Download className="h-4 w-4" />
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
