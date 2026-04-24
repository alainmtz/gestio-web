import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from './authStore'

describe('useAuthStore hook', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  describe('authentication state', () => {
    it('initial state is not authenticated', () => {
      const { result } = renderHook(() => useAuthStore())
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('initial user is null', () => {
      const { result } = renderHook(() => useAuthStore())
      expect(result.current.user).toBeNull()
    })

    it('initial session is null', () => {
      const { result } = renderHook(() => useAuthStore())
      expect(result.current.session).toBeNull()
    })

    it('initial organizations is empty', () => {
      const { result } = renderHook(() => useAuthStore())
      expect(result.current.organizations).toEqual([])
    })

    it('initial currentOrganization is null', () => {
      const { result } = renderHook(() => useAuthStore())
      expect(result.current.currentOrganization).toBeNull()
    })

    it('initial stores is empty', () => {
      const { result } = renderHook(() => useAuthStore())
      expect(result.current.stores).toEqual([])
    })

    it('initial currentStore is null', () => {
      const { result } = renderHook(() => useAuthStore())
      expect(result.current.currentStore).toBeNull()
    })

    it('initial permissions is empty', () => {
      const { result } = renderHook(() => useAuthStore())
      expect(result.current.permissions).toEqual([])
    })

    it('initial isLoading is false', () => {
      const { result } = renderHook(() => useAuthStore())
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('login updates state', () => {
    it('login sets user', () => {
      const { result } = renderHook(() => useAuthStore())
      
      act(() => {
        result.current.login(
          { id: 'u1', email: 'test@test.com', fullName: 'Test' },
          { accessToken: 'token', expiresAt: 123456 },
          [{ id: 'o1', name: 'Org', slug: 'org', plan: 'FREE' }]
        )
      })

      expect(result.current.user).toEqual({ id: 'u1', email: 'test@test.com', fullName: 'Test' })
    })

    it('login sets session', () => {
      const { result } = renderHook(() => useAuthStore())
      
      act(() => {
        result.current.login(
          { id: 'u1', email: 'test@test.com', fullName: 'Test' },
          { accessToken: 'token', expiresAt: 123456 },
          [{ id: 'o1', name: 'Org', slug: 'org', plan: 'FREE' }]
        )
      })

      expect(result.current.session).toEqual({ accessToken: 'token', expiresAt: 123456 })
    })

    it('login sets organizations', () => {
      const { result } = renderHook(() => useAuthStore())
      const orgs = [
        { id: 'o1', name: 'Org1', slug: 'org1', plan: 'FREE' as const },
        { id: 'o2', name: 'Org2', slug: 'org2', plan: 'PRO' as const },
      ]
      
      act(() => {
        result.current.login(
          { id: 'u1', email: 'test@test.com', fullName: 'Test' },
          { accessToken: 'token', expiresAt: 123456 },
          orgs
        )
      })

      expect(result.current.organizations).toEqual(orgs)
    })

    it('login sets isAuthenticated to true', () => {
      const { result } = renderHook(() => useAuthStore())
      
      act(() => {
        result.current.login(
          { id: 'u1', email: 'test@test.com', fullName: 'Test' },
          { accessToken: 'token', expiresAt: 123456 },
          [{ id: 'o1', name: 'Org', slug: 'org', plan: 'FREE' }]
        )
      })

      expect(result.current.isAuthenticated).toBe(true)
    })
  })

  describe('logout clears state', () => {
    it('logout clears user', () => {
      const { result } = renderHook(() => useAuthStore())
      
      act(() => {
        result.current.login(
          { id: 'u1', email: 'test@test.com', fullName: 'Test' },
          { accessToken: 'token', expiresAt: 123456 },
          [{ id: 'o1', name: 'Org', slug: 'org', plan: 'FREE' }]
        )
      })

      act(() => {
        result.current.logout()
      })

      expect(result.current.user).toBeNull()
    })

    it('logout clears session', () => {
      const { result } = renderHook(() => useAuthStore())
      
      act(() => {
        result.current.login(
          { id: 'u1', email: 'test@test.com', fullName: 'Test' },
          { accessToken: 'token', expiresAt: 123456 },
          [{ id: 'o1', name: 'Org', slug: 'org', plan: 'FREE' }]
        )
      })

      act(() => {
        result.current.logout()
      })

      expect(result.current.session).toBeNull()
    })

    it('logout clears organizations', () => {
      const { result } = renderHook(() => useAuthStore())
      
      act(() => {
        result.current.login(
          { id: 'u1', email: 'test@test.com', fullName: 'Test' },
          { accessToken: 'token', expiresAt: 123456 },
          [{ id: 'o1', name: 'Org', slug: 'org', plan: 'FREE' }]
        )
      })

      act(() => {
        result.current.logout()
      })

      expect(result.current.organizations).toEqual([])
    })

    it('logout sets isAuthenticated to false', () => {
      const { result } = renderHook(() => useAuthStore())
      
      act(() => {
        result.current.login(
          { id: 'u1', email: 'test@test.com', fullName: 'Test' },
          { accessToken: 'token', expiresAt: 123456 },
          [{ id: 'o1', name: 'Org', slug: 'org', plan: 'FREE' }]
        )
      })

      act(() => {
        result.current.logout()
      })

      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('setters', () => {
    it('setUser sets user', () => {
      const { result } = renderHook(() => useAuthStore())
      
      act(() => {
        result.current.setUser({ id: 'u1', email: 'test@test.com', fullName: 'Test' })
      })

      expect(result.current.user).toEqual({ id: 'u1', email: 'test@test.com', fullName: 'Test' })
    })

    it('setSession sets session', () => {
      const { result } = renderHook(() => useAuthStore())
      
      act(() => {
        result.current.setSession({ accessToken: 'token', expiresAt: 123456 })
      })

      expect(result.current.session).toEqual({ accessToken: 'token', expiresAt: 123456 })
    })

    it('selectOrganization sets currentOrganization', () => {
      const { result } = renderHook(() => useAuthStore())
      
      act(() => {
        result.current.selectOrganization({ id: 'o1', name: 'Org', slug: 'org', plan: 'FREE' })
      })

      expect(result.current.currentOrganization).toEqual({ id: 'o1', name: 'Org', slug: 'org', plan: 'FREE' })
    })

    it('setStores sets stores', () => {
      const { result } = renderHook(() => useAuthStore())
      const stores = [
        { id: 's1', organizationId: 'o1', name: 'Store 1', code: 'S001', currencyId: 'c1' },
      ]
      
      act(() => {
        result.current.setStores(stores)
      })

      expect(result.current.stores).toEqual(stores)
    })

    it('selectStore sets currentStore', () => {
      const { result } = renderHook(() => useAuthStore())
      const store = { id: 's1', organizationId: 'o1', name: 'Store 1', code: 'S001', currencyId: 'c1' }
      
      act(() => {
        result.current.selectStore(store)
      })

      expect(result.current.currentStore).toEqual(store)
    })

    it('setPermissions sets permissions', () => {
      const { result } = renderHook(() => useAuthStore())
      const permissions = ['invoices:create', 'products:read']
      
      act(() => {
        result.current.setPermissions(permissions)
      })

      expect(result.current.permissions).toEqual(permissions)
    })

    it('setLoading sets isLoading', () => {
      const { result } = renderHook(() => useAuthStore())
      
      act(() => {
        result.current.setLoading(true)
      })

      expect(result.current.isLoading).toBe(true)

      act(() => {
        result.current.setLoading(false)
      })

      expect(result.current.isLoading).toBe(false)
    })
  })
})