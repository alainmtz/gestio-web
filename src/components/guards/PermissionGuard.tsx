import type { ReactNode } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { PermissionErrorPage } from '@/pages/errors/PermissionErrorPage'

interface PermissionGuardProps {
  children: ReactNode
}

export function PermissionGuard({ children }: PermissionGuardProps) {
  const permissionLoaded = useAuthStore((s) => s.permissionLoaded)
  const permissionError = useAuthStore((s) => s.permissionError)

  if (permissionError) {
    return <PermissionErrorPage />
  }

  if (!permissionLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return <>{children}</>
}
