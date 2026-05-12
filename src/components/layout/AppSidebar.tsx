import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
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
  Boxes,
  ArrowLeftRight,
  Tags,
  CreditCard,
  CalendarDays,
  Building2,
  Shield,
  ShoppingCart,
  AlertTriangle,
  ListTodo,
  Activity,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar'

interface NavItem {
  title: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  submenu?: NavItem[]
}

const mainNavItems: NavItem[] = [
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
      { title: 'Transferencias', icon: ArrowLeftRight, href: '/inventory/transfers' },
      { title: 'Alertas Stock', icon: AlertTriangle, href: '/inventory/low-stock' },
    ],
  },
  {
    title: 'Clientes',
    icon: Users,
    href: '/customers/list',
    submenu: [
      { title: 'Clientes', icon: Users, href: '/customers/list' },
      { title: 'Proveedores', icon: Building2, href: '/suppliers' },
    ],
  },
  {
    title: 'Facturación',
    icon: FileText,
    href: '/billing/offers',
    submenu: [
      { title: 'Ofertas', icon: FileText, href: '/billing/offers' },
      { title: 'Pre-facturas', icon: FileText, href: '/billing/preinvoices' },
      { title: 'Facturas', icon: CreditCard, href: '/billing/invoices' },
    ],
  },
  { title: 'Tiendas', icon: Store, href: '/stores' },
  {
    title: 'Consignaciones',
    icon: ClipboardList,
    href: '/consignments/list',
    submenu: [
      { title: 'Listado', icon: ClipboardList, href: '/consignments/list' },
      { title: 'Socios', icon: UsersRound, href: '/consignments/partners' },
    ],
  },
  { title: 'Caja', icon: Wallet, href: '/cash-register/sessions' },
  {
    title: 'Equipos',
    icon: UsersRound,
    href: '/teams',
    submenu: [
      { title: 'Equipos', icon: UsersRound, href: '/teams' },
      { title: 'Horarios', icon: CalendarDays, href: '/teams/schedules' },
      { title: 'Tareas', icon: ListTodo, href: '/teams/tasks' },
    ],
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
    ],
  },
]

/* ── Active check helpers ── */
function isActivePath(location: ReturnType<typeof useLocation>, href: string, submenu?: NavItem[]): boolean {
  if (href === '/dashboard') return location.pathname === '/dashboard'
  if (submenu) return submenu.some((sub) => location.pathname.startsWith(sub.href))
  return location.pathname.startsWith(href)
}

/* ── Nav menu with submenu toggling ── */
function NavMenu({ items }: { items: NavItem[] }) {
  const location = useLocation()

  return (
    <SidebarMenu>
      {items.map((item) => {
        const active = isActivePath(location, item.href, item.submenu)

        return (
          <SidebarMenuItem key={item.href}>
            {item.submenu ? (
              <div>
                <SidebarMenuButton asChild isActive={active} className="text-xs tracking-wide font-medium">
                  <Link to={item.href}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
                {/* ── Only expand submenu when this section is active ── */}
                {active && (
                  <SidebarMenuSub>
                    {item.submenu.map((subItem) => {
                      const subActive = location.pathname === subItem.href
                      return (
                        <SidebarMenuSubItem key={subItem.href}>
                          <SidebarMenuSubButton asChild isActive={subActive} className="text-[11px]">
                            <Link to={subItem.href}>
                              <subItem.icon className="h-3.5 w-3.5" />
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                )}
              </div>
            ) : (
              <SidebarMenuButton asChild isActive={active} className="text-xs tracking-wide font-medium">
                <Link to={item.href}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}

/* ── Terminal-style status indicator ── */
function TerminalStatus() {
  return (
    <div className="border-t border-sidebar-border px-3 py-2">
      <div className="flex items-center gap-2 text-[10px] text-sidebar-foreground/50 monospace">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_hsl(142_71%_45%/0.6)]" />
        <span>Sistema operativo</span>
        <span className="ml-auto">
          {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}

/* ── Exported sidebar ── */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { permissions } = useAuthStore()
  const isAdmin = permissions.includes('SETTINGS_ORG')

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard">
                <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm">
                  <Activity className="h-4 w-4" />
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_4px_hsl(142_71%_45%/0.6)]" />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-semibold">Gestio</span>
                  <span className="truncate text-[10px] text-sidebar-foreground/50 monospace">v2.0 · terminal</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <NavMenu items={mainNavItems} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {isAdmin && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="text-xs tracking-wide">
                <Link to="/settings/organization">
                  <Settings className="h-4 w-4" />
                  <span>Configuración</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
        <TerminalStatus />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
