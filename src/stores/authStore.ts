import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  fullName: string
  phone?: string
  avatarUrl?: string
  organizationId?: string
  role?: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  taxId?: string
  plan: 'FREE' | 'PRO' | 'ENTERPRISE'
  logoUrl?: string
}

export interface Store {
  id: string
  organizationId: string
  name: string
  code: string
  currencyId: string
}

interface AuthState {
  user: User | null
  session: { accessToken: string; expiresAt: number } | null
  organizations: Organization[]
  currentOrganization: Organization | null
  currentStore: Store | null
  stores: Store[]
  permissions: string[]
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthActions {
  setUser: (user: User | null) => void
  setSession: (session: { accessToken: string; expiresAt: number } | null) => void
  setOrganizations: (organizations: Organization[]) => void
  selectOrganization: (org: Organization) => void
  setStores: (stores: Store[]) => void
  selectStore: (store: Store | null) => void
  setPermissions: (permissions: string[]) => void
  login: (user: User, session: { accessToken: string; expiresAt: number }, organizations: Organization[]) => void
  logout: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      organizations: [],
      currentOrganization: null,
      currentStore: null,
      stores: [],
      permissions: [],
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setOrganizations: (organizations) => set({ organizations }),
      selectOrganization: (org) => set({ currentOrganization: org }),
      setStores: (stores) => set({ stores }),
      selectStore: (store) => set({ currentStore: store }),
      setPermissions: (permissions) => set({ permissions }),
      
      login: (user, session, organizations) => {
        const validOrg = organizations.find(org => org.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(org.id))
        set({
          user,
          session,
          organizations,
          currentOrganization: validOrg || null,
          isAuthenticated: true,
          isLoading: false,
        })
      },
      
      logout: () => {
        set({
          user: null,
          session: null,
          organizations: [],
          currentOrganization: null,
          currentStore: null,
          stores: [],
          permissions: [],
          isAuthenticated: false,
        })
      },
      
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'gestio-auth',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        organizations: state.organizations,
        currentOrganization: state.currentOrganization,
        currentStore: state.currentStore,
        stores: state.stores,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
