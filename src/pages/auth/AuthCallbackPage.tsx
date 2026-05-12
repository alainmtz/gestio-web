import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string>()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/auth/reset-password', { replace: true })
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        handlePostAuth(session)
      } else if (event === 'USER_UPDATED') {
        navigate('/dashboard', { replace: true })
      }
    })

    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (sessionError) {
        setError(sessionError.message)
        setTimeout(() => navigate('/auth/login', { replace: true }), 3000)
      } else if (session) {
        handlePostAuth(session)
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

  async function handlePostAuth(session: any) {
    if (!session?.user) {
      navigate('/auth/login', { replace: true })
      return
    }

    // Check if user already has organization memberships
    const { data: memberships } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', session.user.id)
      .limit(1)

    if (memberships && memberships.length > 0) {
      // Existing user — go to dashboard
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
