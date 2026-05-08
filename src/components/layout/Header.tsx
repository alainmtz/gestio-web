import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import type { Store as AuthStore } from '@/stores/authStore'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ChevronDown, LogOut, Store, User, Building2, Settings, Users, Key, CreditCard, PanelLeft, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/lib/utils'

function MobileOrgPopover() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const { pendingOrganizations } = useAuthStore()
  const { currentOrganization, organizations, selectOrganization, currentStore, stores, selectStore } = useOrganization()

  const handleSelectStore = (store: AuthStore | null) => {
    selectStore(store)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Building2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className="w-72 p-0 bg-card border shadow-lg">
        <div className="p-3 border-b">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Organización</p>
          <div className="mt-2 space-y-0.5">
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => selectOrganization(org)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors truncate',
                  org.id === currentOrganization?.id && 'bg-accent font-medium'
                )}
              >
                {org.name}
              </button>
            ))}
            {pendingOrganizations.length > 0 && (
              <>
                <div className="border-t my-1" />
                {pendingOrganizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => { setOpen(false); navigate('/settings/members') }}
                    className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent transition-colors truncate"
                  >
                    <Clock className="h-3 w-3 text-amber-500 flex-shrink-0" />
                    <span className="truncate">{org.name}</span>
                    <span className="ml-auto text-xs text-amber-600 flex-shrink-0">Pendiente</span>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
        <div className="p-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tienda</p>
          <div className="mt-2 space-y-0.5">
            <button
              onClick={() => handleSelectStore(null)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors',
                !currentStore && 'bg-accent font-medium'
              )}
            >
              Todas las tiendas
            </button>
            {stores.map((store) => (
              <button
                key={store.id}
                onClick={() => handleSelectStore(store)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors truncate',
                  store.id === currentStore?.id && 'bg-accent font-medium'
                )}
              >
                {store.name}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function MobileUserPopover() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    logout()
    navigate('/auth/login')
  }

  const initials = user?.fullName?.charAt(0).toUpperCase() || 'U'

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-medium">
            {initials}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="w-64 p-0 bg-card border shadow-lg">
        <div className="p-3 border-b">
          <p className="text-sm font-semibold truncate">{user?.fullName || 'Usuario'}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>
        <div className="p-2 space-y-0.5">
          <button
            onClick={() => { navigate('/settings/profile') }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors"
          >
            <User className="h-4 w-4" />
            Mi Perfil
          </button>
          <button
            onClick={() => { navigate('/settings') }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors"
          >
            <Settings className="h-4 w-4" />
            Configuración
          </button>
        </div>
        <div className="p-2 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function MobileHeaderBar() {
  return (
    <div className="flex h-14 items-center gap-1 px-3 md:hidden">
      <SidebarTrigger />
      <MobileOrgPopover />
      <div className="flex-1" />
      <ThemeToggle />
      <NotificationsPanel />
      <MobileUserPopover />
    </div>
  )
}

function DesktopHeaderBar() {
  const navigate = useNavigate()
  const { user, logout, pendingOrganizations } = useAuthStore()
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
    <div className="hidden h-16 items-center justify-between border-b bg-card px-6 md:flex">
      <div className="flex items-center gap-3">
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
            {pendingOrganizations.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-muted-foreground">Pendientes</DropdownMenuLabel>
                {pendingOrganizations.map((org) => (
                  <DropdownMenuItem
                    key={org.id}
                    onClick={() => navigate('/settings/members')}
                    className="opacity-70"
                  >
                    <Clock className="mr-2 h-3 w-3 text-amber-500" />
                    <span>{org.name}</span>
                    <span className="ml-auto text-xs text-amber-600">Pendiente</span>
                  </DropdownMenuItem>
                ))}
              </>
            )}
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
        <ThemeToggle />
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
              <Key className="mr-2 h-4 w-4" />
              Permisos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings/exchange')}>
              <CreditCard className="mr-2 h-4 w-4" />
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
              <span>{user?.fullName || 'Usuario'}</span>
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
    </div>
  )
}

export function Header() {
  return (
    <>
      <MobileHeaderBar />
      <DesktopHeaderBar />
    </>
  )
}
