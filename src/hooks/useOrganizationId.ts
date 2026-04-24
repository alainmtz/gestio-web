import { useAuthStore } from '@/stores/authStore'
import { isValidUUID } from './useOrganization'

export function useOrganizationId(): string | null {
  const currentOrganization = useAuthStore((state) => state.currentOrganization)
  const orgId = currentOrganization?.id
  
  if (!isValidUUID(orgId)) {
    return null
  }
  
  return orgId
}