import { useNavigate } from 'react-router-dom'
import { Bell, X, CheckCheck, Trash2, Package, FileText, DollarSign, ClipboardList, AlertTriangle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useNotificationStore, type AppNotification, type NotificationType } from '@/stores/notificationStore'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

const TYPE_CONFIG: Record<NotificationType, {
  icon: React.ComponentType<{ className?: string }>
  color: string
  bg: string
}> = {
  low_stock:    { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900' },
  new_invoice:  { icon: FileText,      color: 'text-blue-600',   bg: 'bg-blue-100 dark:bg-blue-900' },
  payment:      { icon: DollarSign,    color: 'text-green-600',  bg: 'bg-green-100 dark:bg-green-900' },
  new_order:    { icon: Package,       color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900' },
  consignment:  { icon: ClipboardList, color: 'text-amber-600',  bg: 'bg-amber-100 dark:bg-amber-900' },
  info:         { icon: Info,          color: 'text-gray-600',   bg: 'bg-gray-100 dark:bg-gray-800' },
}

function NotificationItem({ n, onDismiss }: { n: AppNotification; onDismiss: () => void }) {
  const navigate = useNavigate()
  const markRead = useNotificationStore((s) => s.markRead)
  const cfg = TYPE_CONFIG[n.type]
  const Icon = cfg.icon

  function handleClick() {
    markRead(n.id)
    if (n.href) navigate(n.href)
    onDismiss()
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
          {formatDistanceToNow(n.createdAt, { addSuffix: true, locale: es })}
        </p>
      </div>
      {!n.read && (
        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
      )}
    </div>
  )
}

export function NotificationsPanel() {
  const { notifications, markAllRead, clearAll, remove } = useNotificationStore()
  const unreadCount = notifications.filter((n) => !n.read).length

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
        {/* Header */}
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
                onClick={markAllRead}
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
                onClick={clearAll}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* List */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
            <Bell className="h-8 w-8 opacity-30" />
            <p className="text-sm">Sin notificaciones</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[420px]">
            <div className="divide-y">
              {notifications.map((n) => (
                <div key={n.id} className="relative group">
                  <NotificationItem n={n} onDismiss={() => {}} />
                  <button
                    onClick={(e) => { e.stopPropagation(); remove(n.id) }}
                    className="absolute right-2 top-2 hidden group-hover:flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                    title="Eliminar"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  )
}
