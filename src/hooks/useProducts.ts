import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import * as productsApi from '@/api/products'

export function useProducts(options?: {
  storeId?: string
  categoryId?: string
  search?: string
  page?: number
  pageSize?: number
}) {
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const currentStore = useAuthStore((state) => state.currentStore)

  return useQuery({
    queryKey: ['products', organizationId, currentStore?.id, options],
    queryFn: () => productsApi.getProducts(organizationId!, { ...options, storeId: options?.storeId || currentStore?.id }),
    enabled: !!organizationId,
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getProduct(id),
    enabled: !!id,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const userId = useAuthStore((state) => state.user?.id)

  return useMutation({
    mutationFn: (input: productsApi.CreateProductInput) =>
      productsApi.createProduct(organizationId!, userId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: productsApi.UpdateProductInput }) =>
      productsApi.updateProduct(id, input),
    onSuccess: (updated) => {
      queryClient.setQueryData(['product', updated.id], updated)
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => productsApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

export function useCategories() {
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)

  return useQuery({
    queryKey: ['categories', organizationId],
    queryFn: () => productsApi.getCategories(organizationId!),
    enabled: !!organizationId,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)

  return useMutation({
    mutationFn: ({ name, parentId }: { name: string; parentId?: string }) =>
      productsApi.createCategory(organizationId!, name, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useMovements(options?: {
  storeId?: string
  productId?: string
  movementType?: productsApi.MovementType
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}) {
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)

  return useQuery({
    queryKey: ['movements', organizationId, options],
    queryFn: () => productsApi.getMovements(organizationId!, options),
    enabled: !!organizationId,
  })
}

export function useCreateMovement() {
  const queryClient = useQueryClient()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const userId = useAuthStore((state) => state.user?.id)

  return useMutation({
    mutationFn: (input: productsApi.CreateMovementInput) =>
      productsApi.createMovement(organizationId!, userId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['inventoryReport'] })
    },
  })
}

export function useUpdateMovement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: productsApi.UpdateMovementInput }) =>
      productsApi.updateMovement(id, input),
    onSuccess: (_, { input }) => {
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['inventoryReport'] })
      if (input.store_id !== undefined) {
        queryClient.invalidateQueries({ queryKey: ['stores'] })
      }
    },
  })
}
