import { vi } from 'vitest'
import type { Mock } from 'vitest'

type SupabaseMock = {
  auth: {
    signInWithPassword: Mock
    signUp: Mock
    signOut: Mock
    getSession: Mock
  }
  from: Mock
}

export const createMockSupabase = (): SupabaseMock => ({
  auth: {
    signInWithPassword: vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    }),
    signUp: vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@test.com' } },
      error: null,
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        then: vi.fn(),
      }),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
      order: vi.fn().mockReturnValue({
        then: vi.fn(),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        then: vi.fn(),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        then: vi.fn(),
      }),
    }),
  })),
})

export const mockUser = {
  id: 'test-user-id',
  email: 'test@test.com',
  full_name: 'Test User',
  organization_id: 'test-org-id',
  avatar_url: null,
  is_active: true,
}

export const mockOrganization = {
  id: 'test-org-id',
  name: 'Test Organization',
  slug: 'test-org',
  tax_id: '12345678',
  logo_url: null,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const mockSession = {
  access_token: 'mock-token',
  refresh_token: 'mock-refresh',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'Bearer',
  user: {
    id: mockUser.id,
    email: mockUser.email,
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  },
}