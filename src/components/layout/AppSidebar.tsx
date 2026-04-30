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
  { 
    title: 'Consignaciones', 
    icon: ClipboardList, 
    href: '/consignments/list',
    submenu: [
      { title: 'Listado', icon: ClipboardList, href: '/consignments/list' },
      { title: 'Socios', icon: UsersRound, href: '/consignments/partners' },
    ]
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

function NavMenu({ items }: { items: NavItem[] }) {
  const location = useLocation()

  return (
    <SidebarMenu>
      {items.map((item) => {
        const isActive = item.submenu
          ? item.submenu.some(sub => location.pathname.startsWith(sub.href))
          : location.pathname.startsWith(item.href)

        return (
          <SidebarMenuItem key={item.href}>
            {item.submenu ? (
              <>
                <SidebarMenuButton asChild isActive={isActive}>
                  <a href={item.href}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
                <SidebarMenuSub>
                  {item.submenu.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.href}>
                      <SidebarMenuSubButton asChild isActive={location.pathname === subItem.href}>
                        <Link to={subItem.href}>
                          <item.icon className="h-3.5 w-3.5" />
                          <span>{subItem.title}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </>
            ) : (
              <SidebarMenuButton asChild isActive={isActive}>
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
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Package className="h-5 w-5" />
                </div>
                <span className="text-lg font-bold">Gestio</span>
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
              <SidebarMenuButton asChild>
                <Link to="/settings/organization">
                  <Settings className="h-4 w-4" />
                  <span>Configuración</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
