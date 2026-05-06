import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { AuthCallbackPage } from '@/pages/auth/AuthCallbackPage'
import { useAuthStore } from '@/stores/authStore'

export function AuthRouter() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return (
    <Routes>
      <Route path="/callback" element={<AuthCallbackPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {isAuthenticated ? (
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      ) : (
        <>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </>
      )}
    </Routes>
  )
}
