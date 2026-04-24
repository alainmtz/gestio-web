import { Link, useLocation, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'
import {
  User,
  Building2,
  Users,
  Shield,
  DollarSign,
  ChevronLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
  permission?: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Perfil', path: '/settings/profile', icon: <User className="h-4 w-4" /> },
  { label: 'Organización', path: '/settings/organization', icon: <Building2 className="h-4 w-4" />, permission: PERMISSIONS.SETTINGS_ORG },
  { label: 'Miembros', path: '/settings/members', icon: <Users className="h-4 w-4" />, permission: PERMISSIONS.MEMBER_INVITE },
  { label: 'Permisos', path: '/settings/permissions', icon: <Shield className="h-4 w-4" />, permission: PERMISSIONS.ROLE_MANAGE },
  { label: 'Tasas de Cambio', path: '/settings/exchange', icon: <DollarSign className="h-4 w-4" />, permission: PERMISSIONS.SETTINGS_EXCHANGE },
]

export function SettingsLayout() {
  const location = useLocation()
  const { hasPermission } = usePermissions()

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.permission || hasPermission(item.permission)
  )

  return (
    <div className="flex gap-6 min-h-full">
      {/* Settings side-nav */}
      <aside className="w-52 shrink-0">
        <div className="mb-4">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" />
            Volver
          </Link>
          <h2 className="mt-2 text-lg font-semibold">Configuración</h2>
        </div>
        <nav className="space-y-1">
          {visibleItems.map((item) => {
            const active = location.pathname === item.path
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={active ? 'secondary' : 'ghost'}
                  className={cn('w-full justify-start gap-2', active && 'font-medium')}
                >
                  {item.icon}
                  {item.label}
                </Button>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Page content */}
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
