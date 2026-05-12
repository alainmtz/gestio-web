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
      // ── New user — check for pending invitations ──
      let inviteToAccept: { id: string; organization_id: string; role: string; email: string } | null = null

      // 1. Check localStorage for explicit invitation token (from AcceptInvitationPage Google button)
      const pendingToken = localStorage.getItem('pending_invitation_token')
      if (pendingToken) {
        localStorage.removeItem('pending_invitation_token')
        const { data: invite } = await supabase
          .from('organization_invitations')
          .select('id, organization_id, role, email, expires_at, accepted_at')
          .eq('invitation_token', pendingToken)
          .single()

        if (invite && !invite.accepted_at && new Date(invite.expires_at) > new Date()) {
          inviteToAccept = invite
        }
      }

      // 2. If no token match, check by email (direct Google sign-up with pending invite)
      if (!inviteToAccept) {
        const userEmail = session.user.email?.toLowerCase()
        if (userEmail) {
          const { data: pendingInvites } = await supabase
            .from('organization_invitations')
            .select('id, organization_id, role, email, expires_at, accepted_at')
            .eq('email', userEmail)
            .is('accepted_at', null)
            .gt('expires_at', new Date().toISOString())

          if (pendingInvites && pendingInvites.length > 0) {
            inviteToAccept = pendingInvites[0]
          }
        }
      }

      if (inviteToAccept) {
        // ── Auto-accept invitation ──
        const userId = session.user.id
        const userMeta = session.user.user_metadata || {}

        await supabase.from('profiles').upsert({
          id: userId,
          full_name: userMeta.full_name || userMeta.name || session.user.email?.split('@')[0] || 'Usuario',
          avatar_url: userMeta.avatar_url || userMeta.picture || null,
        })

        await supabase.from('organization_members').insert({
          user_id: userId,
          organization_id: inviteToAccept.organization_id,
          role: inviteToAccept.role,
          is_active: true,
        })

        await supabase.from('organization_invitations')
          .update({ accepted_at: new Date().toISOString() })
          .eq('id', inviteToAccept.id)

        // Notify owners
        const { data: owners } = await supabase
          .from('organization_members')
          .select('user_id')
          .eq('organization_id', inviteToAccept.organization_id)
          .eq('role', 'owner')
          .neq('user_id', userId)

        if (owners && owners.length > 0) {
          await supabase.from('notifications').insert(
            owners.map((o: any) => ({
              user_id: o.user_id,
              organization_id: inviteToAccept!.organization_id,
              type: 'member_joined',
              title: 'Nuevo miembro',
              message: `${inviteToAccept.email} se ha unido a la organización como ${inviteToAccept.role === 'owner' ? 'Propietario' : inviteToAccept.role === 'admin' ? 'Administrador' : 'Miembro'}.`,
              href: '/settings/members',
              metadata: {
                member_email: inviteToAccept.email,
                member_role: inviteToAccept.role,
                joined_at: new Date().toISOString(),
              },
            }))
          )
        }

        // Fetch org data
        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', inviteToAccept.organization_id)
          .single()

        if (orgData) {
          const user: User = {
            id: userId,
            email: inviteToAccept.email,
            fullName: userMeta.full_name || userMeta.name || session.user.email?.split('@')[0] || 'Usuario',
            avatarUrl: userMeta.avatar_url || userMeta.picture || undefined,
            role: inviteToAccept.role,
          }

          const organizations: Organization[] = [{
            id: orgData.id,
            name: orgData.name,
            slug: orgData.slug,
            taxId: orgData.tax_id || undefined,
            plan: orgData.plan,
            logoUrl: orgData.logo_url || undefined,
          }]

          login(user, {
            accessToken: session.access_token,
            expiresAt: session.expires_at || Date.now() + 3600000,
          }, organizations)

          // Store onboarding info for welcome banner
          sessionStorage.setItem('gestio_joined_org', JSON.stringify({
            name: orgData.name,
            role: inviteToAccept.role,
          }))

          navigate('/dashboard', { replace: true })
          return
        }
      }

      // No pending invitation — standard OAuth registration flow
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
