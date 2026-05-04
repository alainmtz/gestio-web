import { NOTIFICATION_TYPE_CONFIG } from '@/config/notifications'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { formatDistanceToNow, format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Notification } from '@/api/notifications'

interface NotificationDetailDialogProps {
  notification: Notification | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NotificationDetailDialog({ notification, open, onOpenChange }: NotificationDetailDialogProps) {
  if (!notification) return null

  const cfg = NOTIFICATION_TYPE_CONFIG[notification.type] || NOTIFICATION_TYPE_CONFIG.info
  const Icon = cfg.icon

  function formatDate(dateStr: string) {
    return format(new Date(dateStr), "EEEE, d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', cfg.bg)}>
              <Icon className={cn('h-5 w-5', cfg.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg">{notification.title}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {formatDate(notification.created_at)}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={`${cfg.bg} ${cfg.color}`}>
              {cfg.label}
            </Badge>
            <Badge variant={notification.read ? 'outline' : 'secondary'}>
              {notification.read ? 'Leída' : 'No leída'}
            </Badge>
          </div>

          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {notification.message}
          </p>

          {notification.metadata && Object.keys(notification.metadata).length > 0 && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Metadatos</p>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(notification.metadata).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</dt>
                    <dd className="font-mono text-xs truncate" title={String(value)}>{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {notification.read_at && (
            <p className="text-xs text-muted-foreground/70">
              Leída: {formatDate(notification.read_at)}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
