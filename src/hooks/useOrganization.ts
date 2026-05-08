import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore, type Organization, type Store as AuthStore } from '@/stores/authStore'
import { getStores } from '@/api/stores'
import type { Store as ApiStore } from '@/api/stores'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function isValidUUID(id: string | undefined | null): id is string {
  return !!id && UUID_REGEX.test(id)
}

function assertValidUUID(id: string | undefined | null): string {
  if (!isValidUUID(id)) {
    throw new Error('Invalid organization ID')
  }
  return id
}

function mapStoreToAuthStore(store: ApiStore): AuthStore {
  return {
    id: store.id,
    organizationId: store.organization_id,
    name: store.name,
    code: store.code,
    currencyId: store.currency_id || 'USD',
  }
}

export function useOrganization() {
  const currentOrganization = useAuthStore((state) => state.currentOrganization)
  const organizations = useAuthStore((state) => state.organizations)
  const selectOrganization = useAuthStore((state) => state.selectOrganization)
  const currentStore = useAuthStore((state) => state.currentStore)
  const stores = useAuthStore((state) => state.stores)
  const selectStore = useAuthStore((state) => state.selectStore)
  const setStores = useAuthStore((state) => state.setStores)
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()

  useEffect(() => {
    const orgId: string | undefined = currentOrganization?.id
    if (orgId && isValidUUID(orgId) && user) {
      getStores(orgId)
        .then((orgStores) => {
          const mappedStores = orgStores.map(mapStoreToAuthStore)
          setStores(mappedStores)
          if (mappedStores.length > 0 && currentStore) {
            const existingStore = mappedStores.find(s => s.id === currentStore.id)
            if (!existingStore) {
              selectStore(null)
            }
          }
        })
        .catch(() => {
          setStores([])
          selectStore(null)
        })
    } else {
      setStores([])
      selectStore(null)
    }
  }, [currentOrganization?.id, user?.id])

  const handleSelectOrganization = async (org: Organization) => {
    selectOrganization(org)
    selectStore(null)
    queryClient.clear()
  }

  return {
    organizations,
    currentOrganization,
    selectOrganization: handleSelectOrganization,
    stores,
    currentStore,
    selectStore,
  }
}