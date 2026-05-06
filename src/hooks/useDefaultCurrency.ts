import { useAuthStore } from '@/stores/authStore'

/**
 * Returns the default currency ID based on active store, falling back to CUP.
 */
export function useDefaultCurrency(): string {
  const currentStore = useAuthStore((state) => state.currentStore)
  return currentStore?.currencyId || '11111111-1111-1111-1111-111111111111'
}
