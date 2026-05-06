import { NOTIFICATION_TYPE_CONFIG } from '@/config/notifications'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/lib/toast'
import { formatDistanceToNow, format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Notification } from '@/api/notifications'
import { ArrowDown, ArrowUp, Minus, User, Check, X, Loader2, Building2, Package, FileText, DollarSign, Calendar, TrendingDown, ArrowLeftRight, ClipboardList } from 'lucide-react'
import { useState } from 'react'

interface NotificationDetailDialogProps {
  notification: Notification | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatDateTime(dateStr: string | undefined | null) {
  if (!dateStr) return '—'
  return format(new Date(dateStr), "d MMM yyyy, HH:mm", { locale: es })
}

function MemberJoinedDetails({ metadata }: { metadata: Record<string, unknown> }) {
  const email = metadata.member_email as string | undefined
  const role = metadata.member_role as string | undefined
  const joinedAt = metadata.joined_at as string | undefined

  const roleLabel = role === 'owner' ? 'Propietario' : role === 'admin' ? 'Administrador' : 'Miembro'

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Detalle del nuevo miembro
      </p>

      <div className="flex items-center gap-3 p-3 rounded-lg border bg-background">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/40">
          <User className="h-5 w-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{email || '—'}</p>
          <p className="text-xs text-muted-foreground">{roleLabel}</p>
        </div>
      </div>

      {joinedAt && (
        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>Se unió: {formatDateTime(joinedAt)}</p>
        </div>
      )}
    </div>
  )
}

function MetadataCard({ icon: Icon, label, rows, iconColor, iconBg }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  rows: { label: string; value: string }[]
  iconColor: string
  iconBg: string
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-background">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', iconBg)}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
        <div className="flex-1 min-w-0 space-y-0.5">
          {rows.filter(r => r.value).map((r) => (
            <div key={r.label} className="flex justify-between text-sm">
              <span className="text-xs text-muted-foreground">{r.label}</span>
              <span className="font-medium truncate ml-2">{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  member: 'Miembro',
}

function OrganizationInvitationDetails({ notification }: { notification: Notification }) {
  const { toast } = useToast()
  const [processing, setProcessing] = useState(false)

  const role = notification.metadata?.member_role as string | undefined
  const inviterName = notification.metadata?.inviter_name as string | undefined
  const orgId = notification.organization_id
  const roleLabel = role ? (ROLE_LABELS[role] ?? role) : 'Miembro'

  const handleAccept = async () => {
    setProcessing(true)
    try {
      const { data: pendingMembers } = await supabase
        .from('organization_members')
        .select('id')
        .eq('user_id', notification.user_id)
        .eq('organization_id', orgId)
        .eq('is_active', false)

      if (pendingMembers?.length) {
        const { error } = await supabase
          .from('organization_members')
          .update({ is_active: true })
          .eq('id', pendingMembers[0].id)
        if (error) throw error
      }

      const userId = useAuthStore.getState().user?.id
      if (userId) {
        const { data: owners } = await supabase
          .from('organization_members')
          .select('user_id')
          .eq('organization_id', orgId)
          .neq('user_id', userId)

        if (owners && owners.length > 0) {
          const memberEmail = useAuthStore.getState().user?.email ?? ''
          await supabase
            .from('notifications')
            .insert(
              owners.map((o) => ({
                user_id: o.user_id,
                organization_id: orgId,
                type: 'member_joined',
                title: 'Nuevo miembro',
                message: `${memberEmail} se ha unido a la organización.`,
                href: '/settings/members',
                metadata: {
                  member_email: memberEmail,
                  member_role: role,
                  joined_at: new Date().toISOString(),
                },
              }))
            )
        }
      }

      toast({ title: 'Invitación aceptada', description: `Ahora eres miembro de la organización` })
      await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notification.id)
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo aceptar la invitación',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    setProcessing(true)
    try {
      const { data: pendingMembers } = await supabase
        .from('organization_members')
        .select('id')
        .eq('user_id', notification.user_id)
        .eq('organization_id', orgId)
        .eq('is_active', false)

      if (pendingMembers?.length) {
        const { error } = await supabase
          .from('organization_members')
          .delete()
          .eq('id', pendingMembers[0].id)
        if (error) throw error
      }

      await supabase
        .from('notifications')
        .delete()
        .eq('id', notification.id)

      toast({ title: 'Invitación rechazada' })
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo rechazar la invitación',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Detalle de la invitación
      </p>

      <div className="flex items-center gap-3 p-3 rounded-lg border bg-background">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
          <Building2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{notification.title}</p>
          {inviterName && <p className="text-xs text-muted-foreground">Invitado por: {inviterName}</p>}
          <p className="text-xs text-muted-foreground">Rol: {roleLabel}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="default"
          disabled={processing}
          onClick={handleAccept}
          className="flex-1"
        >
          {processing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
          Aceptar
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={processing}
          onClick={handleReject}
          className="flex-1"
        >
          <X className="mr-1 h-3 w-3" />
          Rechazar
        </Button>
      </div>
    </div>
  )
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
  const baseCode = metadata.base_currency_code as string | undefined
  const targetCode = metadata.target_currency_code as string | undefined

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
      {rate !== undefined && baseCode && targetCode && (
        <div>
          <p className="text-2xl font-bold font-mono">{rate.toFixed(4)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            1 {baseCode} = {rate.toFixed(4)} {targetCode}
          </p>
        </div>
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

      {baseCode && targetCode && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-semibold">
            {baseCode} → {targetCode}
          </Badge>
          {source && (
            <Badge variant="outline" className="text-xs">
              Fuente: {source === 'eltoque' ? 'ElToque' : source}
            </Badge>
          )}
        </div>
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
              <DialogDescription className="sr-only">
                {notification.message}
              </DialogDescription>
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

          {notification.type === 'member_joined' && (
            <MemberJoinedDetails metadata={notification.metadata} />
          )}

          {notification.type === 'organization_invitation' && (
            <OrganizationInvitationDetails notification={notification} />
          )}

          {notification.type === 'low_stock' && (
            <MetadataCard
              icon={TrendingDown}
              label="Alerta de stock"
              iconColor="text-orange-600 dark:text-orange-400"
              iconBg="bg-orange-100 dark:bg-orange-900/40"
              rows={[
                { label: 'Producto', value: (notification.metadata?.product_name as string) ?? '' },
                { label: 'Tienda', value: (notification.metadata?.store_name as string) ?? '' },
                { label: 'Disponible', value: notification.metadata?.available != null ? `${notification.metadata.available} uds` : '' },
              ]}
            />
          )}

          {notification.type === 'new_invoice' && (
            <MetadataCard
              icon={FileText}
              label="Detalle de factura"
              iconColor="text-blue-600 dark:text-blue-400"
              iconBg="bg-blue-100 dark:bg-blue-900/40"
              rows={[
                { label: 'Cliente', value: (notification.metadata?.customer_name as string) ?? '' },
                { label: 'Total', value: notification.metadata?.total != null ? `$${Number(notification.metadata.total).toFixed(2)}` : '' },
                { label: 'Estado', value: (notification.metadata?.status as string) ?? '' },
              ]}
            />
          )}

          {notification.type === 'payment' && (
            <MetadataCard
              icon={DollarSign}
              label="Detalle de pago"
              iconColor="text-green-600 dark:text-green-400"
              iconBg="bg-green-100 dark:bg-green-900/40"
              rows={[
                { label: 'Cliente', value: (notification.metadata?.customer_name as string) ?? '' },
                { label: 'Monto', value: notification.metadata?.total != null ? `$${Number(notification.metadata.total).toFixed(2)}` : '' },
              ]}
            />
          )}

          {notification.type === 'consignment' && (
            <MetadataCard
              icon={ClipboardList}
              label="Detalle de consignación"
              iconColor="text-amber-600 dark:text-amber-400"
              iconBg="bg-amber-100 dark:bg-amber-900/40"
              rows={[
                { label: 'Socio', value: (notification.metadata?.partner_name as string) ?? '' },
                { label: 'Productos', value: notification.metadata?.total_items != null ? `${notification.metadata.total_items}` : '' },
              ]}
            />
          )}

          {notification.type === 'new_order' && (
            <MetadataCard
              icon={Package}
              label="Detalle de oferta"
              iconColor="text-purple-600 dark:text-purple-400"
              iconBg="bg-purple-100 dark:bg-purple-900/40"
              rows={[
                { label: 'Cliente', value: (notification.metadata?.customer_name as string) ?? '' },
                { label: 'Total', value: notification.metadata?.total != null ? `$${Number(notification.metadata.total).toFixed(2)}` : '' },
                { label: 'Estado', value: (notification.metadata?.status as string) ?? '' },
              ]}
            />
          )}

          {notification.type === 'task_assigned' && (
            <MetadataCard
              icon={Calendar}
              label="Trabajo asignado"
              iconColor="text-blue-600 dark:text-blue-400"
              iconBg="bg-blue-100 dark:bg-blue-900/40"
              rows={[
                { label: 'Equipo', value: (notification.metadata?.team_name as string) ?? '' },
                { label: 'Cliente', value: (notification.metadata?.customer_name as string) ?? '' },
              ]}
            />
          )}

          {notification.type === 'status_change' && (
            <MetadataCard
              icon={ArrowLeftRight}
              label="Cambio de estado"
              iconColor="text-amber-600 dark:text-amber-400"
              iconBg="bg-amber-100 dark:bg-amber-900/40"
              rows={[
                { label: 'Equipo', value: (notification.metadata?.team_name as string) ?? '' },
                { label: 'Cliente', value: (notification.metadata?.customer_name as string) ?? '' },
                { label: 'Nuevo estado', value: (notification.metadata?.new_status as string) ?? '' },
              ]}
            />
          )}

          {notification.metadata && !hasRateMetadata && notification.type !== 'organization_invitation' && notification.type !== 'member_joined' && notification.type !== 'low_stock' && notification.type !== 'new_invoice' && notification.type !== 'payment' && notification.type !== 'consignment' && notification.type !== 'new_order' && notification.type !== 'task_assigned' && notification.type !== 'status_change' && Object.keys(notification.metadata).length > 0 && (
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
