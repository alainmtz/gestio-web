import { useEffect, useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import * as api from '@/api/notifications'

const NOTIFICATIONS_KEY = 'notifications'
const UNREAD_COUNT_KEY = 'unread-count'

export function useNotifications(options?: api.GetNotificationsOptions) {
  const userId = useAuthStore((s) => s.user?.id)
  const organizationId = useAuthStore((s) => s.currentOrganization?.id)
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: [NOTIFICATIONS_KEY, userId, organizationId, options],
    queryFn: () => {
      if (!userId || !organizationId) throw new Error('Missing user or org')
      return api.getNotifications(userId, organizationId, options)
    },
    enabled: !!userId && !!organizationId,
    staleTime: 1000 * 30, // 30s
  })

  // Realtime subscription
  useEffect(() => {
    if (!userId || !organizationId) return

    const channel: RealtimeChannel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Invalidate on any change to this user's notifications
          queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY, userId] })
          queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY, userId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, organizationId, queryClient])

  return query
}

export function useUnreadCount() {
  const userId = useAuthStore((s) => s.user?.id)
  const organizationId = useAuthStore((s) => s.currentOrganization?.id)
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: [UNREAD_COUNT_KEY, userId, organizationId],
    queryFn: () => {
      if (!userId || !organizationId) throw new Error('Missing user or org')
      return api.getUnreadCount(userId, organizationId)
    },
    enabled: !!userId && !!organizationId,
    staleTime: 1000 * 30,
  })

  return query
}

export function useMarkAsRead() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)

  return useMutation({
    mutationFn: api.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY, userId] })
      queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY, userId] })
    },
  })
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)
  const organizationId = useAuthStore((s) => s.currentOrganization?.id)

  return useMutation({
    mutationFn: () => {
      if (!userId || !organizationId) throw new Error('Missing user or org')
      return api.markAllAsRead(userId, organizationId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY, userId] })
      queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY, userId] })
    },
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)

  return useMutation({
    mutationFn: api.deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY, userId] })
      queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY, userId] })
    },
  })
}

export function useClearReadNotifications() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.user?.id)
  const organizationId = useAuthStore((s) => s.currentOrganization?.id)

  return useMutation({
    mutationFn: () => {
      if (!userId || !organizationId) throw new Error('Missing user or org')
      return api.clearReadNotifications(userId, organizationId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY, userId] })
      queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY, userId] })
    },
  })
}

export function useCreateNotification() {
  return useMutation({
    mutationFn: api.createNotification,
  })
}

export function useCreateNotifications() {
  return useMutation({
    mutationFn: api.createNotifications,
  })
}

import { useAuthStore } from '@/stores/authStore'
