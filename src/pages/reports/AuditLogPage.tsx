import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Shield, Search, Download, User, Table2, Clock } from 'lucide-react'
import { useToast } from '@/lib/toast'
import { Skeleton } from '@/components/ui/skeleton'

const TABLES = [
  'products', 'customers', 'invoices', 'offers', 'stores', 'consignments', 
  'teams', 'cash_registers', 'inventory', 'inventory_movements'
]

const ACTIONS = ['INSERT', 'UPDATE', 'DELETE']

export function AuditLogPage() {
  const [table, setTable] = useState<string>('')
  const [action, setAction] = useState<string>('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 50
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const { toast } = useToast()
  const { hasPermission } = usePermissions()

  const { data, isLoading } = useQuery({
    queryKey: ['auditLogs', organizationId, table, action, page],
    queryFn: async () => {
      if (!organizationId) return { logs: [], count: 0 }

      let query = supabase
        .from('audit_logs')
        .select('*, user:profiles(full_name, email)', { count: 'exact' })
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

      if (table) {
        query = query.eq('table_name', table)
      }
      if (action) {
        query = query.eq('action', action)
      }

      const { data: logs, count } = await query
      return { logs: logs || [], count: count || 0 }
    },
    enabled: !!organizationId,
  })

  const logs = data?.logs || []
  const totalCount = data?.count || 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const filteredLogs = search
    ? logs.filter((log) => {
        const userName = log.user?.full_name || ''
        const userEmail = log.user?.email || ''
        return (
          userName.toLowerCase().includes(search.toLowerCase()) ||
          userEmail.toLowerCase().includes(search.toLowerCase()) ||
          log.table_name.toLowerCase().includes(search.toLowerCase())
        )
      })
    : logs

  const handleExport = () => {
    if (!filteredLogs?.length) {
      toast({ title: 'Sin datos', description: 'No hay datos para exportar', variant: 'destructive' })
      return
    }

    const csv = [
      ['Fecha', 'Usuario', 'Tabla', 'Acción', 'Registro ID'],
      ...filteredLogs.map((log: any) => [
        log.created_at,
        log.user?.full_name || log.user?.email || '',
        log.table_name,
        log.action,
        log.record_id || '',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'audit-log.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT': return 'default'
      case 'UPDATE': return 'secondary'
      case 'DELETE': return 'destructive'
      default: return 'outline'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Log de Auditoría</h1>
          <p className="text-muted-foreground">Historial de cambios en el sistema</p>
        </div>
        {hasPermission(PERMISSIONS.REPORT_EXPORT) && (
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        )}
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por usuario o tabla..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={table || '_all'} onValueChange={(v) => setTable(v === '_all' ? '' : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todas las tablas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todas las tablas</SelectItem>
            {TABLES.map((t) => (
              <SelectItem key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={action || '_all'} onValueChange={(v) => setAction(v === '_all' ? '' : v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Todas las acciones" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todas</SelectItem>
            {ACTIONS.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Historial de Auditoría
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(!filteredLogs || filteredLogs.length === 0) ? (
            <p className="text-center py-12 text-muted-foreground">
              No hay registros de auditoría
            </p>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Fecha</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Usuario</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Tabla</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Acción</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">ID Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredLogs?.map((log: any) => (
                    <tr key={log.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {new Date(log.created_at).toLocaleString('es-ES')}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {log.user?.full_name || log.user?.email || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Table2 className="h-4 w-4 text-muted-foreground" />
                          {log.table_name}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getActionColor(log.action)}>{log.action}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                        {log.record_id?.slice(0, 8) || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {totalCount} registros — página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}