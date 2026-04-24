import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import * as customersApi from '@/api/customers'

export function useCustomers(options?: {
  type?: 'customer' | 'supplier'
  search?: string
  page?: number
  pageSize?: number
}) {
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)

  return useQuery({
    queryKey: ['customers', organizationId, options],
    queryFn: () => customersApi.getCustomers(organizationId!, options),
    enabled: !!organizationId,
  })
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.getCustomer(id),
    enabled: !!id,
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)


  return useMutation({
    mutationFn: (input: customersApi.CreateCustomerInput) =>
      customersApi.createCustomer(organizationId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: customersApi.UpdateCustomerInput }) =>
      customersApi.updateCustomer(id, input),
    onSuccess: (updated) => {
      queryClient.setQueryData(['customer', updated.id], updated)
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => customersApi.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function useCustomerAddresses(customerId: string) {
  return useQuery({
    queryKey: ['customerAddresses', customerId],
    queryFn: () => customersApi.getCustomerAddresses(customerId),
    enabled: !!customerId,
  })
}

export function useCustomerContacts(customerId: string) {
  return useQuery({
    queryKey: ['customerContacts', customerId],
    queryFn: () => customersApi.getCustomerContacts(customerId),
    enabled: !!customerId,
  })
}
