import { NOTIFICATION_TYPE_CONFIG } from '@/config/notifications'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { formatDistanceToNow, format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Notification } from '@/api/notifications'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'

interface NotificationDetailDialogProps {
  notification: Notification | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatDateTime(dateStr: string | undefined | null) {
  if (!dateStr) return '—'
  return format(new Date(dateStr), "d MMM yyyy, HH:mm", { locale: es })
}

function ExchangeRateDetails({ metadata }: { metadata: Record<string, unknown> }) {
  const event = metadata.event as string | undefined
  const oldRate = metadata.old_rate as number | undefined
  const newRate = metadata.new_rate as number | undefined
  const oldDate = metadata.old_rate_date as string | undefined
  const newDate = metadata.new_rate_date as string | undefined
  const oldCreatedAt = metadata.old_rate_created_at as string | undefined
  const newCreatedAt = metadata.new_rate_created_at as string | undefined
  const source = metadata.source as string | undefined

  const rateDiff = (oldRate !== undefined && newRate !== undefined) ? newRate - oldRate : undefined

  const RateCard = ({ label, rate, date, createdAt, variant }: {
    label: string
    rate: number | undefined
    date: string | undefined
    createdAt: string | undefined
    variant: 'old' | 'new'
  }) => (
    <div className={cn(
      'rounded-lg border p-3 space-y-2',
      variant === 'old' ? 'bg-muted/50' : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
    )}>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      {rate !== undefined && (
        <p className="text-2xl font-bold font-mono">{rate.toFixed(4)}</p>
      )}
      <div className="space-y-0.5 text-xs text-muted-foreground">
        {date && <p>Fecha de tasa: {formatDateTime(date)}</p>}
        {createdAt && <p>Registrada: {formatDateTime(createdAt)}</p>}
      </div>
    </div>
  )

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Detalle de tasa de cambio
      </p>

      {source && (
        <Badge variant="outline" className="text-xs">
          Fuente: {source === 'eltoque' ? 'ElToque' : source}
        </Badge>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(event === 'UPDATE' || event === 'DELETE') && (
          <RateCard label="Anterior" rate={oldRate} date={oldDate} createdAt={oldCreatedAt} variant="old" />
        )}
        {(event === 'UPDATE' || event === 'INSERT') && (
          <RateCard label="Nueva" rate={newRate} date={newDate} createdAt={newCreatedAt} variant="new" />
        )}
        {event === 'DELETE' && (
          <div className="sm:col-span-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-3">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">Esta tasa fue eliminada</p>
          </div>
        )}
      </div>

      {rateDiff !== undefined && (
        <div className="flex items-center gap-2 text-sm">
          {rateDiff > 0 ? (
            <ArrowUp className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : rateDiff < 0 ? (
            <ArrowDown className="h-4 w-4 text-red-600 dark:text-red-400" />
          ) : (
            <Minus className="h-4 w-4 text-muted-foreground" />
          )}
          <span className={cn(
            'font-mono font-medium',
            rateDiff > 0 ? 'text-green-600 dark:text-green-400' :
            rateDiff < 0 ? 'text-red-600 dark:text-red-400' :
            'text-muted-foreground'
          )}>
            {rateDiff > 0 ? '+' : ''}{rateDiff.toFixed(4)}
          </span>
          <span className="text-xs text-muted-foreground">diferencia</span>
        </div>
      )}
    </div>
  )
}

export function NotificationDetailDialog({ notification, open, onOpenChange }: NotificationDetailDialogProps) {
  if (!notification) return null

  const cfg = NOTIFICATION_TYPE_CONFIG[notification.type] || NOTIFICATION_TYPE_CONFIG.info
  const Icon = cfg.icon

  function formatDate(dateStr: string) {
    return format(new Date(dateStr), "EEEE, d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })
  }

  const isExchangeRate = notification.type === 'exchange_rate_change'
  const hasRateMetadata = isExchangeRate && typeof notification.metadata?.event === 'string'

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

          {hasRateMetadata && (
            <ExchangeRateDetails metadata={notification.metadata} />
          )}

          {notification.metadata && !hasRateMetadata && Object.keys(notification.metadata).length > 0 && (
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
