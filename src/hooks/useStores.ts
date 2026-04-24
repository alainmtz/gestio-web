import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import * as storesApi from '@/api/stores'

export function useStores() {
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)

  return useQuery({
    queryKey: ['stores', organizationId],
    queryFn: () => storesApi.getStores(organizationId!),
    enabled: !!organizationId,
  })
}

export function useAllStores() {
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)

  return useQuery({
    queryKey: ['stores', organizationId, 'all'],
    queryFn: () => storesApi.getStores(organizationId!, { includeInactive: true }),
    enabled: !!organizationId,
  })
}

export function useStore(id: string) {
  return useQuery({
    queryKey: ['store', id],
    queryFn: () => storesApi.getStore(id),
    enabled: !!id,
  })
}

export function useCreateStore() {
  const queryClient = useQueryClient()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)

  return useMutation({
    mutationFn: (input: storesApi.CreateStoreInput) =>
      storesApi.createStore(organizationId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] })
    },
  })
}

export function useUpdateStore() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: storesApi.UpdateStoreInput }) =>
      storesApi.updateStore(id, input),
    onSuccess: (updated) => {
      queryClient.setQueryData(['store', updated.id], updated)
      queryClient.invalidateQueries({ queryKey: ['stores'] })
    },
  })
}

export function useDeleteStore() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => storesApi.deleteStore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] })
    },
  })
}

export function useReactivateStore() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => storesApi.updateStore(id, { is_active: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] })
    },
  })
}

export function useUserStores() {
  const userId = useAuthStore((state) => state.user?.id)

  return useQuery({
    queryKey: ['userStores', userId],
    queryFn: () => storesApi.getUserStores(userId!),
    enabled: !!userId,
  })
}
