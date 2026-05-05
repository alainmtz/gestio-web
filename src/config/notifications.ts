import { Calendar, ArrowLeftRight, TrendingDown, Package, CreditCard, FileText, DollarSign, ClipboardList, Info, Users, LucideIcon } from 'lucide-react'
import type { NotificationType } from '@/api/notifications'

export interface NotificationTypeConfig {
  icon: LucideIcon
  color: string
  bg: string
  label: string
}

export const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, NotificationTypeConfig> = {
  task_assigned: { icon: Calendar,      color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-100 dark:bg-blue-900/40',        label: 'Tarea' },
  status_change: { icon: ArrowLeftRight, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/40',     label: 'Estado' },
  low_stock:     { icon: TrendingDown,   color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/40', label: 'Stock bajo' },
  transfer:      { icon: ArrowLeftRight, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/40', label: 'Transferencia' },
  movement:      { icon: Package,        color: 'text-cyan-600 dark:text-cyan-400',   bg: 'bg-cyan-100 dark:bg-cyan-900/40',      label: 'Movimiento' },
  credit_note:   { icon: CreditCard,     color: 'text-red-600 dark:text-red-400',     bg: 'bg-red-100 dark:bg-red-900/40',        label: 'Nota de crédito' },
  new_invoice:   { icon: FileText,       color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-100 dark:bg-blue-900/40',      label: 'Factura' },
  payment:       { icon: DollarSign,     color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/40',    label: 'Pago' },
  consignment:   { icon: ClipboardList,  color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/40',   label: 'Consignación' },
  new_order:     { icon: Package,        color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/40', label: 'Orden' },
  info:          { icon: Info,           color: 'text-gray-600 dark:text-gray-400',   bg: 'bg-gray-100 dark:bg-gray-800/40',      label: 'Info' },
  exchange_rate_change: { icon: ArrowLeftRight, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/40', label: 'Tasa de cambio' },
  member_joined: { icon: Users, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-900/40', label: 'Nuevo miembro' },
}
