# Graph Report - gestio-web  (2026-05-12)

## Corpus Check
- 232 files · ~190,416 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1364 nodes · 3630 edges · 110 communities (102 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e582b592`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 96|Community 96]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 98|Community 98]]
- [[_COMMUNITY_Community 99|Community 99]]
- [[_COMMUNITY_Community 100|Community 100]]
- [[_COMMUNITY_Community 101|Community 101]]
- [[_COMMUNITY_Community 102|Community 102]]

## God Nodes (most connected - your core abstractions)
1. `useAuthStore` - 164 edges
2. `cn()` - 100 edges
3. `usePermissions()` - 82 edges
4. `useToast()` - 73 edges
5. `Button()` - 62 edges
6. `supabase` - 54 edges
7. `Card` - 50 edges
8. `CardContent` - 48 edges
9. `Input()` - 45 edges
10. `CardHeader` - 44 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `useAuthStore`  [EXTRACTED]
  src/App.tsx → src/stores/authStore.ts
- `OrganizationInvitationDetails()` --calls--> `useToast()`  [EXTRACTED]
  src/components/notifications/NotificationDetailDialog.tsx → src/lib/toast.tsx
- `NotificationItem()` --calls--> `cn()`  [EXTRACTED]
  src/components/notifications/NotificationsPanel.tsx → src/lib/utils.ts
- `MetadataCard()` --calls--> `cn()`  [EXTRACTED]
  src/components/notifications/NotificationDetailDialog.tsx → src/lib/utils.ts
- `ExchangeRateDetails()` --calls--> `cn()`  [EXTRACTED]
  src/components/notifications/NotificationDetailDialog.tsx → src/lib/utils.ts

## Communities (110 total, 8 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (109): getCategories(), Product, InvitationData, ROLE_LABELS, LoginForm, loginSchema, STAR_SHADOWS, paymentLabels (+101 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (56): addInvoicePayment(), calcItemTotals(), calcWarrantyEndDate(), cancelInvoice(), convertOfferToInvoice(), convertOfferToPreInvoice(), convertPreInvoiceToInvoice(), convertPrice() (+48 more)

### Community 2 - "Community 2"
Cohesion: 0.1
Nodes (36): mainNavItems, NavItem, cn(), Separator(), Sheet(), SheetContent(), SheetDescription(), SheetFooter() (+28 more)

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (42): AuditLogPage, CategoriesPage, ConsignmentDetailPage, ConsignmentPartnersPage, ConsignmentsPage, CustomerDetailPage, CustomersPage, DashboardPage (+34 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (39): 1.1 Descripción, 1.2 Tech Stack, 1. Resumen del Proyecto, 2.1 Módulos Core (Reutilizables del Android), 2.2 Módulos de Negocio, 2.3 Funcionalidades Exclusivas Android (NO migrar), 2. Funcionalidades a Implementar, 3.1 Auth & Organization (+31 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (22): ConsignmentDetailPage(), CustomerDetailPage(), usePermissions(), CategoriesPage(), LowStockPage(), TransfersPage(), PendingInvitationBanner(), useToast() (+14 more)

### Community 6 - "Community 6"
Cohesion: 0.1
Nodes (20): InvoicesPage(), OfferDetailPage(), OffersPage(), PreInvoiceDetailPage(), PreInvoicesPage(), ConsignmentsPage(), useApprovePreInvoice(), useConvertOfferToInvoice() (+12 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (24): CategoryFormData, categorySchema, CustomerFormData, customerSchema, DocumentItemFormData, documentItemSchema, InvoiceFormData, invoiceSchema (+16 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (22): Audit Log, Billing Documents, Cash Register Session, Consignment, CONTEXT.md — Gestio Web Domain Glossary, Core Entities, Currencies, Customer (+14 more)

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (22): 1. Clonar y Configurar, 2. Instalar Dependencias, 3. Base de Datos, 4. Ejecutar, 5. Deploy en Vercel, code:bash (git clone https://github.com/alainmtz/gestio-web.git), code:block2 (VITE_SUPABASE_URL=https://tu-proyecto.supabase.co), code:bash (pnpm install) (+14 more)

### Community 10 - "Community 10"
Cohesion: 0.1
Nodes (16): cn(), LoginPage(), emailInput, link, passwordInput, user, emailInput, passwordInput (+8 more)

### Community 11 - "Community 11"
Cohesion: 0.22
Nodes (15): useClearReadNotifications(), useDeleteNotification(), useMarkAllAsRead(), useMarkAsRead(), useNotification(), useNotifications(), useUnreadCount(), NotificationsPage() (+7 more)

### Community 12 - "Community 12"
Cohesion: 0.14
Nodes (15): useCategories(), useCreateCategory(), useCreateMovement(), useCreateProduct(), useDeleteProduct(), useMovements(), useProducts(), useUpdateMovement() (+7 more)

### Community 13 - "Community 13"
Cohesion: 0.12
Nodes (9): DashboardMetrics, DashboardPage(), fetchRecentActivity(), formatCurrency(), getRelativeTime(), LowStockProduct, RecentActivity, ServiceHealth (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.16
Nodes (14): useOrganization(), DesktopHeaderBar(), MobileOrgPopover(), MobileUserPopover(), DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel (+6 more)

### Community 15 - "Community 15"
Cohesion: 0.12
Nodes (16): CASH_MOVEMENT_TYPES, CONSIGNMENT_STATUS, CURRENCIES, CURRENCY_DENOMINATIONS, CURRENCY_SYMBOLS, DOCUMENT_STATUS, DOCUMENT_TYPES, MOVEMENT_TYPES (+8 more)

### Community 16 - "Community 16"
Cohesion: 0.21
Nodes (15): InvoiceDetailPage(), Product, statusLabels, useAddInvoicePayment(), useCancelInvoice(), useCreateInvoice(), useUpdateInvoice(), useAssignTeamToInvoice() (+7 more)

### Community 17 - "Community 17"
Cohesion: 0.13
Nodes (12): CompactUploadProgress(), INVITE_STEPS, InviteForm, inviteSchema, OAUTH_STEPS, OAuthForm, oauthSchema, ONBOARDING_CHECKLIST (+4 more)

### Community 18 - "Community 18"
Cohesion: 0.17
Nodes (12): createSupplier(), CreateSupplierInput, deleteSupplier(), getSupplier(), Supplier, updateSupplier(), UpdateSupplierInput, SupplierFormData (+4 more)

### Community 19 - "Community 19"
Cohesion: 0.24
Nodes (13): useElToqueToken(), useSaveElToqueToken(), useSyncFromElToque(), usePermissionsLoad(), useCreateExchangeRate(), useCurrencies(), useDeleteExchangeRate(), useExchangeRateHistory() (+5 more)

### Community 20 - "Community 20"
Cohesion: 0.17
Nodes (12): debounce(), formatCurrency(), formatDate(), formatDateTime(), generateCode(), sleep(), debouncedFn, fn (+4 more)

### Community 21 - "Community 21"
Cohesion: 0.21
Nodes (14): AddMovementInput, CloseSessionInput, CurrencyAmounts, formatCurrencyAmounts(), OpenSessionInput, SessionsPage(), statusConfig, SUPPORTED_CURRENCIES (+6 more)

### Community 22 - "Community 22"
Cohesion: 0.15
Nodes (10): AcceptInvitationPage(), PermissionErrorPage(), PermissionGuard(), PermissionGuardProps, fetchRolePermissions(), ToastProvider(), AppRouter(), App() (+2 more)

### Community 23 - "Community 23"
Cohesion: 0.15
Nodes (10): flyoutListeners, FlyoutMenu, mainNavItems, NavItem, NavSubmenu, Sidebar(), SidebarFlyout(), SidebarProps (+2 more)

### Community 24 - "Community 24"
Cohesion: 0.24
Nodes (10): useAllStores(), useCreateStore(), useDeleteStore(), useReactivateStore(), useUpdateStore(), useUserStores(), StoresPage(), mockStoresData (+2 more)

### Community 25 - "Community 25"
Cohesion: 0.13
Nodes (5): calcDifferences(), CashMovementType, CurrencyCode, fetchActiveSession(), SessionStatus

### Community 26 - "Community 26"
Cohesion: 0.27
Nodes (11): addSortIndicators(), enableUI(), getNthColumn(), getTable(), getTableBody(), getTableHeader(), loadColumns(), loadData() (+3 more)

### Community 27 - "Community 27"
Cohesion: 0.16
Nodes (8): AuthUser, getOrganizations(), getProfile(), getSession(), LoginCredentials, OrgWithRole, RegisterData, signInWithPassword()

### Community 28 - "Community 28"
Cohesion: 0.16
Nodes (12): Notification, NotificationType, NOTIFICATION_TYPE_CONFIG, NotificationTypeConfig, ExchangeRateDetails(), formatDateTime(), MemberJoinedDetails(), MetadataCard() (+4 more)

### Community 29 - "Community 29"
Cohesion: 0.22
Nodes (11): DATE_GROUP_LABELS, DateGroupKey, buttonVariants, Pagination(), PaginationContent, PaginationEllipsis(), PaginationItem, PaginationLink() (+3 more)

### Community 30 - "Community 30"
Cohesion: 0.24
Nodes (9): useCreateSupplier(), useDeleteSupplier(), useSuppliers(), useUpdateSupplier(), SupplierFormData, supplierSchema, SuppliersPage(), mockSuppliersData (+1 more)

### Community 31 - "Community 31"
Cohesion: 0.14
Nodes (10): Address, Contact, createCustomer(), CreateCustomerInput, Customer, deleteCustomer(), getCustomer(), getCustomers() (+2 more)

### Community 32 - "Community 32"
Cohesion: 0.21
Nodes (12): ConsignmentMovement, ConsignmentStockRow, movementTypeLabels, statusLabels, Table(), TableBody(), TableCaption(), TableCell() (+4 more)

### Community 33 - "Community 33"
Cohesion: 0.24
Nodes (13): calcExpectedAmounts(), MOVEMENT_TYPES, SessionDetailPage(), statusConfig, SUPPORTED_CURRENCIES, useAddMovement(), useCashMovements(), useCashSession() (+5 more)

### Community 34 - "Community 34"
Cohesion: 0.18
Nodes (12): [activeTab, setActiveTab], ConsignmentPartner, ConsignmentPartnersPage(), { data: customerPartners, isLoading: custLoading }, { data: supplierPartners, isLoading: supLoading }, filteredCustomers, filteredSuppliers, organizationId (+4 more)

### Community 35 - "Community 35"
Cohesion: 0.37
Nodes (9): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+1 more)

### Community 36 - "Community 36"
Cohesion: 0.15
Nodes (6): CreateExchangeRateInput, Currency, ExchangeRate, getCurrencies(), GetExchangeRatesParams, getLatestRatesToCupByCodes()

### Community 37 - "Community 37"
Cohesion: 0.17
Nodes (6): CHECKLIST, LAB_CARDS, RetryStatus, STEPS, UploadProgress(), useInterval()

### Community 38 - "Community 38"
Cohesion: 0.15
Nodes (12): code:bash (git clone https://github.com/alainmtz/gestio-web.git), code:block2 (src/), code:bash (pnpm run dev          # Start dev server), Deploy, Development, Documentation, Gestio Web — Sistema CRM Empresarial, Modules (+4 more)

### Community 39 - "Community 39"
Cohesion: 0.15
Nodes (13): 17. Preguntas Frecuentes, ¿Cómo añado stock a un producto que ya existe?, ¿Cómo exporto datos?, ¿El sistema funciona sin internet?, ¿Las notificaciones son en tiempo real?, ¿Los precios se convierten automáticamente entre monedas?, ¿Mi invitación expiró, qué hago?, ¿Olvidé mi contraseña, cómo la recupero? (+5 more)

### Community 40 - "Community 40"
Cohesion: 0.29
Nodes (10): applyTheme(), initTheme(), isBrowser(), resolveIsDark(), setupSystemListener(), Theme, ThemeActions, ThemeState (+2 more)

### Community 41 - "Community 41"
Cohesion: 0.17
Nodes (11): 15. Sistema de Permisos, 2. Panel Principal (Dashboard), 5. Proveedores, 7.1 Gestión de Tiendas, 7.2 Jerarquía de Tiendas, 7. Tiendas, 9.1 Sesiones de Caja, 9.2 Movimientos de Caja (+3 more)

### Community 42 - "Community 42"
Cohesion: 0.35
Nodes (8): a(), B(), D(), g(), i(), k(), Q(), y()

### Community 43 - "Community 43"
Cohesion: 0.25
Nodes (8): AuthCallbackPage(), ForgotPasswordPage(), ResetPasswordPage(), AuthRouter(), AuthActions, AuthState, Organization, User

### Community 45 - "Community 45"
Cohesion: 0.18
Nodes (9): actionButtons, customerCard, mockCreateCustomer, mockCustomersData, mockDeleteCustomer, mockUpdateCustomer, queryClient, searchInput (+1 more)

### Community 46 - "Community 46"
Cohesion: 0.33
Nodes (6): CustomerForm(), CustomersPage(), useCreateCustomer(), useCustomers(), useDeleteCustomer(), useUpdateCustomer()

### Community 47 - "Community 47"
Cohesion: 0.2
Nodes (8): useDefaultCurrency(), ProductDetailPage(), POSPage(), ProductCard(), CsvRow, ParsedRow, ProductCsvImport(), Props

### Community 48 - "Community 48"
Cohesion: 0.22
Nodes (3): confirmSchedule(), getConfirmedCountByDateAndTeam(), TeamSchedule

### Community 49 - "Community 49"
Cohesion: 0.24
Nodes (8): createStore(), CreateStoreInput, deleteStore(), getCurrencyByCode(), getStore(), StoreType, updateStore(), UpdateStoreInput

### Community 50 - "Community 50"
Cohesion: 0.22
Nodes (7): useIsMobile(), AppSidebar(), Header(), CacheWarning, CacheWarningBanner(), SidebarInset(), SidebarProvider()

### Community 51 - "Community 51"
Cohesion: 0.27
Nodes (8): CashMovement, CashSession, amountsToRows(), escapeHtml(), fmtDate(), generateSessionCSV(), generateSessionPDF(), CASH_MOVEMENT_TYPE_LABELS

### Community 52 - "Community 52"
Cohesion: 0.28
Nodes (6): getStores(), Store, assertValidUUID(), isValidUUID(), useOrganizationId(), Store

### Community 53 - "Community 53"
Cohesion: 0.28
Nodes (7): createNotifications(), useRealtimeNotifications(), DashboardLayout(), AppNotification, NotificationStore, NotificationType, useNotificationStore

### Community 54 - "Community 54"
Cohesion: 0.22
Nodes (7): input, mockCreateCategory, mockDeleteCategory, mockGetCategories, mockUpdateCategory, queryClient, user

### Community 55 - "Community 55"
Cohesion: 0.25
Nodes (7): org, organizations, permissions, session, store, stores, user

### Community 56 - "Community 56"
Cohesion: 0.25
Nodes (7): Correcciones Applied during validation (28/04/2026), Documentación y cierre, Pre-release, Release Checklist - Web App, Riesgos conocidos, Validación funcional rápida, Validación técnica

### Community 57 - "Community 57"
Cohesion: 0.25
Nodes (7): code:bash (pnpm run lint -- --quiet), Current Status, Known Issues, Progress Summary - Web App (Gestio v2), Recent Milestones, Stack, Validation Commands

### Community 58 - "Community 58"
Cohesion: 0.25
Nodes (7): Before exploring, read these, code:block1 (/), code:block2 (/), Domain Docs, File structure, Flag ADR conflicts, Use the glossary's vocabulary

### Community 59 - "Community 59"
Cohesion: 0.29
Nodes (5): RegisterPage(), link, nextButton, nextButtons, user

### Community 60 - "Community 60"
Cohesion: 0.33
Nodes (5): DEMO_ACTIVITIES, DEMO_DATA, DEMO_LOW_STOCK, formatCurrency(), MockDashboardContent()

### Community 61 - "Community 61"
Cohesion: 0.33
Nodes (5): queryClient, Tooltip(), TooltipContent(), TooltipProvider(), TooltipTrigger()

### Community 62 - "Community 62"
Cohesion: 0.38
Nodes (5): ElToqueRateResponse, ElToqueToken, fetchElToqueRates(), getElToqueToken(), syncFromElToque()

### Community 63 - "Community 63"
Cohesion: 0.29
Nodes (7): 3.1 Productos, 3.2 Categorías, 3.3 Movimientos de Stock, 3.4 Transferencias entre Tiendas, 3.5 Reporte de Inventario, 3.6 Alertas de Stock Bajo, 3. Inventario

### Community 64 - "Community 64"
Cohesion: 0.33
Nodes (5): notifications, orgId, orgMap, productNames, supabaseAdmin

### Community 65 - "Community 65"
Cohesion: 0.33
Nodes (5): item, itemSchema, offer, schema, validTransitions

### Community 66 - "Community 66"
Cohesion: 0.33
Nodes (5): orgs, permissions, { result }, store, stores

### Community 67 - "Community 67"
Cohesion: 0.4
Nodes (4): SearchableSelect(), SearchableSelectOption, SearchableSelectProps, toInternal()

### Community 68 - "Community 68"
Cohesion: 0.33
Nodes (4): mockOrganization, mockSession, mockUser, SupabaseMock

### Community 69 - "Community 69"
Cohesion: 0.33
Nodes (5): Agent skills, Domain docs, graphify, Issue tracker, Triage labels

### Community 70 - "Community 70"
Cohesion: 0.33
Nodes (6): 1.1 Iniciar Sesión, 1.2 Crear una Cuenta, 1.3 Aceptar una Invitación, 1.4 Seleccionar Organización, 1.5 Seleccionar Tienda, 1. Acceso y Primeros Pasos

### Community 71 - "Community 71"
Cohesion: 0.33
Nodes (6): 14.1 Perfil, 14.2 Organización, 14.3 Miembros del Equipo, 14.4 Permisos, 14.5 Tasas de Cambio, 14. Configuración

### Community 72 - "Community 72"
Cohesion: 0.33
Nodes (6): 6.1 Ofertas, 6.2 Prefacturas, 6.3 Facturas, 6.4 Multi-moneda, 6. Facturación, code:block1 (Oferta → Prefactura → Factura)

### Community 73 - "Community 73"
Cohesion: 0.33
Nodes (5): April 2026, Pre-April 2026, Progress History - Web App (Gestio v2), Session 27-28 April 2026, Session 28 April 2026

### Community 74 - "Community 74"
Cohesion: 0.7
Nodes (4): goToNext(), goToPrevious(), makeCurrent(), toggleClass()

### Community 75 - "Community 75"
Cohesion: 0.4
Nodes (4): customer, input, query, schema

### Community 76 - "Community 76"
Cohesion: 0.4
Nodes (4): invoiceSchema, itemSchema, schema, validInvoice

### Community 77 - "Community 77"
Cohesion: 0.5
Nodes (3): ProtectedRoute(), ProtectedRouteProps, mockAuthState

### Community 78 - "Community 78"
Cohesion: 0.4
Nodes (4): Toast, UIActions, UIState, useUIStore

### Community 79 - "Community 79"
Cohesion: 0.4
Nodes (4): CartItem, POSActions, POSState, usePOSStore

### Community 80 - "Community 80"
Cohesion: 0.4
Nodes (4): Completed, Pending, Quality Debt, TODO - Web App (Gestio v2)

### Community 81 - "Community 81"
Cohesion: 0.4
Nodes (5): 16.1 Monedas Disponibles, 16.2 Cómo Funcionan las Tasas, 16.3 Gráfico de Tasas, 16.4 Widget del Dashboard, 16. Monedas y Tasas de Cambio

### Community 82 - "Community 82"
Cohesion: 0.4
Nodes (5): 8.1 Crear una Consignación, 8.2 Registrar Ventas y Devoluciones, 8.3 Liquidar una Consignación, 8.4 Estados, 8. Consignaciones

### Community 83 - "Community 83"
Cohesion: 0.4
Nodes (5): 13.1 Panel de Notificaciones, 13.2 Tipos de Notificación, 13.3 Detalle de Notificación, 13.4 Marcar como Leída, 13. Notificaciones

### Community 84 - "Community 84"
Cohesion: 0.4
Nodes (5): 12.1 Reporte de Ventas, 12.2 Reporte de Inventario, 12.3 Reporte Financiero, 12.4 Log de Auditoría, 12. Reportes

### Community 85 - "Community 85"
Cohesion: 0.4
Nodes (5): 4.1 Lista de Clientes, 4.2 Crear un Cliente, 4.3 Ficha del Cliente, 4.4 Exportar Clientes, 4. Clientes

### Community 86 - "Community 86"
Cohesion: 0.4
Nodes (4): Conventions, Issue tracker: GitHub, When a skill says "fetch the relevant ticket", When a skill says "publish to the issue tracker"

### Community 87 - "Community 87"
Cohesion: 0.4
Nodes (4): ADR-0004: Granular Role-Based Permission System, Consequences, Context, Decision

### Community 88 - "Community 88"
Cohesion: 0.4
Nodes (4): ADR-0001: Supabase as Backend-as-a-Service, Consequences, Context, Decision

### Community 89 - "Community 89"
Cohesion: 0.4
Nodes (4): ADR-0002: shadcn/ui with Radix + Tailwind for UI Components, Consequences, Context, Decision

### Community 90 - "Community 90"
Cohesion: 0.4
Nodes (4): ADR-0003: Zustand for Client State, React Query for Server State, Consequences, Context, Decision

### Community 91 - "Community 91"
Cohesion: 0.4
Nodes (4): ADR-0005: React Router v7 with Permission-Protected Route Tree, Consequences, Context, Decision

### Community 93 - "Community 93"
Cohesion: 0.67
Nodes (3): getErrorMessage(), showErrorToast(), ToastFn

### Community 94 - "Community 94"
Cohesion: 0.5
Nodes (3): NAV_ITEMS, NavItem, SettingsLayout()

### Community 95 - "Community 95"
Cohesion: 0.5
Nodes (4): 11.1 Equipos de Trabajo, 11.2 Horarios, 11.3 Tareas, 11. Equipos y Tareas

### Community 96 - "Community 96"
Cohesion: 0.5
Nodes (4): 10.1 Acceder al POS, 10.2 Realizar una Venta, 10.3 Órdenes en Espera, 10. Punto de Venta (POS)

## Knowledge Gaps
- **562 isolated node(s):** `supabaseAdmin`, `orgMap`, `orgId`, `productNames`, `notifications` (+557 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuthStore` connect `Community 19` to `Community 0`, `Community 2`, `Community 5`, `Community 6`, `Community 10`, `Community 11`, `Community 12`, `Community 13`, `Community 14`, `Community 16`, `Community 17`, `Community 18`, `Community 21`, `Community 22`, `Community 23`, `Community 24`, `Community 28`, `Community 30`, `Community 32`, `Community 33`, `Community 34`, `Community 35`, `Community 43`, `Community 46`, `Community 47`, `Community 50`, `Community 52`, `Community 53`, `Community 55`, `Community 59`, `Community 66`, `Community 77`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `cn()` connect `Community 2` to `Community 0`, `Community 32`, `Community 34`, `Community 35`, `Community 67`, `Community 37`, `Community 11`, `Community 14`, `Community 16`, `Community 17`, `Community 18`, `Community 61`, `Community 20`, `Community 50`, `Community 23`, `Community 28`, `Community 29`, `Community 94`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `supabase` connect `Community 0` to `Community 1`, `Community 5`, `Community 13`, `Community 14`, `Community 16`, `Community 17`, `Community 18`, `Community 22`, `Community 25`, `Community 27`, `Community 28`, `Community 31`, `Community 32`, `Community 34`, `Community 36`, `Community 43`, `Community 44`, `Community 47`, `Community 48`, `Community 49`, `Community 53`, `Community 62`, `Community 75`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **What connects `supabaseAdmin`, `orgMap`, `orgId` to the rest of the system?**
  _562 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._