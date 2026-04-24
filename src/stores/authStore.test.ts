import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore, type User, type Organization } from './authStore'

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  describe('initial state', () => {
    it('has null user', () => {
      expect(useAuthStore.getState().user).toBeNull()
    })

    it('has null session', () => {
      expect(useAuthStore.getState().session).toBeNull()
    })

    it('has empty organizations', () => {
      expect(useAuthStore.getState().organizations).toEqual([])
    })

    it('has null currentOrganization', () => {
      expect(useAuthStore.getState().currentOrganization).toBeNull()
    })

    it('has empty stores', () => {
      expect(useAuthStore.getState().stores).toEqual([])
    })

    it('has null currentStore', () => {
      expect(useAuthStore.getState().currentStore).toBeNull()
    })

    it('is not authenticated', () => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })

    it('is not loading', () => {
      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })

  describe('login action', () => {
    it('sets user on login', () => {
      const user: User = { id: 'u1', email: 'test@test.com', fullName: 'Test User' }
      const session = { accessToken: 'token', expiresAt: 123456 }
      const organizations: Organization[] = [{ id: 'org1', name: 'Org', slug: 'org', plan: 'FREE' }]

      useAuthStore.getState().login(user, session, organizations)

      expect(useAuthStore.getState().user).toEqual(user)
    })

    it('sets session on login', () => {
      const user: User = { id: 'u1', email: 'test@test.com', fullName: 'Test User' }
      const session = { accessToken: 'token', expiresAt: 123456 }
      const organizations: Organization[] = [{ id: 'org1', name: 'Org', slug: 'org', plan: 'FREE' }]

      useAuthStore.getState().login(user, session, organizations)

      expect(useAuthStore.getState().session).toEqual(session)
    })

    it('sets organizations on login', () => {
      const user: User = { id: 'u1', email: 'test@test.com', fullName: 'Test User' }
      const session = { accessToken: 'token', expiresAt: 123456 }
      const organizations: Organization[] = [
        { id: 'org1', name: 'Org1', slug: 'org1', plan: 'FREE' },
        { id: 'org2', name: 'Org2', slug: 'org2', plan: 'PRO' },
      ]

      useAuthStore.getState().login(user, session, organizations)

      expect(useAuthStore.getState().organizations).toEqual(organizations)
    })

    it('sets isAuthenticated to true on login', () => {
      const user: User = { id: 'u1', email: 'test@test.com', fullName: 'Test User' }
      const session = { accessToken: 'token', expiresAt: 123456 }
      const organizations: Organization[] = [{ id: 'org1', name: 'Org', slug: 'org', plan: 'FREE' }]

      useAuthStore.getState().login(user, session, organizations)

      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })

    it('selects first organization automatically', () => {
      const user: User = { id: 'u1', email: 'test@test.com', fullName: 'Test User' }
      const session = { accessToken: 'token', expiresAt: 123456 }
      const organizations: Organization[] = [
        { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Org1', slug: 'org1', plan: 'FREE' },
        { id: '123e4567-e89b-12d3-a456-426614174001', name: 'Org2', slug: 'org2', plan: 'PRO' },
      ]

      useAuthStore.getState().login(user, session, organizations)

      expect(useAuthStore.getState().currentOrganization).toEqual(organizations[0])
    })
  })

  describe('logout action', () => {
    it('clears user on logout', () => {
      const user: User = { id: 'u1', email: 'test@test.com', fullName: 'Test User' }
      const session = { accessToken: 'token', expiresAt: 123456 }
      const organizations: Organization[] = [{ id: 'org1', name: 'Org', slug: 'org', plan: 'FREE' }]

      useAuthStore.getState().login(user, session, organizations)
      useAuthStore.getState().logout()

      expect(useAuthStore.getState().user).toBeNull()
    })

    it('clears session on logout', () => {
      const user: User = { id: 'u1', email: 'test@test.com', fullName: 'Test User' }
      const session = { accessToken: 'token', expiresAt: 123456 }
      const organizations: Organization[] = [{ id: 'org1', name: 'Org', slug: 'org', plan: 'FREE' }]

      useAuthStore.getState().login(user, session, organizations)
      useAuthStore.getState().logout()

      expect(useAuthStore.getState().session).toBeNull()
    })

    it('clears organizations on logout', () => {
      const user: User = { id: 'u1', email: 'test@test.com', fullName: 'Test User' }
      const session = { accessToken: 'token', expiresAt: 123456 }
      const organizations: Organization[] = [{ id: 'org1', name: 'Org', slug: 'org', plan: 'FREE' }]

      useAuthStore.getState().login(user, session, organizations)
      useAuthStore.getState().logout()

      expect(useAuthStore.getState().organizations).toEqual([])
    })

    it('sets isAuthenticated to false on logout', () => {
      const user: User = { id: 'u1', email: 'test@test.com', fullName: 'Test User' }
      const session = { accessToken: 'token', expiresAt: 123456 }
      const organizations: Organization[] = [{ id: 'org1', name: 'Org', slug: 'org', plan: 'FREE' }]

      useAuthStore.getState().login(user, session, organizations)
      useAuthStore.getState().logout()

      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })
  })

  describe('setUser action', () => {
    it('sets user', () => {
      const user: User = { id: 'u1', email: 'test@test.com', fullName: 'Test User' }
      useAuthStore.getState().setUser(user)
      expect(useAuthStore.getState().user).toEqual(user)
    })

    it('can set null user', () => {
      const user: User = { id: 'u1', email: 'test@test.com', fullName: 'Test User' }
      useAuthStore.getState().setUser(user)
      useAuthStore.getState().setUser(null)
      expect(useAuthStore.getState().user).toBeNull()
    })
  })

  describe('setSession action', () => {
    it('sets session', () => {
      const session = { accessToken: 'token', expiresAt: 123456 }
      useAuthStore.getState().setSession(session)
      expect(useAuthStore.getState().session).toEqual(session)
    })
  })

  describe('setOrganizations action', () => {
    it('sets organizations', () => {
      const organizations: Organization[] = [
        { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Org1', slug: 'org1', plan: 'FREE' },
      ]
      useAuthStore.getState().setOrganizations(organizations)
      expect(useAuthStore.getState().organizations).toEqual(organizations)
    })
  })

  describe('selectOrganization action', () => {
    it('sets currentOrganization', () => {
      const org: Organization = { id: 'org1', name: 'Org', slug: 'org', plan: 'FREE' }
      useAuthStore.getState().selectOrganization(org)
      expect(useAuthStore.getState().currentOrganization).toEqual(org)
    })
  })

  describe('setStores action', () => {
    it('sets stores', () => {
      const stores = [
        { id: 's1', organizationId: 'org1', name: 'Store 1', code: 'S001', currencyId: 'c1' },
        { id: 's2', organizationId: 'org1', name: 'Store 2', code: 'S002', currencyId: 'c1' },
      ]
      useAuthStore.getState().setStores(stores)
      expect(useAuthStore.getState().stores).toEqual(stores)
    })
  })

  describe('selectStore action', () => {
    it('sets currentStore', () => {
      const store = { id: 's1', organizationId: 'org1', name: 'Store 1', code: 'S001', currencyId: 'c1' }
      useAuthStore.getState().selectStore(store)
      expect(useAuthStore.getState().currentStore).toEqual(store)
    })

    it('can set null store', () => {
      const store = { id: 's1', organizationId: 'org1', name: 'Store 1', code: 'S001', currencyId: 'c1' }
      useAuthStore.getState().selectStore(store)
      useAuthStore.getState().selectStore(null)
      expect(useAuthStore.getState().currentStore).toBeNull()
    })
  })

  describe('setPermissions action', () => {
    it('sets permissions', () => {
      const permissions = ['invoices:create', 'invoices:read', 'products:create']
      useAuthStore.getState().setPermissions(permissions)
      expect(useAuthStore.getState().permissions).toEqual(permissions)
    })
  })

  describe('setLoading action', () => {
    it('sets isLoading', () => {
      useAuthStore.getState().setLoading(true)
      expect(useAuthStore.getState().isLoading).toBe(true)
      useAuthStore.getState().setLoading(false)
      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })
})