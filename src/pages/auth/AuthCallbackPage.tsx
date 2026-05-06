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
        if (session?.user?.email_confirmed_at) {
          navigate('/dashboard', { replace: true })
        } else {
          navigate('/auth/login', { replace: true })
        }
      } else if (event === 'USER_UPDATED') {
        navigate('/dashboard', { replace: true })
      }
    })

    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (sessionError) {
        setError(sessionError.message)
        setTimeout(() => navigate('/auth/login', { replace: true }), 3000)
      } else if (session) {
        navigate('/dashboard', { replace: true })
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate])

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
