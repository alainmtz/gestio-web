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
import { fetchRolePermissions } from '@/hooks/usePermissions'
import { PermissionGuard } from '@/components/guards/PermissionGuard'

// Initialize theme before first render to avoid flash
initTheme()

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const currentOrganization = useAuthStore((state) => state.currentOrganization)
  const logout = useAuthStore((state) => state.logout)
  const setPermissions = useAuthStore((state) => state.setPermissions)
  const setPermissionLoaded = useAuthStore((state) => state.setPermissionLoaded)
  const setPermissionError = useAuthStore((state) => state.setPermissionError)
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

  // Fetch permissions once user + organization are available
  useEffect(() => {
    if (!user?.id || !currentOrganization?.id) return

    fetchRolePermissions(user.id, currentOrganization.id)
      .then((perms) => {
        setPermissions(perms)
        setPermissionLoaded(true)
        setPermissionError(false)
      })
      .catch((err) => {
        console.error('[App] Failed to load permissions:', err)
        setPermissionError(true)
      })
  }, [user?.id, currentOrganization?.id, setPermissions, setPermissionLoaded, setPermissionError])

  return (
    <ToastProvider>
      <Analytics />
      <Routes>
        <Route path="/auth/*" element={<AuthRouter />} />
        <Route path="/accept-invitation/:token" element={<AcceptInvitationPage />} />
        <Route
          path="/*"
          element={isAuthenticated ? <PermissionGuard><AppRouter /></PermissionGuard> : <Navigate to="/auth/login" replace />}
        />
      </Routes>
    </ToastProvider>
  )
}

export default App
