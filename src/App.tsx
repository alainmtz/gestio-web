import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { AppRouter } from '@/router/AppRouter'
import { AuthRouter } from '@/router/AuthRouter'
import { AcceptInvitationPage } from '@/pages/auth/AcceptInvitationPage'
import { ToastProvider } from '@/lib/toast'
import { supabase } from '@/lib/supabase'

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const navigate = useNavigate()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/auth/reset-password', { replace: true })
      }
    })
    return () => subscription.unsubscribe()
  }, [navigate])

  return (
    <ToastProvider>
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