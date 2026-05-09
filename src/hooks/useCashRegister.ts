import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import * as cashApi from '@/api/cashRegister'
import type { AddMovementInput, CloseSessionInput, OpenSessionInput } from '@/api/cashRegister'

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const cashKeys = {
  all: ['cashRegister'] as const,
  sessions: (orgId: string) => ['cashRegister', 'sessions', orgId] as const,
  activeSession: (orgId: string, userId: string) =>
    ['cashRegister', 'activeSession', orgId, userId] as const,
  session: (id: string) => ['cashRegister', 'session', id] as const,
  movements: (sessionId: string) => ['cashRegister', 'movements', sessionId] as const,
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export function useCashSessions() {
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)

  return useQuery({
    queryKey: cashKeys.sessions(organizationId!),
    queryFn: () => cashApi.fetchSessions(organizationId!),
    enabled: !!organizationId,
  })
}

export function useActiveSession() {
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const userId = useAuthStore((state) => state.user?.id)

  return useQuery({
    queryKey: cashKeys.activeSession(organizationId!, userId!),
    queryFn: () => cashApi.fetchActiveSession(organizationId!, userId!),
    enabled: !!organizationId && !!userId,
  })
}

export function useCashSession(id: string | undefined) {
  return useQuery({
    queryKey: cashKeys.session(id!),
    queryFn: () => cashApi.fetchSession(id!),
    enabled: !!id,
  })
}

export function useOpenSession() {
  const queryClient = useQueryClient()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const userId = useAuthStore((state) => state.user?.id)

  return useMutation({
    mutationFn: (input: Omit<OpenSessionInput, 'organization_id' | 'user_id'>) =>
      cashApi.openSession({
        ...input,
        organization_id: organizationId!,
        user_id: userId!,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashKeys.sessions(organizationId!) })
      queryClient.invalidateQueries({
        queryKey: cashKeys.activeSession(organizationId!, userId!),
      })
    },
  })
}

export function useCloseSession(sessionId: string) {
  const queryClient = useQueryClient()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const userId = useAuthStore((state) => state.user?.id)

  return useMutation({
    mutationFn: (input: Omit<CloseSessionInput, 'session_id'>) =>
      cashApi.closeSession({ ...input, session_id: sessionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashKeys.session(sessionId) })
      queryClient.invalidateQueries({ queryKey: cashKeys.sessions(organizationId!) })
      queryClient.invalidateQueries({
        queryKey: cashKeys.activeSession(organizationId!, userId!),
      })
      queryClient.invalidateQueries({ queryKey: ['financialReport'] })
      queryClient.invalidateQueries({ queryKey: ['salesReport'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useSuspendSession(sessionId: string) {
  const queryClient = useQueryClient()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const userId = useAuthStore((state) => state.user?.id)

  return useMutation({
    mutationFn: () => cashApi.suspendSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashKeys.session(sessionId) })
      queryClient.invalidateQueries({ queryKey: cashKeys.sessions(organizationId!) })
      queryClient.invalidateQueries({
        queryKey: cashKeys.activeSession(organizationId!, userId!),
      })
    },
  })
}

export function useResumeSession(sessionId: string) {
  const queryClient = useQueryClient()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const userId = useAuthStore((state) => state.user?.id)

  return useMutation({
    mutationFn: () => cashApi.resumeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashKeys.session(sessionId) })
      queryClient.invalidateQueries({ queryKey: cashKeys.sessions(organizationId!) })
      queryClient.invalidateQueries({
        queryKey: cashKeys.activeSession(organizationId!, userId!),
      })
    },
  })
}

// ─── Movements ────────────────────────────────────────────────────────────────

export function useCashMovements(registerId: string | undefined) {
  return useQuery({
    queryKey: cashKeys.movements(registerId!),
    queryFn: () => cashApi.fetchMovements(registerId!),
    enabled: !!registerId,
  })
}

export function useAddMovement(registerId: string) {
  const queryClient = useQueryClient()
  const userId = useAuthStore((state) => state.user?.id)

  return useMutation({
    mutationFn: (input: Omit<AddMovementInput, 'register_id' | 'user_id'>) =>
      cashApi.addMovement({ ...input, register_id: registerId, user_id: userId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cashKeys.movements(registerId) })
      queryClient.invalidateQueries({ queryKey: ['financialReport'] })
      queryClient.invalidateQueries({ queryKey: ['salesReport'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
