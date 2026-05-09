import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { PermissionRoute } from '@/router/PermissionRoute'
import { PERMISSIONS } from '@/hooks/usePermissions'
import { LoadingFallback } from '@/components/shared/LoadingFallback'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { SettingsLayout } from '@/components/layout/SettingsLayout'

const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const ProductsPage = lazy(() => import('@/pages/inventory/ProductsPage').then(m => ({ default: m.ProductsPage })))
const ProductDetailPage = lazy(() => import('@/pages/inventory/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })))
const CategoriesPage = lazy(() => import('@/pages/inventory/CategoriesPage').then(m => ({ default: m.CategoriesPage })))
const MovementsPage = lazy(() => import('@/pages/inventory/MovementsPage').then(m => ({ default: m.MovementsPage })))
const TransfersPage = lazy(() => import('@/pages/inventory/TransfersPage').then(m => ({ default: m.TransfersPage })))
const LowStockPage = lazy(() => import('@/pages/inventory/LowStockPage').then(m => ({ default: m.LowStockPage })))
const CustomersPage = lazy(() => import('@/pages/customers/CustomersPage').then(m => ({ default: m.CustomersPage })))
const CustomerDetailPage = lazy(() => import('@/pages/customers/CustomerDetailPage').then(m => ({ default: m.CustomerDetailPage })))
const SuppliersPage = lazy(() => import('@/pages/suppliers/SuppliersPage').then(m => ({ default: m.SuppliersPage })))
const SupplierDetailPage = lazy(() => import('@/pages/suppliers/SupplierDetailPage').then(m => ({ default: m.SupplierDetailPage })))
const OffersPage = lazy(() => import('@/pages/billing/OffersPage').then(m => ({ default: m.OffersPage })))
const OfferDetailPage = lazy(() => import('@/pages/billing/OfferDetailPage').then(m => ({ default: m.OfferDetailPage })))
const PreInvoicesPage = lazy(() => import('@/pages/billing/PreInvoicesPage').then(m => ({ default: m.PreInvoicesPage })))
const PreInvoiceDetailPage = lazy(() => import('@/pages/billing/PreInvoiceDetailPage').then(m => ({ default: m.PreInvoiceDetailPage })))
const InvoicesPage = lazy(() => import('@/pages/billing/InvoicesPage').then(m => ({ default: m.InvoicesPage })))
const InvoiceDetailPage = lazy(() => import('@/pages/billing/InvoiceDetailPage').then(m => ({ default: m.InvoiceDetailPage })))
const StoresPage = lazy(() => import('@/pages/stores/StoresPage').then(m => ({ default: m.StoresPage })))
const StoreDetailPage = lazy(() => import('@/pages/stores/StoreDetailPage').then(m => ({ default: m.StoreDetailPage })))
const ConsignmentsPage = lazy(() => import('@/pages/consignments/ConsignmentsPage').then(m => ({ default: m.ConsignmentsPage })))
const ConsignmentDetailPage = lazy(() => import('@/pages/consignments/ConsignmentDetailPage').then(m => ({ default: m.ConsignmentDetailPage })))
const ConsignmentPartnersPage = lazy(() => import('@/pages/consignments/ConsignmentPartnersPage').then(m => ({ default: m.ConsignmentPartnersPage })))
const SessionsPage = lazy(() => import('@/pages/cash-register/SessionsPage').then(m => ({ default: m.SessionsPage })))
const SessionDetailPage = lazy(() => import('@/pages/cash-register/SessionDetailPage').then(m => ({ default: m.SessionDetailPage })))
const TeamsPage = lazy(() => import('@/pages/teams/TeamsPage').then(m => ({ default: m.TeamsPage })))
const TeamDetailPage = lazy(() => import('@/pages/teams/TeamDetailPage').then(m => ({ default: m.TeamDetailPage })))
const SchedulesPage = lazy(() => import('@/pages/teams/SchedulesPage').then(m => ({ default: m.SchedulesPage })))
const TeamsTasksPage = lazy(() => import('@/pages/teams/TeamsTasksPage').then(m => ({ default: m.TeamsTasksPage })))
const NotificationsPage = lazy(() => import('@/pages/notifications').then(m => ({ default: m.NotificationsPage })))
const ReportsDashboardPage = lazy(() => import('@/pages/reports/ReportsDashboardPage').then(m => ({ default: m.ReportsDashboardPage })))
const SalesReportPage = lazy(() => import('@/pages/reports/SalesReportPage').then(m => ({ default: m.SalesReportPage })))
const InventoryReportPage = lazy(() => import('@/pages/reports/InventoryReportPage').then(m => ({ default: m.InventoryReportPage })))
const FinancialReportPage = lazy(() => import('@/pages/reports/FinancialReportPage').then(m => ({ default: m.FinancialReportPage })))
const AuditLogPage = lazy(() => import('@/pages/reports/AuditLogPage').then(m => ({ default: m.AuditLogPage })))
const POSPage = lazy(() => import('@/pages/pos/POSPage').then(m => ({ default: m.POSPage })))
const ProfilePage = lazy(() => import('@/pages/settings/ProfilePage').then(m => ({ default: m.ProfilePage })))
const OrganizationPage = lazy(() => import('@/pages/settings/OrganizationPage').then(m => ({ default: m.OrganizationPage })))
const MembersPage = lazy(() => import('@/pages/settings/MembersPage').then(m => ({ default: m.MembersPage })))
const PermissionsPage = lazy(() => import('@/pages/settings/PermissionsPage').then(m => ({ default: m.PermissionsPage })))
const ExchangeRatesPage = lazy(() => import('@/pages/settings/ExchangeRatesPage').then(m => ({ default: m.ExchangeRatesPage })))
const UnauthorizedPage = lazy(() => import('@/pages/auth/UnauthorizedPage').then(m => ({ default: m.UnauthorizedPage })))

function AppLayout() {
  return <DashboardLayout />
}

const SuspensePage = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
)

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<SuspensePage><DashboardPage /></SuspensePage>} />

        <Route path="/inventory" element={<PermissionRoute permission={PERMISSIONS.PRODUCT_VIEW}><Outlet /></PermissionRoute>}>
          <Route index element={<Navigate to="/inventory/products" replace />} />
          <Route path="products" element={<SuspensePage><ProductsPage /></SuspensePage>} />
          <Route path="products/new" element={<SuspensePage><ProductDetailPage /></SuspensePage>} />
          <Route path="products/:id" element={<SuspensePage><ProductDetailPage /></SuspensePage>} />
          <Route path="categories" element={<SuspensePage><CategoriesPage /></SuspensePage>} />
          <Route path="movements" element={<SuspensePage><MovementsPage /></SuspensePage>} />
          <Route path="transfers" element={<SuspensePage><TransfersPage /></SuspensePage>} />
          <Route path="low-stock" element={<SuspensePage><LowStockPage /></SuspensePage>} />
        </Route>

        <Route path="/customers" element={<PermissionRoute permission={PERMISSIONS.CUSTOMER_VIEW}><Outlet /></PermissionRoute>}>
          <Route index element={<Navigate to="/customers/list" replace />} />
          <Route path="list" element={<SuspensePage><CustomersPage /></SuspensePage>} />
          <Route path=":id" element={<SuspensePage><CustomerDetailPage /></SuspensePage>} />
        </Route>

        <Route path="/suppliers" element={<PermissionRoute permission={PERMISSIONS.SUPPLIER_VIEW}><Outlet /></PermissionRoute>}>
          <Route index element={<SuspensePage><SuppliersPage /></SuspensePage>} />
          <Route path="new" element={<SuspensePage><SupplierDetailPage /></SuspensePage>} />
          <Route path=":id" element={<SuspensePage><SupplierDetailPage /></SuspensePage>} />
        </Route>

        <Route path="/billing" element={<PermissionRoute permissions={[PERMISSIONS.OFFER_VIEW, PERMISSIONS.PREINVOICE_VIEW, PERMISSIONS.INVOICE_VIEW]}><Outlet /></PermissionRoute>}>
          <Route index element={<Navigate to="/billing/offers" replace />} />
          <Route path="offers" element={<SuspensePage><OffersPage /></SuspensePage>} />
          <Route path="offers/new" element={<SuspensePage><OfferDetailPage /></SuspensePage>} />
          <Route path="offers/:id" element={<SuspensePage><OfferDetailPage /></SuspensePage>} />
          <Route path="preinvoices" element={<SuspensePage><PreInvoicesPage /></SuspensePage>} />
          <Route path="preinvoices/new" element={<SuspensePage><PreInvoiceDetailPage /></SuspensePage>} />
          <Route path="preinvoices/:id" element={<SuspensePage><PreInvoiceDetailPage /></SuspensePage>} />
          <Route path="invoices" element={<SuspensePage><InvoicesPage /></SuspensePage>} />
          <Route path="invoices/new" element={<SuspensePage><InvoiceDetailPage /></SuspensePage>} />
          <Route path="invoices/:id" element={<SuspensePage><InvoiceDetailPage /></SuspensePage>} />
        </Route>

        <Route path="/stores" element={<PermissionRoute permission={PERMISSIONS.STORE_VIEW}><Outlet /></PermissionRoute>}>
          <Route index element={<SuspensePage><StoresPage /></SuspensePage>} />
          <Route path="new" element={<SuspensePage><StoreDetailPage /></SuspensePage>} />
          <Route path=":id" element={<SuspensePage><StoreDetailPage /></SuspensePage>} />
        </Route>

        <Route path="/consignments" element={<PermissionRoute permission={PERMISSIONS.CONSIGNMENT_VIEW}><Outlet /></PermissionRoute>}>
          <Route index element={<Navigate to="/consignments/list" replace />} />
          <Route path="list" element={<SuspensePage><ConsignmentsPage /></SuspensePage>} />
          <Route path="partners" element={<SuspensePage><ConsignmentPartnersPage /></SuspensePage>} />
          <Route path=":id" element={<SuspensePage><ConsignmentDetailPage /></SuspensePage>} />
        </Route>

        <Route path="/cash-register" element={<PermissionRoute permission={PERMISSIONS.REGISTER_VIEW}><Outlet /></PermissionRoute>}>
          <Route index element={<Navigate to="/cash-register/sessions" replace />} />
          <Route path="sessions" element={<SuspensePage><SessionsPage /></SuspensePage>} />
          <Route path="sessions/:id" element={<SuspensePage><SessionDetailPage /></SuspensePage>} />
          <Route path="movements" element={<Navigate to="/cash-register/sessions" replace />} />
        </Route>

        <Route path="/teams" element={<PermissionRoute permission={PERMISSIONS.TEAM_VIEW}><Outlet /></PermissionRoute>}>
          <Route index element={<SuspensePage><TeamsPage /></SuspensePage>} />
          <Route path="new" element={<SuspensePage><TeamDetailPage /></SuspensePage>} />
          <Route path=":id" element={<SuspensePage><TeamDetailPage /></SuspensePage>} />
          <Route path="schedules" element={<SuspensePage><SchedulesPage /></SuspensePage>} />
          <Route path="tasks" element={<SuspensePage><TeamsTasksPage /></SuspensePage>} />
        </Route>

        <Route path="/notifications" element={<SuspensePage><NotificationsPage /></SuspensePage>} />

        <Route path="/reports" element={<PermissionRoute permission={PERMISSIONS.REPORT_VIEW}><Outlet /></PermissionRoute>}>
          <Route index element={<SuspensePage><ReportsDashboardPage /></SuspensePage>} />
          <Route path="sales" element={<SuspensePage><SalesReportPage /></SuspensePage>} />
          <Route path="inventory" element={<SuspensePage><InventoryReportPage /></SuspensePage>} />
          <Route path="financial" element={<SuspensePage><FinancialReportPage /></SuspensePage>} />
          <Route path="audit" element={<SuspensePage><AuditLogPage /></SuspensePage>} />
        </Route>

        <Route path="/pos" element={<PermissionRoute permission={PERMISSIONS.POS_ACCESS}><SuspensePage><POSPage /></SuspensePage></PermissionRoute>} />

        <Route path="/unauthorized" element={<SuspensePage><UnauthorizedPage /></SuspensePage>} />

        <Route path="/settings" element={<PermissionRoute permission={PERMISSIONS.SETTINGS_VIEW}><SettingsLayout /></PermissionRoute>}>
          <Route index element={<Navigate to="/settings/profile" replace />} />
          <Route path="profile" element={<SuspensePage><ProfilePage /></SuspensePage>} />
          <Route path="organization" element={<PermissionRoute permission={PERMISSIONS.ORG_VIEW}><SuspensePage><OrganizationPage /></SuspensePage></PermissionRoute>} />
          <Route path="members" element={<PermissionRoute permission={PERMISSIONS.ORG_VIEW}><SuspensePage><MembersPage /></SuspensePage></PermissionRoute>} />
          <Route path="permissions" element={<PermissionRoute permission={PERMISSIONS.ROLE_MANAGE}><SuspensePage><PermissionsPage /></SuspensePage></PermissionRoute>} />
          <Route path="exchange" element={<PermissionRoute permission={PERMISSIONS.SETTINGS_EXCHANGE}><SuspensePage><ExchangeRatesPage /></SuspensePage></PermissionRoute>} />
        </Route>
      </Route>
    </Routes>
  )
}
