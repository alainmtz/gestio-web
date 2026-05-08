import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { initTheme } from '@/stores/themeStore'
import { AppRouter } from '@/router/AppRouter'
import { AuthRouter } from '@/router/AuthRouter'
import { AcceptInvitationPage } from '@/pages/auth/AcceptInvitationPage'
import { ToastProvider } from '@/lib/toast'
import { supabase } from '@/lib/supabase'
import { Analytics } from '@vercel/analytics/react'

// Initialize theme before first render to avoid flash
initTheme()

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        logout()
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        logout()
      }
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/auth/reset-password', { replace: true })
      }
    })
    return () => subscription.unsubscribe()
  }, [navigate, logout])

  return (
    <ToastProvider>
      <Analytics />
      <Routes>
        <Route path="/auth/*" element={<AuthRouter />} />
        <Route path="/accept-invitation/:token" element={<AcceptInvitationPage />} />
        <Route
          path="/*"
          element={isAuthenticated ? <AppRouter /> : <Navigate to="/auth/login" replace />}
        />
      </Routes>
    </ToastProvider>
  )
}

export default App