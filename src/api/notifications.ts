import { supabase } from '@/lib/supabase'

export type NotificationType =
  | 'task_assigned'
  | 'status_change'
  | 'low_stock'
  | 'transfer'
  | 'movement'
  | 'credit_note'
  | 'new_invoice'
  | 'payment'
  | 'consignment'
  | 'new_order'
  | 'info'
  | 'exchange_rate_change'
  | 'member_joined'

export interface Notification {
  id: string
  user_id: string
  organization_id: string
  type: NotificationType
  title: string
  message: string
  href: string | null
  read: boolean
  read_at: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface CreateNotificationInput {
  user_id: string
  organization_id: string
  type: NotificationType
  title: string
  message: string
  href?: string
  metadata?: Record<string, unknown>
}

export interface GetNotificationsOptions {
  limit?: number
  offset?: number
  filter?: 'all' | 'unread' | 'read'
  typeFilter?: NotificationType | 'all'
}

export async function getNotifications(
  userId: string,
  organizationId: string,
  options: GetNotificationsOptions = {}
): Promise<{ notifications: Notification[]; total: number }> {
  const { limit = 20, offset = 0, filter = 'all', typeFilter = 'all' } = options

  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (filter === 'unread') query = query.eq('read', false)
  if (filter === 'read') query = query.eq('read', true)
  if (typeFilter !== 'all') query = query.eq('type', typeFilter)

  const from = offset
  const to = offset + limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw error
  return { notifications: (data as Notification[]) || [], total: count || 0 }
}

export async function getUnreadCount(
  userId: string,
  organizationId: string
): Promise<number> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .eq('read', false)

  if (error) throw error
  return data?.length ?? 0
}

export async function getNotification(notificationId: string): Promise<Notification> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('id', notificationId)
    .single()

  if (error) throw error
  return data as Notification
}

export async function markAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)

  if (error) throw error
}

export async function markAllAsRead(
  userId: string,
  organizationId: string
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .eq('read', false)

  if (error) throw error
}

export async function deleteNotification(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)

  if (error) throw error
}

export async function clearReadNotifications(
  userId: string,
  organizationId: string
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .eq('read', true)

  if (error) throw error
}

export async function createNotification(
  input: CreateNotificationInput
): Promise<Notification> {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: input.user_id,
      organization_id: input.organization_id,
      type: input.type,
      title: input.title,
      message: input.message,
      href: input.href || null,
      metadata: input.metadata || {},
    })
    .select()
    .single()

  if (error) throw error
  return data as Notification
}

export async function createNotifications(
  inputs: CreateNotificationInput[]
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .insert(
      inputs.map((i) => ({
        user_id: i.user_id,
        organization_id: i.organization_id,
        type: i.type,
        title: i.title,
        message: i.message,
        href: i.href || null,
        metadata: i.metadata || {},
      }))
    )
    .select()

  if (error) throw error
  return (data as Notification[]) || []
}
