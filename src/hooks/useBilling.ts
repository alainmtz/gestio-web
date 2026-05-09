import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import * as billingApi from '@/api/billing'

export function useOffers(options?: {
  storeId?: string
  status?: string
  search?: string
  page?: number
  pageSize?: number
}) {
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const currentStore = useAuthStore((state) => state.currentStore)

  return useQuery({
    queryKey: ['offers', organizationId, currentStore?.id, options],
    queryFn: () => billingApi.getOffers(organizationId!, { ...options, storeId: options?.storeId || currentStore?.id }),
    enabled: !!organizationId,
  })
}

export function useOffer(id: string) {
  return useQuery({
    queryKey: ['offer', id],
    queryFn: () => billingApi.getOffer(id),
    enabled: !!id,
  })
}

export function useCreateOffer() {
  const queryClient = useQueryClient()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const userId = useAuthStore((state) => state.user?.id)

  return useMutation({
    mutationFn: (input: billingApi.CreateOfferInput) =>
      billingApi.createOffer(organizationId!, userId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] })
    },
  })
}

export function useConvertOfferToInvoice() {
  const queryClient = useQueryClient()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const userId = useAuthStore((state) => state.user?.id)

  return useMutation({
    mutationFn: (offerId: string) =>
      billingApi.convertOfferToInvoice(offerId, organizationId!, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

export function useConvertOfferToPreInvoice() {
  const queryClient = useQueryClient()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const userId = useAuthStore((state) => state.user?.id)

  return useMutation({
    mutationFn: (offerId: string) =>
      billingApi.convertOfferToPreInvoice(offerId, organizationId!, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      queryClient.invalidateQueries({ queryKey: ['preInvoices'] })
    },
  })
}

export function useRejectOffer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ offerId, reason }: { offerId: string; reason: string }) =>
      billingApi.rejectOffer(offerId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] })
    },
  })
}

export function usePreInvoices(options?: {
  storeId?: string
  status?: string
  search?: string
  page?: number
  pageSize?: number
}) {
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const currentStore = useAuthStore((state) => state.currentStore)

  return useQuery({
    queryKey: ['preInvoices', organizationId, currentStore?.id, options],
    queryFn: () => billingApi.getPreInvoices(organizationId!, { ...options, storeId: options?.storeId || currentStore?.id }),
    enabled: !!organizationId,
  })
}

export function usePreInvoice(id: string) {
  return useQuery({
    queryKey: ['preInvoice', id],
    queryFn: () => billingApi.getPreInvoice(id),
    enabled: !!id,
  })
}

export function useConvertPreInvoiceToInvoice() {
  const queryClient = useQueryClient()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const userId = useAuthStore((state) => state.user?.id)

  return useMutation({
    mutationFn: (preInvoiceId: string) =>
      billingApi.convertPreInvoiceToInvoice(preInvoiceId, organizationId!, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preInvoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

export function useRejectPreInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ preInvoiceId, reason }: { preInvoiceId: string; reason: string }) =>
      billingApi.rejectPreInvoice(preInvoiceId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preInvoices'] })
    },
  })
}

export function useInvoices(options?: {
  storeId?: string
  status?: string
  paymentStatus?: string
  search?: string
  page?: number
  pageSize?: number
}) {
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const currentStore = useAuthStore((state) => state.currentStore)

  return useQuery({
    queryKey: ['invoices', organizationId, currentStore?.id, options],
    queryFn: () => billingApi.getInvoices(organizationId!, { ...options, storeId: options?.storeId || currentStore?.id }),
    enabled: !!organizationId,
  })
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: () => billingApi.getInvoice(id),
    enabled: !!id,
  })
}

export function useAddInvoicePayment() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((state) => state.user?.id)

  return useMutation({
    mutationFn: ({ invoiceId, amount, method, reference, extra }: {
      invoiceId: string
      amount: number
      method: string
      reference?: string
      extra?: { card_number?: string; customer_name?: string; identity_card?: string; transfer_code?: string }
    }) => billingApi.addInvoicePayment(invoiceId, userId!, amount, method, reference, extra),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['salesReport'] })
      queryClient.invalidateQueries({ queryKey: ['financialReport'] })
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useCreatePreInvoice() {
  const queryClient = useQueryClient()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const userId = useAuthStore((state) => state.user?.id)

  return useMutation({
    mutationFn: (input: billingApi.CreatePreInvoiceInput) =>
      billingApi.createPreInvoice(organizationId!, userId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preInvoices'] })
    },
  })
}

export function useUpdateOffer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ offerId, input }: { offerId: string; input: billingApi.UpdateOfferInput }) =>
      billingApi.updateOffer(offerId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['offer', variables.offerId] })
      queryClient.invalidateQueries({ queryKey: ['offers'] })
    },
  })
}

export function useUpdatePreInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ preInvoiceId, input }: { preInvoiceId: string; input: billingApi.UpdatePreInvoiceInput }) =>
      billingApi.updatePreInvoice(preInvoiceId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['preInvoice', variables.preInvoiceId] })
      queryClient.invalidateQueries({ queryKey: ['preInvoices'] })
    },
  })
}

export function useApprovePreInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (preInvoiceId: string) => billingApi.approvePreInvoice(preInvoiceId),
    onSuccess: (_, preInvoiceId) => {
      queryClient.invalidateQueries({ queryKey: ['preInvoice', preInvoiceId] })
      queryClient.invalidateQueries({ queryKey: ['preInvoices'] })
    },
  })
}

export function useSubmitPreInvoiceForApproval() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (preInvoiceId: string) => billingApi.submitPreInvoiceForApproval(preInvoiceId),
    onSuccess: (_, preInvoiceId) => {
      queryClient.invalidateQueries({ queryKey: ['preInvoice', preInvoiceId] })
      queryClient.invalidateQueries({ queryKey: ['preInvoices'] })
    },
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const userId = useAuthStore((state) => state.user?.id)

  return useMutation({
    mutationFn: (input: billingApi.CreateInvoiceInput) =>
      billingApi.createInvoice(organizationId!, userId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['salesReport'] })
      queryClient.invalidateQueries({ queryKey: ['financialReport'] })
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const userId = useAuthStore((state) => state.user?.id)

  return useMutation({
    mutationFn: ({ invoiceId, input }: { invoiceId: string; input: billingApi.UpdateInvoiceInput }) =>
      billingApi.updateInvoice(invoiceId, organizationId!, userId!, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['salesReport'] })
      queryClient.invalidateQueries({ queryKey: ['financialReport'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useCancelInvoice() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((state) => state.user?.id)

  return useMutation({
    mutationFn: (invoiceId: string) => billingApi.cancelInvoice(invoiceId, userId ?? undefined),
    onSuccess: (_, invoiceId) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['salesReport'] })
      queryClient.invalidateQueries({ queryKey: ['financialReport'] })
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
