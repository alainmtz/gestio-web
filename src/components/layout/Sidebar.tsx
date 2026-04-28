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
  UserCog,
  Shield,
  RefreshCw,
  ShoppingCart,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface SidebarProps {
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
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
]

export function Sidebar({ collapsed, onCollapsedChange }: SidebarProps) {
  const location = useLocation()
  const { permissions } = useAuthStore()
  const isAdmin = permissions.includes('SETTINGS_ORG')

  const isActive = (href: string, submenu?: { href: string }[]) => {
    if (href === '/dashboard') return location.pathname === '/dashboard'
    
    // Check if any submenu item matches current path
    if (submenu) {
      return submenu.some(sub => location.pathname.startsWith(sub.href))
    }
    
    return location.pathname.startsWith(href)
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-full flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-[70px]' : 'w-[260px]'
      )}
    >
      <div className="flex h-16 items-center border-b px-4">
        {!collapsed && (
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">Gestio</span>
          </Link>
        )}
        {collapsed && (
          <Link to="/dashboard" className="mx-auto">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
          </Link>
        )}
      </div>

      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-2">
          {mainNavItems.map((item) => (
            <div key={item.href}>
              <Link to={item.href}>
                <Button
                  variant={isActive(item.href, item.submenu) ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </Button>
              </Link>
              {!collapsed && item.submenu && isActive(item.href, item.submenu) && (
                <div className="ml-6 mt-1 space-y-1 border-l-2 border-muted pl-2">
                  {item.submenu.map((subItem) => (
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
          ))}
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
