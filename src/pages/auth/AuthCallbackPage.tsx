import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore, type User, type Organization } from '@/stores/authStore'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [error, setError] = useState<string>()
  const processingRef = useRef(false)

  useEffect(() => {
    if (processingRef.current) return
    processingRef.current = true

    async function handleCallback() {
      // ── 1. PKCE code exchange (OAuth redirect lands here) ──
      const queryParams = new URLSearchParams(window.location.search)
      const code = queryParams.get('code')

      if (code) {
        const { data: { session }, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
          setError(exchangeError.message)
          setTimeout(() => navigate('/auth/login', { replace: true }), 3000)
          return
        }

        if (session?.user) {
          await handlePostAuth(session)
          return
        }
      }

      // ── 2. Fallback: session already in storage ──
      const { data: { session }, error: sessionError } =
        await supabase.auth.getSession()

      if (sessionError) {
        setError(sessionError.message)
        setTimeout(() => navigate('/auth/login', { replace: true }), 3000)
      } else if (session?.user) {
        await handlePostAuth(session)
      }
    }

    handleCallback()

    // ── 3. Backup listener for events that fire after mount ──
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/auth/reset-password', { replace: true })
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        handlePostAuth(session)
      } else if (event === 'USER_UPDATED') {
        navigate('/dashboard', { replace: true })
      }
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handlePostAuth(session: any) {
    if (!session?.user) {
      navigate('/auth/login', { replace: true })
      return
    }

    // Check if user already has organization memberships
    const { data: memberships } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', session.user.id)

    if (memberships && memberships.length > 0) {
      // Existing user — fetch profile & orgs, update store, go to dashboard
      const [{ data: profileData }, { data: orgsData }] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', session.user.id)
          .maybeSingle(),
        supabase
          .from('organizations')
          .select('*')
          .in('id', memberships.map(m => m.organization_id))
          .eq('is_active', true),
      ])

      const organizations: Organization[] = (orgsData || []).map(org => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        taxId: org.tax_id || undefined,
        plan: org.plan,
        logoUrl: org.logo_url || undefined,
      }))

      const user: User = {
        id: session.user.id,
        email: session.user.email || '',
        fullName: profileData?.full_name || session.user.email?.split('@')[0] || 'Usuario',
        avatarUrl: profileData?.avatar_url || undefined,
        role: memberships[0]?.role || 'MEMBER',
      }

      login(user, {
        accessToken: session.access_token,
        expiresAt: session.expires_at || Date.now() + 3600000,
      }, organizations)

      navigate('/dashboard', { replace: true })
    } else {
      // New user (likely from Google OAuth) — complete registration
      navigate('/auth/register?oauth_flow=true', { replace: true })
    }
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Error al verificar tu cuenta: {error}</p>
          <p className="text-sm text-muted-foreground mt-2">Redirigiendo al login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground mt-4">Verificando tu cuenta...</p>
      </div>
    </div>
  )
}
