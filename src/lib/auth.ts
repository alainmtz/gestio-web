import { supabase } from './supabase'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  fullName: string
  avatarUrl?: string
  organizationId?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  fullName: string
  organizationName: string
}

export async function signInWithPassword(credentials: LoginCredentials): Promise<{ user: AuthUser | null; session: Session | null; error: string | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  })

  if (error) {
    return { user: null, session: null, error: error.message }
  }

  if (!data.user) {
    return { user: null, session: null, error: 'No user returned' }
  }

  const profile = await getProfile(data.user.id)
  
  return {
    user: {
      id: data.user.id,
      email: data.user.email!,
      fullName: profile?.full_name || data.user.email?.split('@')[0] || 'User',
      avatarUrl: profile?.avatar_url || undefined,
      organizationId: profile?.organization_id || undefined,
    },
    session: data.session,
    error: null,
  }
}

export async function signUpWithPassword(data: RegisterData): Promise<{ user: AuthUser | null; session: Session | null; error: string | null }> {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.fullName,
      },
    },
  })

  if (authError) {
    return { user: null, session: null, error: authError.message }
  }

  if (!authData.user) {
    return { user: null, session: null, error: 'No user returned' }
  }

  // If no session yet (email confirmation required), we can't create org/profile
  if (!authData.session) {
    return { user: null, session: null, error: 'Por favor verifica tu correo electrónico para continuar.' }
  }

  // Create profile
  await supabase.from('profiles').upsert({
    id: authData.user.id,
    full_name: data.fullName,
    email: data.email,
  })

  // Create organization
  const { data: orgData, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: data.organizationName,
      slug: data.organizationName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    })
    .select()
    .single()

  if (orgError) {
    return { user: null, session: null, error: orgError.message }
  }

  // Update profile with organization
  await supabase
    .from('profiles')
    .update({ organization_id: orgData.id })
    .eq('id', authData.user.id)

  // Add user as owner
  await supabase.from('organization_members').insert({
    organization_id: orgData.id,
    user_id: authData.user.id,
    role: 'owner',
  })

  // Add default role for owner
  const { data: roleData } = await supabase
    .from('roles')
    .select('id')
    .eq('organization_id', orgData.id)
    .eq('name', 'owner')
    .single()

  if (roleData) {
    await supabase.from('user_roles').insert({
      user_id: authData.user.id,
      role_id: roleData.id,
      organization_id: orgData.id,
    })
  }

  return {
    user: {
      id: authData.user.id,
      email: authData.user.email!,
      fullName: data.fullName,
      organizationId: orgData.id,
    },
    session: authData.session,
    error: null,
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}

export async function resetPassword(email: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback/reset-password`,
  })
  return { error: error?.message || null }
}

export async function updatePassword(newPassword: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })
  return { error: error?.message || null }
}

export async function getProfile(userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return data
}

export async function updateProfile(userId: string, updates: { full_name?: string; avatar_url?: string }) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  return { data, error }
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getOrganizations() {
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData.session?.user) return []

  const { data } = await supabase
    .from('organization_members')
    .select(`
      organization_id,
      role,
      organizations (
        id,
        name,
        slug,
        tax_id,
        logo_url
      )
    `)
    .eq('user_id', sessionData.session.user.id)
    .eq('is_active', true)

  return data?.map((m) => ({
    ...(m.organizations as any),
    role: m.role,
  })) || []
}
