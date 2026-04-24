import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useInvoices } from '@/hooks/useBilling'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, FileText, Eye, Download } from 'lucide-react'
import { useStores } from '@/hooks/useStores'
import { Skeleton } from '@/components/ui/skeleton'
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facturas</h1>
          <p className="text-muted-foreground">Gestiona tus facturas</p>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Lista de Facturas ({total})
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
              <div className="rounded-md border">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">Número</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Cliente</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Total</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Estado</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Pago</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Fecha</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invoices.map((invoice) => {
                      const status = statusLabels[invoice.status] || { label: invoice.status, variant: 'secondary' as const }
                      const payment = paymentLabels[invoice.payment_status] || { label: invoice.payment_status, variant: 'secondary' as const }
                      return (
                        <tr key={invoice.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3 font-medium">
                            <Link to={`/billing/invoices/${invoice.id}`} className="hover:underline">
                              {invoice.number}
                            </Link>
                          </td>
                          <td className="px-4 py-3">{invoice.customer?.name || '-'}</td>
                          <td className="px-4 py-3">${invoice.total.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={payment.variant}>{payment.label}</Badge>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('es-ES') : '-'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Link to={`/billing/invoices/${invoice.id}`}>
                                <Button variant="ghost" size="icon">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Link to={`/billing/invoices/${invoice.id}`}>
                                <Button variant="ghost" size="icon" title="Ver detalle">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
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
