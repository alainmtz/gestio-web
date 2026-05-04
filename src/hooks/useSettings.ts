import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import * as settingsApi from '@/api/settings'

export function useCurrencies() {
  return useQuery({
    queryKey: ['currencies'],
    queryFn: () => settingsApi.getCurrencies(),
  })
}

export function useExchangeRates(options?: {
  baseCurrencyId?: string
  targetCurrencyId?: string
  startDate?: string
  endDate?: string
}) {
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)

  return useQuery({
    queryKey: ['exchangeRates', organizationId, options],
    queryFn: () => settingsApi.getExchangeRates({ organizationId: organizationId!, ...options }),
    enabled: !!organizationId,
  })
}

export function useCreateExchangeRate() {
  const queryClient = useQueryClient()
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)

  return useMutation({
    mutationFn: (input: settingsApi.CreateExchangeRateInput) =>
      settingsApi.createExchangeRate(organizationId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchangeRates'] })
    },
  })
}

export function useUpdateExchangeRate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: { rate: number; date: string } }) =>
      settingsApi.updateExchangeRate(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchangeRates'] })
    },
  })
}

export function useDeleteExchangeRate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => settingsApi.deleteExchangeRate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchangeRates'] })
    },
  })
}

export function useLatestExchangeRate(baseCurrencyId: string, targetCurrencyId: string) {
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)

  return useQuery({
    queryKey: ['latestExchangeRate', organizationId, baseCurrencyId, targetCurrencyId],
    queryFn: () =>
      settingsApi.getLatestExchangeRate(organizationId!, baseCurrencyId, targetCurrencyId),
    enabled: !!organizationId && !!baseCurrencyId && !!targetCurrencyId,
  })
}

export function useExchangeRateHistory(days: number = 7) {
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)

  return useQuery({
    queryKey: ['exchangeRateHistory', organizationId, days],
    queryFn: () => settingsApi.getExchangeRateHistory(organizationId!, days),
    enabled: !!organizationId,
  })
}

export function useLatestRatesToCupByCodes(codes: string[]) {
  const organizationId = useAuthStore((state) => state.currentOrganization?.id)
  const normalizedCodes = Array.from(new Set(codes.map((c) => c.trim().toUpperCase()).filter(Boolean))).sort()

  return useQuery({
    queryKey: ['latestRatesToCupByCodes', organizationId, normalizedCodes],
    queryFn: () => settingsApi.getLatestRatesToCupByCodes(organizationId!, normalizedCodes),
    enabled: !!organizationId && normalizedCodes.length > 0,
  })
}