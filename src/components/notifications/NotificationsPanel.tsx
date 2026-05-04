import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useNotification, useUnreadCount, useNotifications, useMarkAsRead, useMarkAllAsRead, useClearReadNotifications } from '@/hooks/useNotifications'
import { NOTIFICATION_TYPE_CONFIG } from '@/config/notifications'
import { NotificationDetailDialog } from '@/components/notifications/NotificationDetailDialog'
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import type { NotificationType } from '@/api/notifications'

interface DBNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  href: string | null
  read: boolean
  created_at: string
}

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

function groupByDate(notifications: DBNotification[]): { group: DateGroupKey; items: DBNotification[] }[] {
  const map = new Map<DateGroupKey, DBNotification[]>()
  for (const n of notifications) {
    const group = getDateGroup(new Date(n.created_at))
    if (!map.has(group)) map.set(group, [])
    map.get(group)!.push(n)
  }
  const order: DateGroupKey[] = ['today', 'yesterday', 'this_week', 'older']
  return order
    .filter(g => map.has(g))
    .map(g => ({ group: g, items: map.get(g)! }))
}

function NotificationItem({ n, onOpenDetail }: { n: DBNotification; onOpenDetail: (id: string) => void }) {
  const navigate = useNavigate()
  const cfg = NOTIFICATION_TYPE_CONFIG[n.type] || NOTIFICATION_TYPE_CONFIG.info
  const Icon = cfg.icon

  function handleClick() {
    onOpenDetail(n.id)
  }

  function handleNavigate(e: React.MouseEvent) {
    e.stopPropagation()
    if (n.href) navigate(n.href)
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg p-3 cursor-pointer transition-colors hover:bg-muted/60',
        !n.read && 'bg-muted/30'
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Notificación: ${n.title}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() } }}
    >
      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', cfg.bg)}>
        <Icon className={cn('h-4 w-4', cfg.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium leading-tight', !n.read && 'font-semibold')}>
          {n.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: es })}
        </p>
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        {!n.read && <span className="h-2 w-2 self-center rounded-full bg-primary" />}
        {n.href && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleNavigate}
            aria-label="Ir a la notificación"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}

export function NotificationsPanel() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const { data: unreadCount = 0 } = useUnreadCount()
  const { data } = useNotifications({ limit: 10, offset: 0 })
  const { data: detailNotification } = useNotification(detailId)
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()
  const clearRead = useClearReadNotifications()

  const notifications: DBNotification[] = (data?.notifications || []).map(n => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    href: n.href,
    read: n.read,
    created_at: n.created_at,
  }))

  const grouped = groupByDate(notifications)
  const hasNew = unreadCount > 0

  function handleOpenDetail(id: string) {
    const n = notifications.find(n => n.id === id)
    if (n && !n.read) markAsRead.mutate(id)
    setDetailId(id)
  }

  function handleViewAll() {
    setOpen(false)
    navigate('/notifications')
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificaciones">
          <Bell className={cn('h-5 w-5 transition-transform', hasNew && 'animate-[bell-ring_0.5s_ease-in-out]')} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0 bg-card border shadow-lg">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Notificaciones</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">{unreadCount} nuevas</Badge>
            )}
          </div>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="Marcar todas como leídas"
                aria-label="Marcar todas como leídas"
                onClick={() => markAllAsRead.mutate()}
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                title="Limpiar leídas"
                aria-label="Limpiar notificaciones leídas"
                onClick={() => clearRead.mutate()}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
            <div className="rounded-full bg-muted p-4">
              <Bell className="h-6 w-6 opacity-30" />
            </div>
            <p className="text-sm">Sin notificaciones</p>
            <p className="text-xs text-muted-foreground/70">Las notificaciones aparecerán aquí</p>
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-[320px]">
              <div className="divide-y">
                {grouped.map(({ group, items }) => (
                  <div key={group}>
                    <div className="sticky top-0 bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground border-b">
                      {DATE_GROUP_LABELS[group]}
                    </div>
                    {items.map((n) => (
                      <NotificationItem key={n.id} n={n} onOpenDetail={handleOpenDetail} />
                    ))}
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="border-t p-2">
              <Button
                variant="ghost"
                className="w-full text-sm"
                onClick={handleViewAll}
              >
                Ver todas las notificaciones
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>

    <NotificationDetailDialog
      notification={detailNotification || null}
      open={!!detailId}
      onOpenChange={(open) => { if (!open) setDetailId(null) }}
    />
    </>
  )
}
