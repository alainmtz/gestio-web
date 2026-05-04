import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import * as api from '@/api/notifications'

const NOTIFICATIONS_KEY = 'notifications'
const UNREAD_COUNT_KEY = 'unread-count'

export function useNotification(id: string | null) {
  const userId = useAuthStore((s) => s.user?.id)
  const organizationId = useAuthStore((s) => s.currentOrganization?.id)

  return useQuery({
    queryKey: ['notification', id],
    queryFn: () => api.getNotification(id!),
    enabled: !!id,
    staleTime: 1000 * 30,
  })
}

export function useNotifications(options?: api.GetNotificationsOptions) {
  const userId = useAuthStore((s) => s.user?.id)
  const organizationId = useAuthStore((s) => s.currentOrganization?.id)
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: [NOTIFICATIONS_KEY, userId, organizationId, options],
    queryFn: () => {
      if (!userId || !organizationId) throw new Error('Missing user or org')
      return api.getNotifications(userId, organizationId, options)
    },
    enabled: !!userId && !!organizationId,
    staleTime: 1000 * 30,
  })
}

export function useUnreadCount() {
  const userId = useAuthStore((s) => s.user?.id)
  const organizationId = useAuthStore((s) => s.currentOrganization?.id)

  return useQuery({
    queryKey: [UNREAD_COUNT_KEY, userId, organizationId],
    queryFn: () => {
      if (!userId || !organizationId) throw new Error('Missing user or org')
      return api.getUnreadCount(userId, organizationId)
    },
    enabled: !!userId && !!organizationId,
    staleTime: 1000 * 30,
  })
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
