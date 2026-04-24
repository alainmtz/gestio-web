import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import * as eltoqueApi from '@/api/eltoque'

export function useElToqueToken() {
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)

  return useQuery({
    queryKey: ['eltoqueToken', organizationId],
    queryFn: () => eltoqueApi.getElToqueToken(organizationId!),
    enabled: !!organizationId,
  })
}

export function useSyncFromElToque() {
  const queryClient = useQueryClient()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)

  return useMutation({
    mutationFn: () => eltoqueApi.syncFromElToque(organizationId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchangeRates'] })
    },
  })
}

export function useSaveElToqueToken() {
  const queryClient = useQueryClient()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)

  return useMutation({
    mutationFn: (token: string) => eltoqueApi.saveElToqueToken(organizationId!, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eltoqueToken'] })
    },
  })
}