import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import * as schedulesApi from '@/api/schedules'

export function useTeamSchedules(teamId: string) {
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)

  return useQuery({
    queryKey: ['teamSchedules', teamId],
    queryFn: () => schedulesApi.getTeamSchedules(teamId, organizationId!),
    enabled: !!teamId && !!organizationId,
  })
}

export function useInvoiceSchedule(invoiceId: string) {
  return useQuery({
    queryKey: ['invoiceSchedule', invoiceId],
    queryFn: () => schedulesApi.getTeamScheduleByInvoice(invoiceId),
    enabled: !!invoiceId,
  })
}

export function useAssignTeamToInvoice() {
  const queryClient = useQueryClient()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)

  return useMutation({
    mutationFn: ({ invoiceId, teamId }: { invoiceId: string; teamId: string }) =>
      schedulesApi.assignTeamToInvoice(invoiceId, teamId, organizationId!),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teamSchedules', variables.teamId] })
      queryClient.invalidateQueries({ queryKey: ['invoiceSchedule', variables.invoiceId] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

export function useConfirmSchedule() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((state) => state.user?.id)

  return useMutation({
    mutationFn: (scheduleId: string) =>
      schedulesApi.confirmSchedule(scheduleId, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamSchedules'] })
      queryClient.invalidateQueries({ queryKey: ['invoiceSchedule'] })
    },
  })
}

export function useCompleteSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (scheduleId: string) => schedulesApi.completeSchedule(scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamSchedules'] })
      queryClient.invalidateQueries({ queryKey: ['invoiceSchedule'] })
    },
  })
}

export function useCancelSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (scheduleId: string) => schedulesApi.cancelSchedule(scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamSchedules'] })
      queryClient.invalidateQueries({ queryKey: ['invoiceSchedule'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

export function useRemoveTeamFromInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invoiceId: string) => schedulesApi.removeTeamFromInvoice(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamSchedules'] })
      queryClient.invalidateQueries({ queryKey: ['invoiceSchedule'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}