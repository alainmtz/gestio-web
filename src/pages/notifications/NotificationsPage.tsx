import { useState } from 'react'
import { Bell, CheckCheck, Trash2, Loader2, Filter } from 'lucide-react'
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead, useDeleteNotification, useClearReadNotifications } from '@/hooks/useNotifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import type { NotificationType } from '@/api/notifications'

const TYPE_CONFIG: Record<NotificationType, {
  color: string
  bg: string
  label: string
}> = {
  task_assigned: { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Tarea' },
  status_change: { color: 'text-amber-600', bg: 'bg-amber-100', label: 'Estado' },
  low_stock: { color: 'text-orange-600', bg: 'bg-orange-100', label: 'Stock bajo' },
  transfer: { color: 'text-purple-600', bg: 'bg-purple-100', label: 'Transferencia' },
  movement: { color: 'text-cyan-600', bg: 'bg-cyan-100', label: 'Movimiento' },
  credit_note: { color: 'text-red-600', bg: 'bg-red-100', label: 'Nota de crédito' },
  new_invoice: { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Factura' },
  payment: { color: 'text-green-600', bg: 'bg-green-100', label: 'Pago' },
  consignment: { color: 'text-amber-600', bg: 'bg-amber-100', label: 'Consignación' },
  new_order: { color: 'text-purple-600', bg: 'bg-purple-100', label: 'Orden' },
  info: { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Info' },
}

const PAGE_SIZE = 20

export function NotificationsPage() {
  const [page, setPage] = useState(0)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all')

  const { data, isLoading } = useNotifications({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    filter,
    typeFilter,
  })

  const { data: unreadCount } = useUnreadCount()
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()
  const deleteNotification = useDeleteNotification()
  const clearRead = useClearReadNotifications()

  const notifications = data?.notifications || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  function handleNotificationClick(n: typeof notifications[number]) {
    if (!n.read) markAsRead.mutate(n.id)
    if (n.href) window.location.href = n.href
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <Bell className="h-7 w-7" />
            Notificaciones
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {(unreadCount ?? 0) > 0 ? `${unreadCount} no leídas` : 'Todas leídas'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount && unreadCount > 0 && (
            <Button size="sm" variant="outline" onClick={() => markAllAsRead.mutate()}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Marcar leídas
            </Button>
          )}
          {total > 0 && (
            <Button size="sm" variant="outline" onClick={() => clearRead.mutate()}>
              <Trash2 className="mr-2 h-4 w-4" />
              Limpiar leídas
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={filter} onValueChange={(v) => { setFilter(v as any); setPage(0) }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="unread">No leídas</SelectItem>
            <SelectItem value="read">Leídas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v as any); setPage(0) }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="task_assigned">Tareas</SelectItem>
            <SelectItem value="status_change">Cambios de estado</SelectItem>
            <SelectItem value="low_stock">Stock bajo</SelectItem>
            <SelectItem value="transfer">Transferencias</SelectItem>
            <SelectItem value="movement">Movimientos</SelectItem>
            <SelectItem value="credit_note">Notas de crédito</SelectItem>
            <SelectItem value="new_invoice">Facturas</SelectItem>
            <SelectItem value="payment">Pagos</SelectItem>
            <SelectItem value="consignment">Consignaciones</SelectItem>
            <SelectItem value="new_order">Órdenes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Bell className="h-12 w-12 opacity-30 mb-3" />
            <p className="text-lg font-medium">Sin notificaciones</p>
            <p className="text-sm">Las notificaciones aparecerán aquí cuando haya actividad relevante</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info
            return (
              <div
                key={n.id}
                className={cn(
                  'flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors hover:bg-muted/50',
                  !n.read && 'bg-muted/30 border-l-4 border-l-primary'
                )}
                onClick={() => handleNotificationClick(n)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className={`text-xs ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </Badge>
                    <p className="font-medium truncate">{n.title}</p>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{n.message}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: es })}
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:justify-end shrink-0">
                  {!n.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNotification.mutate(n.id)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page + 1} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  )
}
