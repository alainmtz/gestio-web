import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  Store,
  ClipboardList,
  Wallet,
  UsersRound,
  BarChart3,
  Monitor,
  Settings,
  ChevronLeft,
  ChevronRight,
  Boxes,
  ArrowLeftRight,
  Tags,
  CreditCard,
  CalendarDays,
  Building2,
  Shield,
  ShoppingCart,
  X,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useRef, useCallback, useEffect, useState } from 'react'

interface SidebarProps {
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}

interface NavSubmenu {
  title: string
  icon: React.ComponentType<{ className?: string }>
  href: string
}

export interface FlyoutMenu {
  item: NavItem
  subItems: NavSubmenu[]
  rect: DOMRect
}

const mainNavItems = [
  { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { title: 'POS', icon: ShoppingCart, href: '/pos' },
  { 
    title: 'Inventario', 
    icon: Package, 
    href: '/inventory/products',
    submenu: [
      { title: 'Productos', icon: Package, href: '/inventory/products' },
      { title: 'Categorías', icon: Tags, href: '/inventory/categories' },
      { title: 'Movimientos', icon: ArrowLeftRight, href: '/inventory/movements' },
    ]
  },
  { 
    title: 'Clientes', 
    icon: Users, 
    href: '/customers/list',
    submenu: [
      { title: 'Clientes', icon: Users, href: '/customers/list' },
      { title: 'Proveedores', icon: Building2, href: '/suppliers' },
    ]
  },
  { 
    title: 'Facturación', 
    icon: FileText, 
    href: '/billing/offers',
    submenu: [
      { title: 'Ofertas', icon: FileText, href: '/billing/offers' },
      { title: 'Pre-facturas', icon: FileText, href: '/billing/preinvoices' },
      { title: 'Facturas', icon: CreditCard, href: '/billing/invoices' },
    ]
  },
  { title: 'Tiendas', icon: Store, href: '/stores' },
  { title: 'Consignaciones', icon: ClipboardList, href: '/consignments/list' },
  { title: 'Caja', icon: Wallet, href: '/cash-register/sessions' },
  { 
    title: 'Equipos', 
    icon: UsersRound, 
    href: '/teams',
    submenu: [
      { title: 'Equipos', icon: UsersRound, href: '/teams' },
      { title: 'Horarios', icon: CalendarDays, href: '/teams/schedules' },
    ]
  },
  { 
    title: 'Reportes', 
    icon: BarChart3, 
    href: '/reports',
    submenu: [
      { title: 'Ventas', icon: BarChart3, href: '/reports/sales' },
      { title: 'Inventario', icon: Boxes, href: '/reports/inventory' },
      { title: 'Financiero', icon: Monitor, href: '/reports/financial' },
      { title: 'Auditoría', icon: Shield, href: '/reports/audit' },
    ]
  },
] as NavItem[]

interface NavItem {
  title: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  submenu?: NavSubmenu[]
}

let flyoutListeners: ((menu: FlyoutMenu | null) => void)[] = []
let closeTimeout: ReturnType<typeof setTimeout> | null = null

export function setFlyoutMenu(menu: FlyoutMenu | null) {
  if (closeTimeout) {
    clearTimeout(closeTimeout)
    closeTimeout = null
  }
  for (const listener of flyoutListeners) {
    listener(menu)
  }
}

export function scheduleFlyoutClose() {
  closeTimeout = setTimeout(() => {
    for (const listener of flyoutListeners) {
      listener(null)
    }
  }, 100)
}

export function cancelFlyoutClose() {
  if (closeTimeout) {
    clearTimeout(closeTimeout)
    closeTimeout = null
  }
}

export function useFlyoutMenu() {
  const [menu, setMenu] = useState<FlyoutMenu | null>(null)
  useEffect(() => {
    flyoutListeners.push(setMenu)
    return () => {
      flyoutListeners = flyoutListeners.filter(l => l !== setMenu)
    }
  }, [])
  return menu
}

export function SidebarFlyout({ location }: { location: ReturnType<typeof useLocation> }) {
  const menu = useFlyoutMenu()

  if (!menu) return null

  return (
    <div
      className="fixed z-[60] w-52 rounded-xl border bg-card p-2 shadow-lg"
      style={{ left: menu.rect.right + 8, top: menu.rect.top }}
      onMouseEnter={cancelFlyoutClose}
      onMouseLeave={() => setFlyoutMenu(null)}
    >
      <p className="px-2 py-1.5 text-sm font-semibold">{menu.item.title}</p>
      <div className="space-y-0.5">
        {menu.subItems.map((subItem) => (
          <Link key={subItem.href} to={subItem.href}>
            <Button
              variant={location.pathname === subItem.href ? 'secondary' : 'ghost'}
              size="sm"
              className="w-full justify-start gap-2 text-sm"
            >
              <subItem.icon className="h-4 w-4" />
              {subItem.title}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function Sidebar({ collapsed, onCollapsedChange, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation()
  const { permissions } = useAuthStore()
  const isAdmin = permissions.includes('SETTINGS_ORG')
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  const isActive = (href: string, submenu?: { href: string }[]) => {
    if (href === '/dashboard') return location.pathname === '/dashboard'
    
    if (submenu) {
      return submenu.some(sub => location.pathname.startsWith(sub.href))
    }
    
    return location.pathname.startsWith(href)
  }

  const handleItemEnter = useCallback((item: NavItem) => {
    if (!collapsed) return
    const btn = buttonRefs.current.get(item.href)
    if (btn) {
      setFlyoutMenu({
        item,
        subItems: item.submenu!,
        rect: btn.getBoundingClientRect(),
      })
    }
  }, [collapsed])

  const handleItemLeave = useCallback(() => {
    scheduleFlyoutClose()
  }, [])

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-full flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-[70px]' : 'w-[260px]',
        'hidden lg:flex',
        mobileOpen && 'flex z-50 w-[260px]'
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        {collapsed ? (
          <Link to="/dashboard" className="mx-auto">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
          </Link>
        ) : (
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">Gestio</span>
          </Link>
        )}
        {mobileOpen && (
          <Button variant="ghost" size="icon" onClick={onMobileClose}>
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1">
          {mainNavItems.map((item) => {
            const active = isActive(item.href, item.submenu)
            const hasSubmenu = item.submenu && item.submenu.length > 0

            return (
              <div key={item.href}>
                <div
                  className="relative"
                  onMouseEnter={() => collapsed && hasSubmenu && handleItemEnter(item)}
                  onMouseLeave={() => collapsed && hasSubmenu && handleItemLeave()}
                >
                  <Link to={item.href}>
                    <Button
                      ref={(el) => {
                        if (el) buttonRefs.current.set(item.href, el)
                        else buttonRefs.current.delete(item.href)
                      }}
                      variant={active ? 'secondary' : 'ghost'}
                      className={cn(
                        'w-full justify-start gap-3',
                        collapsed && 'justify-center px-0 w-[70px]'
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </Button>
                  </Link>
                </div>

                {!collapsed && hasSubmenu && active && (
                  <div className="ml-6 mt-1 space-y-1 border-l-2 border-muted pl-2">
                    {item.submenu!.map((subItem) => (
                      <Link key={subItem.href} to={subItem.href}>
                        <Button
                          variant={location.pathname === subItem.href ? 'secondary' : 'ghost'}
                          size="sm"
                          className="w-full justify-start gap-2 text-sm"
                        >
                          <subItem.icon className="h-4 w-4" />
                          {subItem.title}
                        </Button>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </ScrollArea>

      <div className="border-t p-2">
        {isAdmin && (
          <Link to="/settings/organization">
            <Button
              variant={isActive('/settings') ? 'secondary' : 'ghost'}
              className={cn('w-full justify-start gap-3', collapsed && 'justify-center px-2')}
            >
              <Settings className="h-5 w-5" />
              {!collapsed && <span>Configuración</span>}
            </Button>
          </Link>
        )}
      </div>

      <div className="border-t p-2">
        <Button
          variant="ghost"
          onClick={() => onCollapsedChange(!collapsed)}
          className={cn('w-full justify-center', !collapsed && 'justify-start')}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5" />
              <span className="ml-2">Colapsar</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}
