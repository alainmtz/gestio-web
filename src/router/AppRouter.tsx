import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { PermissionRoute } from '@/router/PermissionRoute'
import { PERMISSIONS } from '@/hooks/usePermissions'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { ProductsPage } from '@/pages/inventory/ProductsPage'
import { ProductDetailPage } from '@/pages/inventory/ProductDetailPage'
import { CategoriesPage } from '@/pages/inventory/CategoriesPage'
import { MovementsPage } from '@/pages/inventory/MovementsPage'
import { TransfersPage } from '@/pages/inventory/TransfersPage'
import { LowStockPage } from '@/pages/inventory/LowStockPage'
import { CustomersPage } from '@/pages/customers/CustomersPage'
import { CustomerDetailPage } from '@/pages/customers/CustomerDetailPage'
import { SuppliersPage } from '@/pages/suppliers/SuppliersPage'
import { SupplierDetailPage } from '@/pages/suppliers/SupplierDetailPage'
import { OffersPage } from '@/pages/billing/OffersPage'
import { OfferDetailPage } from '@/pages/billing/OfferDetailPage'
import { PreInvoicesPage } from '@/pages/billing/PreInvoicesPage'
import { PreInvoiceDetailPage } from '@/pages/billing/PreInvoiceDetailPage'
import { InvoicesPage } from '@/pages/billing/InvoicesPage'
import { InvoiceDetailPage } from '@/pages/billing/InvoiceDetailPage'
import { StoresPage } from '@/pages/stores/StoresPage'
import { StoreDetailPage } from '@/pages/stores/StoreDetailPage'
import { ConsignmentsPage } from '@/pages/consignments/ConsignmentsPage'
import { ConsignmentDetailPage } from '@/pages/consignments/ConsignmentDetailPage'
import { ConsignmentPartnersPage } from '@/pages/consignments/ConsignmentPartnersPage'
import { SessionsPage } from '@/pages/cash-register/SessionsPage'
import { SessionDetailPage } from '@/pages/cash-register/SessionDetailPage'
import { TeamsPage } from '@/pages/teams/TeamsPage'
import { TeamDetailPage } from '@/pages/teams/TeamDetailPage'
import { SchedulesPage } from '@/pages/teams/SchedulesPage'
import { TeamsTasksPage } from '@/pages/teams/TeamsTasksPage'
import { ReportsDashboardPage } from '@/pages/reports/ReportsDashboardPage'
import { SalesReportPage } from '@/pages/reports/SalesReportPage'
import { InventoryReportPage } from '@/pages/reports/InventoryReportPage'
import { FinancialReportPage } from '@/pages/reports/FinancialReportPage'
import { AuditLogPage } from '@/pages/reports/AuditLogPage'
import { POSPage } from '@/pages/pos/POSPage'
import { ProfilePage } from '@/pages/settings/ProfilePage'
import { OrganizationPage } from '@/pages/settings/OrganizationPage'
import { MembersPage } from '@/pages/settings/MembersPage'
import { PermissionsPage } from '@/pages/settings/PermissionsPage'
import { ExchangeRatesPage } from '@/pages/settings/ExchangeRatesPage'
import { UnauthorizedPage } from '@/pages/auth/UnauthorizedPage'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { SettingsLayout } from '@/components/layout/SettingsLayout'

function AppLayout() {
  return <DashboardLayout />
}

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        <Route path="/inventory" element={<PermissionRoute permission={PERMISSIONS.PRODUCT_VIEW}><Outlet /></PermissionRoute>}>
          <Route index element={<Navigate to="/inventory/products" replace />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/new" element={<ProductDetailPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="movements" element={<MovementsPage />} />
          <Route path="transfers" element={<TransfersPage />} />
          <Route path="low-stock" element={<LowStockPage />} />
        </Route>

        <Route path="/customers" element={<PermissionRoute permission={PERMISSIONS.CUSTOMER_VIEW}><Outlet /></PermissionRoute>}>
          <Route index element={<Navigate to="/customers/list" replace />} />
          <Route path="list" element={<CustomersPage />} />
          <Route path=":id" element={<CustomerDetailPage />} />
        </Route>

        <Route path="/suppliers" element={<PermissionRoute permission={PERMISSIONS.SUPPLIER_VIEW}><Outlet /></PermissionRoute>}>
          <Route index element={<SuppliersPage />} />
          <Route path="new" element={<SupplierDetailPage />} />
          <Route path=":id" element={<SupplierDetailPage />} />
        </Route>

        <Route path="/billing" element={<PermissionRoute permissions={[PERMISSIONS.OFFER_VIEW, PERMISSIONS.PREINVOICE_VIEW, PERMISSIONS.INVOICE_VIEW]}><Outlet /></PermissionRoute>}>
          <Route index element={<Navigate to="/billing/offers" replace />} />
          <Route path="offers" element={<OffersPage />} />
          <Route path="offers/new" element={<OfferDetailPage />} />
          <Route path="offers/:id" element={<OfferDetailPage />} />
          <Route path="preinvoices" element={<PreInvoicesPage />} />
          <Route path="preinvoices/new" element={<PreInvoiceDetailPage />} />
          <Route path="preinvoices/:id" element={<PreInvoiceDetailPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="invoices/new" element={<InvoiceDetailPage />} />
          <Route path="invoices/:id" element={<InvoiceDetailPage />} />
        </Route>

        <Route path="/stores" element={<PermissionRoute permission={PERMISSIONS.STORE_VIEW}><Outlet /></PermissionRoute>}>
          <Route index element={<StoresPage />} />
          <Route path="new" element={<StoreDetailPage />} />
          <Route path=":id" element={<StoreDetailPage />} />
        </Route>

        <Route path="/consignments" element={<PermissionRoute permission={PERMISSIONS.CONSIGNMENT_VIEW}><Outlet /></PermissionRoute>}>
          <Route index element={<Navigate to="/consignments/list" replace />} />
          <Route path="list" element={<ConsignmentsPage />} />
          <Route path="partners" element={<ConsignmentPartnersPage />} />
          <Route path=":id" element={<ConsignmentDetailPage />} />
        </Route>

        <Route path="/cash-register" element={<PermissionRoute permission={PERMISSIONS.REGISTER_VIEW}><Outlet /></PermissionRoute>}>
          <Route index element={<Navigate to="/cash-register/sessions" replace />} />
          <Route path="sessions" element={<SessionsPage />} />
          <Route path="sessions/:id" element={<SessionDetailPage />} />
          <Route path="movements" element={<Navigate to="/cash-register/sessions" replace />} />
        </Route>

        <Route path="/teams" element={<PermissionRoute permission={PERMISSIONS.TEAM_VIEW}><Outlet /></PermissionRoute>}>
          <Route index element={<TeamsPage />} />
          <Route path="new" element={<TeamDetailPage />} />
          <Route path=":id" element={<TeamDetailPage />} />
          <Route path="schedules" element={<SchedulesPage />} />
          <Route path="tasks" element={<TeamsTasksPage />} />
        </Route>

        <Route path="/reports" element={<PermissionRoute permission={PERMISSIONS.REPORT_VIEW}><Outlet /></PermissionRoute>}>
          <Route index element={<ReportsDashboardPage />} />
          <Route path="sales" element={<SalesReportPage />} />
          <Route path="inventory" element={<InventoryReportPage />} />
          <Route path="financial" element={<FinancialReportPage />} />
          <Route path="audit" element={<AuditLogPage />} />
        </Route>

        <Route path="/pos" element={<PermissionRoute permission={PERMISSIONS.POS_ACCESS}><POSPage /></PermissionRoute>} />

        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route path="/settings" element={<PermissionRoute permission={PERMISSIONS.SETTINGS_VIEW}><SettingsLayout /></PermissionRoute>}>
          <Route index element={<Navigate to="/settings/profile" replace />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="organization" element={<PermissionRoute permission={PERMISSIONS.ORG_VIEW}><OrganizationPage /></PermissionRoute>} />
          <Route path="members" element={<PermissionRoute permission={PERMISSIONS.ORG_VIEW}><MembersPage /></PermissionRoute>} />
          <Route path="permissions" element={<PermissionRoute permission={PERMISSIONS.ROLE_MANAGE}><PermissionsPage /></PermissionRoute>} />
          <Route path="exchange" element={<PermissionRoute permission={PERMISSIONS.SETTINGS_EXCHANGE}><ExchangeRatesPage /></PermissionRoute>} />
        </Route>
      </Route>
    </Routes>
  )
}
