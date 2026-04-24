import { useAuthStore } from '@/stores/authStore'
import { useOrganization } from '@/hooks/useOrganization'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, LogOut, Store, User, Building2, Settings, Users, Shield, Key, CreditCard } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel'

export function Header() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { 
    currentOrganization, 
    organizations,
    selectOrganization,
    currentStore,
    stores,
    selectStore,
  } = useOrganization()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    logout()
    navigate('/auth/login')
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="max-w-[200px] truncate">
                {currentOrganization?.name || 'Seleccionar organización'}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Organizaciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {organizations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => selectOrganization(org)}
                className={org.id === currentOrganization?.id ? 'bg-accent' : ''}
              >
                {org.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Store className="h-4 w-4" />
              <span className="max-w-[200px] truncate">
                {currentStore?.name || 'Todas las tiendas'}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Tiendas</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => selectStore(null)}>
              Todas las tiendas
            </DropdownMenuItem>
            {stores.map((store) => (
              <DropdownMenuItem
                key={store.id}
                onClick={() => selectStore(store)}
                className={store.id === currentStore?.id ? 'bg-accent' : ''}
              >
                {store.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2">
        <NotificationsPanel />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Configuración</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings/profile')}>
              <User className="mr-2 h-4 w-4" />
              Mi Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings/organization')}>
              <Building2 className="mr-2 h-4 w-4" />
              Organización
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings/members')}>
              <Users className="mr-2 h-4 w-4" />
              Miembros
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings/permissions')}>
              <Shield className="mr-2 h-4 w-4" />
              Permisos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings/exchange')}>
              <Key className="mr-2 h-4 w-4" />
              Tasas de Cambio
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">
                {user?.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="hidden md:inline">{user?.fullName || 'Usuario'}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user?.fullName}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {user?.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings/profile')}>
              <User className="mr-2 h-4 w-4" />
              Mi Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Building2 className="mr-2 h-4 w-4" />
              Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
