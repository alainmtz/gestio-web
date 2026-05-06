import { Link, useLocation, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions'
import {
  User,
  Building2,
  Users,
  Shield,
  DollarSign,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NavItem {
  label: string
  path: string
  icon: React.FC<{ className?: string }>
  permission?: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Perfil', path: '/settings/profile', icon: User },
  { label: 'Organización', path: '/settings/organization', icon: Building2, permission: PERMISSIONS.SETTINGS_ORG },
  { label: 'Miembros', path: '/settings/members', icon: Users, permission: PERMISSIONS.MEMBER_INVITE },
  { label: 'Permisos', path: '/settings/permissions', icon: Shield, permission: PERMISSIONS.ROLE_MANAGE },
  { label: 'Tasas de Cambio', path: '/settings/exchange', icon: DollarSign, permission: PERMISSIONS.SETTINGS_EXCHANGE },
]

export function SettingsLayout() {
  const location = useLocation()
  const { hasPermission } = usePermissions()

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.permission || hasPermission(item.permission)
  )

  return (
    <div className="flex flex-col min-h-full pb-16">
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-1 border-t bg-background px-2 h-16 md:left-64">
        {visibleItems.map((item) => {
          const active = location.pathname === item.path
          const Icon = item.icon
          return (
            <Link key={item.path} to={item.path} className="flex-1 max-w-[72px]">
              <Button
                variant="ghost"
                className={cn(
                  'flex flex-col items-center gap-0.5 h-auto w-full py-1.5 px-1 rounded-none hover:bg-accent/50',
                  active && 'text-primary'
                )}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] leading-tight truncate">{item.label}</span>
              </Button>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
