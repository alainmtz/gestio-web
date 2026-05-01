import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, AlertTriangle, FileText, DollarSign, ClipboardList, Package, Info, Calendar, ArrowLeftRight, TrendingDown, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useNotificationStore } from '@/stores/notificationStore'
import { useUnreadCount, useNotifications, useMarkAllAsRead } from '@/hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import type { NotificationType } from '@/api/notifications'

const TYPE_CONFIG: Record<NotificationType, {
  icon: React.ComponentType<{ className?: string }>
  color: string
  bg: string
}> = {
  task_assigned: { icon: Calendar,     color: 'text-blue-600',   bg: 'bg-blue-100 dark:bg-blue-900' },
  status_change: { icon: ArrowLeftRight, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900' },
  low_stock:     { icon: TrendingDown,  color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900' },
  transfer:      { icon: ArrowLeftRight, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900' },
  movement:      { icon: Package,       color: 'text-cyan-600',   bg: 'bg-cyan-100 dark:bg-cyan-900' },
  credit_note:   { icon: CreditCard,    color: 'text-red-600',    bg: 'bg-red-100 dark:bg-red-900' },
  new_invoice:   { icon: FileText,      color: 'text-blue-600',   bg: 'bg-blue-100 dark:bg-blue-900' },
  payment:       { icon: DollarSign,    color: 'text-green-600',  bg: 'bg-green-100 dark:bg-green-900' },
  consignment:   { icon: ClipboardList, color: 'text-amber-600',  bg: 'bg-amber-100 dark:bg-amber-900' },
  new_order:     { icon: Package,       color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900' },
  info:          { icon: Info,          color: 'text-gray-600',   bg: 'bg-gray-100 dark:bg-gray-800' },
}

interface DBNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  href: string | null
  read: boolean
  created_at: string
}

function NotificationItem({ n }: { n: DBNotification }) {
  const navigate = useNavigate()
  const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info
  const Icon = cfg.icon

  function handleClick() {
    if (n.href) navigate(n.href)
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg p-3 cursor-pointer transition-colors hover:bg-muted/60',
        !n.read && 'bg-muted/30'
      )}
      onClick={handleClick}
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
      {!n.read && (
        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
      )}
    </div>
  )
}

export function NotificationsPanel() {
  const navigate = useNavigate()
  const { data: unreadCount = 0 } = useUnreadCount()
  const { data } = useNotifications({ limit: 10, offset: 0 })
  const markAllAsRead = useMarkAllAsRead()
  const zustandClearAll = useNotificationStore((s) => s.clearAll)

  const notifications: DBNotification[] = (data?.notifications || []).map(n => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    href: n.href,
    read: n.read,
    created_at: n.created_at,
  }))

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
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
                title="Limpiar todas"
                onClick={() => zustandClearAll()}
              >
                <Bell className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
            <Bell className="h-8 w-8 opacity-30" />
            <p className="text-sm">Sin notificaciones</p>
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-[320px]">
              <div className="divide-y">
                {notifications.map((n) => (
                  <NotificationItem key={n.id} n={n} />
                ))}
              </div>
            </ScrollArea>
            <div className="border-t p-2">
              <Button
                variant="ghost"
                className="w-full text-sm"
                onClick={() => navigate('/notifications')}
              >
                Ver todas las notificaciones
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
