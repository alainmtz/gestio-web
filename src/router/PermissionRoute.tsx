import { Navigate, useLocation } from 'react-router-dom'
import { usePermissions } from '@/hooks/usePermissions'

interface PermissionRouteProps {
  children: React.ReactNode
  permission?: string
  permissions?: string[]
  requireAll?: boolean
}

export function PermissionRoute({ 
  children, 
  permission, 
  permissions = [],
  requireAll = false 
}: PermissionRouteProps) {
  const location = useLocation()
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading, permissions: userPermissions } = usePermissions()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (userPermissions.length === 0) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />
  }

  if (permission) {
    if (!hasPermission(permission)) {
      return <Navigate to="/unauthorized" state={{ from: location }} replace />
    }
  }

  if (permissions.length > 0) {
    if (requireAll) {
      if (!hasAllPermissions(permissions)) {
        return <Navigate to="/unauthorized" state={{ from: location }} replace />
      }
    } else {
      if (!hasAnyPermission(permissions)) {
        return <Navigate to="/unauthorized" state={{ from: location }} replace />
      }
    }
  }

  return <>{children}</>
}