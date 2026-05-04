import { useState, useMemo } from 'react'
import { Bell, CheckCheck, Trash2, Loader2, Search } from 'lucide-react'
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead, useDeleteNotification, useClearReadNotifications } from '@/hooks/useNotifications'
import { NOTIFICATION_TYPE_CONFIG } from '@/config/notifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { cn } from '@/lib/utils'
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import type { NotificationType } from '@/api/notifications'

type DateGroupKey = 'today' | 'yesterday' | 'this_week' | 'older'

const DATE_GROUP_LABELS: Record<DateGroupKey, string> = {
  today: 'Hoy',
  yesterday: 'Ayer',
  this_week: 'Esta semana',
  older: 'Anteriores',
}

function getDateGroup(date: Date): DateGroupKey {
  if (isToday(date)) return 'today'
  if (isYesterday(date)) return 'yesterday'
  if (isThisWeek(date)) return 'this_week'
  return 'older'
}

const PAGE_SIZE = 20

export function NotificationsPage() {
  const [page, setPage] = useState(0)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all')
  const [search, setSearch] = useState('')

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

  const filteredNotifications = useMemo(() => {
    if (!search.trim()) return notifications
    const q = search.toLowerCase()
    return notifications.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.message.toLowerCase().includes(q)
    )
  }, [notifications, search])

  function handleNotificationClick(n: typeof notifications[number]) {
    if (!n.read) markAsRead.mutate(n.id)
    if (n.href) window.location.href = n.href
  }

  const paginationRange = useMemo(() => {
    const pages: (number | string)[] = []
    const maxVisible = 5
    if (totalPages <= maxVisible + 2) {
      for (let i = 0; i < totalPages; i++) pages.push(i)
    } else {
      pages.push(0)
      const start = Math.max(1, page - 1)
      const end = Math.min(totalPages - 2, page + 1)
      if (start > 1) pages.push('...')
      for (let i = start; i <= end; i++) pages.push(i)
      if (end < totalPages - 2) pages.push('...')
      pages.push(totalPages - 1)
    }
    return pages
  }, [totalPages, page])

  const hasNotifications = total > 0
  const isEmpty = !hasNotifications && !isLoading
  const isSearchEmpty = search.trim() && filteredNotifications.length === 0 && !isLoading

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
            <Button size="sm" variant="outline" onClick={() => markAllAsRead.mutate()} aria-label="Marcar todas como leídas">
              <CheckCheck className="mr-2 h-4 w-4" />
              Marcar leídas
            </Button>
          )}
          {hasNotifications && (
            <Button size="sm" variant="outline" onClick={() => clearRead.mutate()} aria-label="Limpiar notificaciones leídas">
              <Trash2 className="mr-2 h-4 w-4" />
              Limpiar leídas
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar notificaciones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-full sm:w-[240px]"
            aria-label="Buscar notificaciones"
          />
        </div>
        <Select value={filter} onValueChange={(v) => { setFilter(v as 'all' | 'unread' | 'read'); setPage(0) }}>
          <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filtrar por estado">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="unread">No leídas</SelectItem>
            <SelectItem value="read">Leídas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v as NotificationType | 'all'); setPage(0) }}>
          <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filtrar por tipo">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {Object.entries(NOTIFICATION_TYPE_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : isEmpty || isSearchEmpty ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <div className="rounded-full border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-6 mb-4">
              <Bell className="h-10 w-10 opacity-30" />
            </div>
            <p className="text-lg font-medium">
              {isSearchEmpty
                ? 'Sin resultados'
                : filter === 'unread'
                  ? '¡Estás al día!'
                  : 'Sin notificaciones'}
            </p>
            <p className="text-sm mt-1">
              {isSearchEmpty
                ? `No se encontraron notificaciones con "${search}"`
                : filter === 'unread'
                  ? 'No tienes notificaciones pendientes'
                  : 'Las notificaciones aparecerán aquí cuando haya actividad relevante'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((n) => {
            const cfg = NOTIFICATION_TYPE_CONFIG[n.type] || NOTIFICATION_TYPE_CONFIG.info
            const Icon = cfg.icon
            return (
              <div
                key={n.id}
                className={cn(
                  'flex items-start gap-4 rounded-lg border p-4 cursor-pointer transition-all hover:bg-muted/50 animate-in fade-in slide-in-from-top-2 duration-300',
                  !n.read && 'bg-muted/30 border-l-4 border-l-primary'
                )}
                onClick={() => handleNotificationClick(n)}
                role="button"
                tabIndex={0}
                aria-label={`Notificación: ${n.title}`}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNotificationClick(n) } }}
              >
                <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', cfg.bg)}>
                  <Icon className={cn('h-4 w-4', cfg.color)} />
                </div>
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
                    aria-label="Eliminar notificación"
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
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => { e.preventDefault(); if (page > 0) setPage(p => p - 1) }}
                className={cn(page === 0 && 'pointer-events-none opacity-50')}
                aria-label="Página anterior"
              />
            </PaginationItem>
            {paginationRange.map((p, i) =>
              typeof p === 'string' ? (
                <PaginationItem key={`ellipsis-${i}`}>
                  <span className="flex h-9 w-9 items-center justify-center text-sm text-muted-foreground">…</span>
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink
                    href="#"
                    isActive={p === page}
                    onClick={(e) => { e.preventDefault(); setPage(p) }}
                    aria-label={`Página ${p + 1}`}
                    aria-current={p === page ? 'page' : undefined}
                  >
                    {p + 1}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => { e.preventDefault(); if (page < totalPages - 1) setPage(p => p + 1) }}
                className={cn(page >= totalPages - 1 && 'pointer-events-none opacity-50')}
                aria-label="Página siguiente"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
