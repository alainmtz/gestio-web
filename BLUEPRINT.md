# Gestio Web - Blueprint

**Versión:** 1.0  
**Fecha:** 2026-04-11  
**Basado en:** Gestio v2 Android (v0.14.0)

---

## 1. Resumen del Proyecto

### 1.1 Descripción

Gestio Web es la versión web del sistema CRM empresarial Gestio v2, construido con React y TypeScript. Mantiene la misma funcionalidad del app Android, prescindiendo de características exclusivas de dispositivos móviles (impresión térmica, escaneo de códigos de barras, notificaciones push FCM, Bluetooth).

### 1.2 Tech Stack

| Capa | Tecnología |
|------|------------|
| **Frontend** | React 19 + TypeScript + Vite 7 |
| **Routing** | React Router v7 |
| **Estado Server** | TanStack Query v5 |
| **Estado Global** | Zustand |
| **UI Framework** | TailwindCSS + shadcn/ui |
| **Formularios** | React Hook Form + Zod |
| **Gráficos** | Recharts |
| **Backend** | Supabase (Auth + PostgreSQL + Realtime) |
| **Edge Functions** | Deno/Node.js |

---

## 2. Funcionalidades a Implementar

### 2.1 Módulos Core (Reutilizables del Android)

| Módulo | Funcionalidades |
|--------|----------------|
| **Auth** | Login, registro, logout, recuperación contraseña, gestión multi-organización, selección de organización activa |
| **Organizations** | CRUD organizaciones, configuración, ajustes de organización, gestión de tiendas permitidas |
| **Users** | Perfiles de usuario, miembros de organización, invitaciones por email, roles (Owner/Admin/Member) |
| **Permissions** | Sistema granular de permisos, guards de navegación, gating UI por permisos |

### 2.2 Módulos de Negocio

| Módulo | Funcionalidades |
|--------|----------------|
| **Inventory** | CRUD productos, variantes con atributos, categorías jerárquicas, control stock por tienda, 10 tipos de movimientos, transferencias entre tiendas, alertas stock bajo, búsqueda full-text |
| **Customers** | CRM completo: clientes y proveedores, múltiples contactos, múltiples direcciones, notas con timestamp, tags personalizables, exportación CSV, filtros avanzados |
| **Billing** | Workflow Offer → PreInvoice → Invoice, versionado documentos, numeración secuencial, cálculos multi-moneda, descuentos por item y global, impuestos, pagos parciales, notas de crédito |
| **Multistore** | CRUD tiendas, asignación usuarios-tiendas, configuración por tienda, tasas de cambio, selección tienda activa |
| **Consignment** | Stock en consignación, envío a partners, registro ventas/devoluciones, liquidación con comisiones, historial movimientos, estados automáticos |
| **Teams** | Gestión equipos, horarios de trabajo, asignación tareas, calendario semanal |
| **CashRegister** | Apertura/cierre sesión caja, movimientos (ingresos/egresos), cuadre de caja, multi-moneda |
| **Reports** | Dashboards ventas, inventario, financieros; exportación CSV/PDF; auditoría de cambios |
| **POS** | Interfaz punto de venta optimizada para tablets, grid productos, carrito, procesamiento pagos |

### 2.3 Funcionalidades Exclusivas Android (NO migrar)

- Impresión térmica ESCPOS (Bluetooth)
- Escaneo códigos de barras (CameraX + ZXing)
- Notificaciones push FCM
- Acceso contactos dispositivo
- Almacenamiento externo / galería
- GPS / Localización
- Bluetooth
- Modo kiosko Android

---

## 3. Modelos de Datos

### 3.1 Auth & Organization

```typescript
interface Organization {
  id: string;
  name: string;
  slug: string;
  taxId?: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  logoUrl?: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  organizationId?: string;
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  isActive: boolean;
  invitedBy?: string;
  invitedAt?: string;
  joinedAt?: string;
  createdAt: string;
}

interface OrganizationInvitation {
  id: string;
  organizationId: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  token: string;
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
}

interface UserStore {
  id: string;
  userId: string;
  storeId: string;
  canAccessPos: boolean;
  createdAt: string;
}

interface OrganizationSetting {
  id: string;
  organizationId: string;
  currencyId: string;
  allowedStoreIds?: string[];
  config: Record<string, any>;
  updatedAt: string;
}
```

### 3.2 Inventory

```typescript
interface Product {
  id: string;
  organizationId: string;
  storeId?: string;
  categoryId?: string;
  name: string;
  sku?: string;
  barcode?: string;
  description?: string;
  price: string;
  cost?: string;
  minStock: number;
  maxStock: number;
  isActive: boolean;
  hasVariants: boolean;
  attributes: Record<string, any>;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductVariant {
  id: string;
  productId: string;
  sku?: string;
  barcode?: string;
  name: string;
  price: string;
  cost?: string;
  attributes: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductCategory {
  id: string;
  organizationId: string;
  parentId?: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

interface Inventory {
  id: string;
  productId: string;
  storeId: string;
  available: number;
  reserved: number;
  updatedAt: string;
}

interface InventoryMovement {
  id: string;
  organizationId: string;
  productId: string;
  storeId: string;
  movementType: 
    | 'PURCHASE'
    | 'SALE'
    | 'ADJUSTMENT'
    | 'TRANSFER_IN'
    | 'TRANSFER_OUT'
    | 'RETURN'
    | 'DAMAGE'
    | 'CONSIGNMENT_IN'
    | 'CONSIGNMENT_OUT'
    | 'OPENING';
  quantity: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceId?: string;
  referenceType?: string;
  notes?: string;
  userId: string;
  createdAt: string;
}
```

### 3.3 Customers

```typescript
interface Customer {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  type: 'INDIVIDUAL' | 'BUSINESS';
  taxId?: string;
  email?: string;
  phone?: string;
  creditLimit: string;
  currentBalance: string;
  isActive: boolean;
  tags: string[];
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface Address {
  id: string;
  customerId?: string;
  supplierId?: string;
  type: 'BILLING' | 'SHIPPING' | 'OTHER';
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
}

interface Contact {
  id: string;
  customerId?: string;
  supplierId?: string;
  name: string;
  email?: string;
  phone?: string;
  position?: string;
  isPrimary: boolean;
  createdAt: string;
}

interface CustomerNote {
  id: string;
  customerId: string;
  content: string;
  userId: string;
  createdAt: string;
}
```

### 3.4 Billing

```typescript
interface Offer {
  id: string;
  organizationId: string;
  storeId: string;
  customerId?: string;
  documentNumber: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  total: string;
  currencyId: string;
  notes?: string;
  validUntil?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface OfferItem {
  id: string;
  offerId: string;
  productId?: string;
  variantId?: string;
  productName: string;
  sku?: string;
  quantity: number;
  unitPrice: string;
  taxRate: string;
  taxAmount: string;
  discountAmount: string;
  total: string;
  createdAt: string;
}

interface PreInvoice {
  id: string;
  organizationId: string;
  storeId: string;
  customerId?: string;
  offerId?: string;
  documentNumber: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  total: string;
  currencyId: string;
  validUntil?: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface Invoice {
  id: string;
  organizationId: string;
  storeId: string;
  customerId?: string;
  offerId?: string;
  preInvoiceId?: string;
  documentNumber: string;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID';
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  total: string;
  paidAmount: string;
  currencyId: string;
  issuedAt?: string;
  dueDate?: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId?: string;
  variantId?: string;
  productName: string;
  sku?: string;
  quantity: number;
  unitPrice: string;
  taxRate: string;
  taxAmount: string;
  discountAmount: string;
  total: string;
}

interface InvoicePayment {
  id: string;
  invoiceId: string;
  amount: string;
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'CHECK' | 'OTHER';
  reference?: string;
  notes?: string;
  recordedBy?: string;
  createdAt: string;
}

interface DocumentVersion {
  id: string;
  documentType: 'OFFER' | 'PREINVOICE' | 'INVOICE';
  documentId: string;
  version: number;
  snapshot: Record<string, any>;
  changes?: Record<string, { old: any; new: any }>;
  createdBy?: string;
  createdAt: string;
}
```

### 3.5 Stores

```typescript
interface Store {
  id: string;
  organizationId: string;
  parentStoreId?: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  country: string;
  currencyId: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  config: {
    printerEnabled?: boolean;
    printerName?: string;
    posEnabled?: boolean;
    invoicePrefix?: string;
    offerPrefix?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

interface ExchangeRate {
  id: string;
  organizationId: string;
  fromCurrency: string;
  toCurrency: string;
  rate: string;
  validFrom: string;
  validUntil?: string;
  isActive: boolean;
  createdAt: string;
}
```

### 3.6 Consignment

```typescript
interface Consignment {
  id: string;
  organizationId: string;
  storeId: string;
  partnerId: string;
  partnerType: 'CUSTOMER' | 'SUPPLIER';
  status: 'ACTIVE' | 'PARTIAL' | 'COMPLETED' | 'CANCELLED';
  totalQuantity: string;
  deliveredQuantity: string;
  soldQuantity: string;
  returnedQuantity: string;
  currencyId: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface ConsignmentStock {
  id: string;
  consignmentId: string;
  productId: string;
  variantId?: string;
  quantity: string;
  unitCost?: string;
  deliveredQuantity: string;
  soldQuantity: string;
  returnedQuantity: string;
  createdAt: string;
}

interface ConsignmentMovement {
  id: string;
  consignmentId: string;
  type: 'DELIVERY' | 'SALE' | 'RETURN' | 'LIQUIDATION' | 'CANCELLATION';
  productId: string;
  variantId?: string;
  quantity: string;
  unitPrice?: string;
  totalAmount?: string;
  referenceId?: string;
  notes?: string;
  userId: string;
  createdAt: string;
}
```

### 3.7 Cash Register

```typescript
interface CashRegisterSession {
  id: string;
  storeId: string;
  userId: string;
  openingAmount: string;
  closingAmount?: string;
  expectedAmount?: string;
  difference?: string;
  status: 'OPEN' | 'CLOSED';
  openedAt: string;
  closedAt?: string;
}

interface CashRegisterMovement {
  id: string;
  sessionId: string;
  type: 'SALE' | 'INCOME' | 'EXPENSE' | 'CASH_DROP' | 'CLOSING';
  paymentMethod?: 'CASH' | 'CARD' | 'TRANSFER';
  amount: string;
  reference?: string;
  notes?: string;
  userId: string;
  createdAt: string;
}
```

### 3.8 Teams

```typescript
interface Team {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: 'LEADER' | 'MEMBER';
  joinedAt: string;
}

interface WorkSchedule {
  id: string;
  teamId?: string;
  userId: string;
  storeId: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface TeamTask {
  id: string;
  teamId: string;
  title: string;
  description?: string;
  assignedTo?: string;
  dueDate?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  updatedAt: string;
}
```

### 3.9 Audit

```typescript
interface AuditLog {
  id: string;
  organizationId?: string;
  tableName: string;
  recordId: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  oldData?: Record<string, any>;
  newData?: Record<string, any>;
  userId?: string;
  ipAddress?: string;
  createdAt: string;
}
```

---

## 4. Sistema de Permisos

### 4.1 Roles

| Rol | Descripción |
|-----|-------------|
| `OWNER` | Propietario de organización - todos los permisos |
| `ADMIN` | Administrador - gestión de usuarios y configuración |
| `MEMBER` | Miembro estándar - operaciones básicas |

### 4.2 Permisos por Módulo

```typescript
const PERMISSIONS = {
  // Products
  PRODUCT_VIEW: 'PRODUCT_VIEW',
  PRODUCT_CREATE: 'PRODUCT_CREATE',
  PRODUCT_EDIT: 'PRODUCT_EDIT',
  PRODUCT_DELETE: 'PRODUCT_DELETE',
  
  // Inventory
  INVENTORY_VIEW: 'INVENTORY_VIEW',
  INVENTORY_ADJUST: 'INVENTORY_ADJUST',
  MOVEMENT_VIEW: 'MOVEMENT_VIEW',
  MOVEMENT_CREATE: 'MOVEMENT_CREATE',
  
  // Customers
  CUSTOMER_VIEW: 'CUSTOMER_VIEW',
  CUSTOMER_CREATE: 'CUSTOMER_CREATE',
  CUSTOMER_EDIT: 'CUSTOMER_EDIT',
  CUSTOMER_DELETE: 'CUSTOMER_DELETE',
  
  // Suppliers
  SUPPLIER_VIEW: 'SUPPLIER_VIEW',
  SUPPLIER_CREATE: 'SUPPLIER_CREATE',
  SUPPLIER_EDIT: 'SUPPLIER_EDIT',
  SUPPLIER_DELETE: 'SUPPLIER_DELETE',
  
  // Billing
  OFFER_VIEW: 'OFFER_VIEW',
  OFFER_CREATE: 'OFFER_CREATE',
  OFFER_EDIT: 'OFFER_EDIT',
  OFFER_DELETE: 'OFFER_DELETE',
  PREINVOICE_VIEW: 'PREINVOICE_VIEW',
  PREINVOICE_CREATE: 'PREINVOICE_CREATE',
  PREINVOICE_EDIT: 'PREINVOICE_EDIT',
  PREINVOICE_APPROVE: 'PREINVOICE_APPROVE',
  INVOICE_VIEW: 'INVOICE_VIEW',
  INVOICE_CREATE: 'INVOICE_CREATE',
  INVOICE_EDIT: 'INVOICE_EDIT',
  INVOICE_CANCEL: 'INVOICE_CANCEL',
  PAYMENT_REGISTER: 'PAYMENT_REGISTER',
  
  // Consignment
  CONSIGNMENT_VIEW: 'CONSIGNMENT_VIEW',
  CONSIGNMENT_CREATE: 'CONSIGNMENT_CREATE',
  CONSIGNMENT_EDIT: 'CONSIGNMENT_EDIT',
  CONSIGNMENT_LIQUIDATE: 'CONSIGNMENT_LIQUIDATE',
  
  // Cash Register
  REGISTER_VIEW: 'REGISTER_VIEW',
  REGISTER_OPEN: 'REGISTER_OPEN',
  REGISTER_CLOSE: 'REGISTER_CLOSE',
  MOVEMENT_CREATE: 'MOVEMENT_CREATE',
  POS_ACCESS: 'POS_ACCESS',
  
  // Teams
  TEAM_VIEW: 'TEAM_VIEW',
  TEAM_CREATE: 'TEAM_CREATE',
  TEAM_EDIT: 'TEAM_EDIT',
  TEAM_DELETE: 'TEAM_DELETE',
  TEAM_ASSIGN: 'TEAM_ASSIGN',
  SCHEDULE_VIEW: 'SCHEDULE_VIEW',
  SCHEDULE_MANAGE: 'SCHEDULE_MANAGE',
  
  // Reports
  REPORT_VIEW: 'REPORT_VIEW',
  REPORT_EXPORT: 'REPORT_EXPORT',
  REPORT_SALES: 'REPORT_SALES',
  REPORT_INVENTORY: 'REPORT_INVENTORY',
  REPORT_FINANCIAL: 'REPORT_FINANCIAL',
  
  // Organization
  ORG_VIEW: 'ORG_VIEW',
  ORG_EDIT: 'ORG_EDIT',
  STORE_VIEW: 'STORE_VIEW',
  STORE_CREATE: 'STORE_CREATE',
  STORE_EDIT: 'STORE_EDIT',
  STORE_DELETE: 'STORE_DELETE',
  MEMBER_INVITE: 'MEMBER_INVITE',
  MEMBER_ROLE: 'MEMBER_ROLE',
  MEMBER_REMOVE: 'MEMBER_REMOVE',
  
  // Settings
  SETTINGS_VIEW: 'SETTINGS_VIEW',
  SETTINGS_PROFILE: 'SETTINGS_PROFILE',
  SETTINGS_ORG: 'SETTINGS_ORG',
  SETTINGS_EXCHANGE: 'SETTINGS_EXCHANGE',
  
  // System
  AUDIT_VIEW: 'AUDIT_VIEW',
} as const;
```

### 4.3 Permisos por Rol

```typescript
const ROLE_PERMISSIONS: Record<string, string[]> = {
  OWNER: Object.values(PERMISSIONS),
  
  ADMIN: [
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_EDIT,
    PERMISSIONS.PRODUCT_DELETE,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.MOVEMENT_VIEW,
    PERMISSIONS.MOVEMENT_CREATE,
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_EDIT,
    PERMISSIONS.SUPPLIER_VIEW,
    PERMISSIONS.SUPPLIER_CREATE,
    PERMISSIONS.SUPPLIER_EDIT,
    PERMISSIONS.OFFER_VIEW,
    PERMISSIONS.OFFER_CREATE,
    PERMISSIONS.OFFER_EDIT,
    PERMISSIONS.PREINVOICE_VIEW,
    PERMISSIONS.PREINVOICE_CREATE,
    PERMISSIONS.PREINVOICE_EDIT,
    PERMISSIONS.PREINVOICE_APPROVE,
    PERMISSIONS.INVOICE_VIEW,
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.PAYMENT_REGISTER,
    PERMISSIONS.CONSIGNMENT_VIEW,
    PERMISSIONS.CONSIGNMENT_CREATE,
    PERMISSIONS.CONSIGNMENT_EDIT,
    PERMISSIONS.CONSIGNMENT_LIQUIDATE,
    PERMISSIONS.REGISTER_VIEW,
    PERMISSIONS.REGISTER_OPEN,
    PERMISSIONS.REGISTER_CLOSE,
    PERMISSIONS.MOVEMENT_CREATE,
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.TEAM_CREATE,
    PERMISSIONS.TEAM_EDIT,
    PERMISSIONS.TEAM_DELETE,
    PERMISSIONS.TEAM_ASSIGN,
    PERMISSIONS.SCHEDULE_VIEW,
    PERMISSIONS.SCHEDULE_MANAGE,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_EXPORT,
    PERMISSIONS.REPORT_SALES,
    PERMISSIONS.REPORT_INVENTORY,
    PERMISSIONS.REPORT_FINANCIAL,
    PERMISSIONS.ORG_VIEW,
    PERMISSIONS.ORG_EDIT,
    PERMISSIONS.STORE_VIEW,
    PERMISSIONS.STORE_CREATE,
    PERMISSIONS.STORE_EDIT,
    PERMISSIONS.MEMBER_INVITE,
    PERMISSIONS.MEMBER_ROLE,
    PERMISSIONS.MEMBER_REMOVE,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_PROFILE,
    PERMISSIONS.SETTINGS_ORG,
    PERMISSIONS.SETTINGS_EXCHANGE,
  ],
  
  MEMBER: [
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.MOVEMENT_VIEW,
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.OFFER_VIEW,
    PERMISSIONS.PREINVOICE_VIEW,
    PERMISSIONS.INVOICE_VIEW,
    PERMISSIONS.CONSIGNMENT_VIEW,
    PERMISSIONS.REGISTER_VIEW,
    PERMISSIONS.REGISTER_OPEN,
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.SCHEDULE_VIEW,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.STORE_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_PROFILE,
  ],
};
```

---

## 5. Rutas y Navegación

### 5.1 Estructura de Rutas

```
/                           → Redirect a /dashboard o /login
/login                      → Login
/register                   → Registro
/verify-email               → Verificación de email
/forgot-password            → Recuperar contraseña
/reset-password             → Reset password con token

/dashboard                  → Home con resumen de métricas

/inventory
  /products                 → Lista productos
  /products/new             → Crear producto
  /products/:id             → Detalle/editar producto
  /products/:id/variants    → Variantes del producto
  /categories               → Categorías
  /movements                → Movimientos stock
  /transfers                → Transferencias entre tiendas
  /alerts                   → Alertas stock bajo

/customers
  /list                     → Lista clientes/proveedores
  /clients                  → Solo clientes
  /suppliers                → Solo proveedores
  /new                      → Crear cliente/proveedor
  /:id                      → Detalle cliente/proveedor
  /:id/addresses            → Direcciones
  /:id/contacts             → Contactos
  /:id/notes                → Notas

/billing
  /offers                   → Lista ofertas
  /offers/new               → Crear oferta
  /offers/:id               → Detalle oferta
  /preinvoices              → Lista prefacturas
  /preinvoices/:id          → Detalle prefactura
  /invoices                 → Lista facturas
  /invoices/new             → Crear factura
  /invoices/:id             → Detalle factura
  /invoices/:id/payments    → Pagos de factura

/stores                     → Gestión tiendas
/stores/new                 → Crear tienda
/stores/:id                 → Detalle/editar tienda
/stores/:id/assignments     → Asignar usuarios

/consignments
  /list                     → Lista consignaciones
  /partners                 → Socios consignación
  /new                      → Crear consignación
  /:id                      → Detalle consignación
  /:id/register-sale        → Registrar venta
  /:id/register-return      → Registrar devolución
  /:id/liquidate            → Liquidar

/cash-register
  /sessions                 → Sesiones de caja
  /sessions/new             → Abrir caja
  /sessions/:id             → Detalle sesión
  /movements                → Movimientos de caja

/teams
  /list                     → Lista equipos
  /new                      → Crear equipo
  /:id                      → Detalle equipo
  /schedules                → Horarios de trabajo
  /tasks                    → Tareas

/reports
  /sales                    → Reporte ventas
  /inventory                → Reporte inventario
  /financial                → Reporte financiero
  /audit                    → Log auditoría

/pos                        → Punto de venta

/settings
  /profile                  → Perfil usuario
  /organization             → Configuración organización
  /members                  → Miembros equipo
  /invitations              → Invitaciones pendientes
  /stores                   → Config tiendas
  /permissions              → Gestión permisos
  /exchange                 → Tasas de cambio
  /printer                  → Info configuración impr. (legacy)
```

### 5.2 Jerarquía de Navegación

```
┌─ Sidebar (Desktop) ──────────────────────────────────────┐
│  [Logo]  Gestio                                          │
│                                                          │
│  📊 Dashboard                                            │
│                                                          │
│  📦 Inventario                                          │
│    └─ Productos                                         │
│    └─ Categorías                                        │
│    └─ Movimientos                                       │
│                                                          │
│  👥 Clientes                                             │
│    └─ Lista                                             │
│    └─ Proveedores                                       │
│                                                          │
│  💰 Facturación                                         │
│    └─ Ofertas                                           │
│    └─ Prefacturas                                       │
│    └─ Facturas                                          │
│                                                          │
│  🏪 Tiendas                                             │
│                                                          │
│  📋 Consignaciones                                      │
│                                                          │
│  💵 Caja                                                │
│                                                          │
│  👥 Equipos                                             │
│                                                          │
│  📈 Reportes                                           │
│    └─ Ventas                                            │
│    └─ Inventario                                       │
│    └─ Financiero                                       │
│    └─ Auditoría                                         │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  ⚙️ Configuración                                      │
│  🚪 Cerrar Sesión                                       │
└──────────────────────────────────────────────────────────┘
```

---

## 6. Componentes UI

### 6.1 Layout

```typescript
// Layout principal con sidebar colapsable
<DashboardLayout>
  <Sidebar 
    isCollapsed={isSidebarCollapsed}
    onToggle={toggleSidebar}
    activeItem={currentRoute}
  />
  <Header 
    organization={currentOrg}
    store={currentStore}
    user={currentUser}
    onStoreChange={handleStoreChange}
  />
  <MainContent>
    {children}
  </MainContent>
  <ToastContainer />
</DashboardLayout>

// Header con selector de organización y tienda
<Header
  logoUrl={org.logoUrl}
  organizationName={org.name}
  storeName={store?.name}
  userName={user.fullName}
  userAvatar={user.avatarUrl}
  notificationCount={unreadNotifications}
  onOrganizationClick={() => openOrgSelector()}
  onStoreClick={() => openStoreSelector()}
  onProfileClick={() => navigate('/settings/profile')}
  onLogout={() => logout()}
/>
```

### 6.2 Data Tables

```typescript
// Tabla genérica con paginación, filtros y búsqueda
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
  filters?: FilterDef[];
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

// Columnas ejemplo para productos
const productColumns: ColumnDef<Product>[] = [
  {
    accessorKey: 'name',
    header: 'Producto',
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <ProductImage src={row.original.imageUrl} />
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-sm text-muted-foreground">
            SKU: {row.original.sku || 'N/A'}
          </div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'category.name',
    header: 'Categoría',
  },
  {
    accessorKey: 'price',
    header: 'Precio',
    cell: ({ row }) => formatCurrency(row.original.price, row.original.currencyId),
  },
  {
    accessorKey: 'stock',
    header: 'Stock',
    cell: ({ row }) => <StockBadge available={row.stock.available} />,
  },
  {
    accessorKey: 'isActive',
    header: 'Estado',
    cell: ({ row }) => <StatusBadge status={row.original.isActive} />,
  },
  {
    id: 'actions',
    cell: ({ row }) => <RowActions row={row} />,
  },
];
```

### 6.3 Formularios

```typescript
// Schema de validación con Zod
const productSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.string().optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Precio inválido'),
  cost: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Costo inválido').optional(),
  minStock: z.number().int().min(0).optional(),
  maxStock: z.number().int().min(0).optional(),
  hasVariants: z.boolean(),
  attributes: z.record(z.any()).optional(),
});

// Formulario de producto
<ProductForm
  defaultValues={product}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  isLoading={isSubmitting}
  permission={permissions.PRODUCT_EDIT}
/>

// Campos de formulario reutilizables
<FormField
  control={form.control}
  name="name"
  label="Nombre del producto"
  placeholder="Ej: Camisa Manga Larga"
  error={form.formState.errors.name}
/>

<PriceInput
  control={form.control}
  name="price"
  label="Precio"
  currency={selectedCurrency}
  currencies={availableCurrencies}
  onCurrencyChange={setCurrency}
/>

<InventoryStockEditor
  control={form.control}
  name="stock"
  storeId={selectedStore}
  productId={product?.id}
/>
```

### 6.4 Document Workflow

```typescript
// Workflow de documentos (Offer → PreInvoice → Invoice)
<DocumentWorkflow
  document={document}
  currentType="invoice"
  onConvert={(toType) => handleConvert(toType)}
  onEdit={() => navigate('edit')}
  onPrint={() => handlePrint()}
  onCancel={() => openCancelDialog()}
/>

// Editor de documento con items
<DocumentEditor
  type="invoice"
  document={invoice}
  onAddItem={addItem}
  onUpdateItem={updateItem}
  onRemoveItem={removeItem}
  onUpdateTotals={updateTotals}
  availableProducts={products}
  customer={customer}
  onSelectCustomer={selectCustomer}
/>

// Lista de items con edición inline
<DocumentItemsTable
  items={items}
  onQuantityChange={updateQuantity}
  onPriceChange={updatePrice}
  onDiscountChange={updateDiscount}
  onRemove={removeItem}
  currency={currency}
/>

// Resumen con cálculos
<DocumentSummary
  subtotal={subtotal}
  taxAmount={taxAmount}
  discountAmount={discountAmount}
  total={total}
  currency={currency}
  hasTaxableItems={hasTaxableItems}
/>
```

### 6.5 POS Interface

```typescript
// Layout POS optimizado para tablets
<POSLayout>
  <POSHeader
    store={currentStore}
    cashier={currentUser}
    sessionStatus={session?.status}
  />
  
  <div className="flex-1 flex">
    {/* Grid de productos */}
    <POSProductGrid
      products={filteredProducts}
      categories={categories}
      onSelectProduct={addToCart}
      onSearch={setSearchTerm}
      searchTerm={searchTerm}
    />
    
    {/* Carrito */}
    <POSCart
      items={cartItems}
      onUpdateQuantity={updateQuantity}
      onRemoveItem={removeItem}
      onClearCart={clearCart}
      customer={selectedCustomer}
      onSelectCustomer={openCustomerSelector}
      subtotal={subtotal}
      tax={tax}
      discount={discount}
      total={total}
      onCheckout={openPaymentDialog}
    />
  </div>
  
  <POSFooter
    itemCount={cartItems.length}
    onHoldOrder={holdOrder}
    onRecallOrder={openHeldOrders}
    onSuspendSession={suspendSession}
  />
</POSLayout>

// Dialog de pago
<PaymentDialog
  open={isPaymentOpen}
  onClose={closePaymentDialog}
  total={total}
  customer={selectedCustomer}
  onPayment={(method, amount) => processPayment(method, amount)}
  availablePaymentMethods={['CASH', 'CARD', 'TRANSFER']}
/>
```

### 6.6 Reports

```typescript
// Dashboard principal
<ReportsDashboard
  dateRange={dateRange}
  onDateRangeChange={setDateRange}
  storeFilter={selectedStore}
  onStoreFilterChange={setSelectedStore}
/>

// Gráficos
<SalesChart 
  data={salesData} 
  type="line"
  groupBy="day"
  showTrend
/>

<SalesByProductChart
  data={salesByProduct}
  type="bar"
  limit={10}
/>

<PaymentMethodsPieChart
  data={paymentMethods}
/>

<InventoryValueGauge
  value={inventoryValue}
  maxValue={maxValue}
/>

// Tabla de resumen
<TransactionsTable
  data={transactions}
  columns={transactionColumns}
  exportable
  onExport={(format) => exportReport(format)}
/>
```

### 6.7 Consignment

```typescript
// Lista de consignaciones con tabs de estado
<ConsignmentList
  statusFilter={statusFilter}
  onStatusChange={setStatusFilter}
  consignments={consignments}
  onSelect={openDetail}
/>

// Detalle de consignación
<ConsignmentDetail
  consignment={consignment}
  partner={partner}
  items={stockItems}
  movements={movements}
  onRegisterSale={() => openSaleDialog()}
  onRegisterReturn={() => openReturnDialog()}
  onLiquidate={() => openLiquidationDialog()}
  onCancel={() => handleCancel()}
/>

// Progress de cantidades
<ConsignmentProgress
  delivered={consignment.deliveredQuantity}
  sold={consignment.soldQuantity}
  returned={consignment.returnedQuantity}
  unit={product.unit}
/>

// Dialog de registro de venta
<RegisterSaleDialog
  open={isSaleDialogOpen}
  onClose={closeSaleDialog}
  items={availableItems}
  onSubmit={handleRegisterSale}
/>
```

---

## 7. Hooks Personalizados

### 7.1 Auth

```typescript
// useAuth - Gestión de autenticación
function useAuth() {
  const { user, session, isLoading, isAuthenticated } = useAuthState();
  const { login, register, logout, resetPassword } = useAuthActions();
  
  return {
    user,
    session,
    isLoading,
    isAuthenticated,
    login: (email, password) => login(email, password),
    register: (data: RegisterData) => register(data),
    logout: () => logout(),
    resetPassword: (email) => resetPassword(email),
  };
}

// useOrganization - Gestión de organización activa
function useOrganization() {
  const { 
    organizations, 
    currentOrganization, 
    isLoading 
  } = useOrganizationState();
  const { 
    selectOrganization, 
    createOrganization, 
    updateOrganization 
  } = useOrganizationActions();
  
  return {
    organizations,
    currentOrganization,
    isLoading,
    selectOrganization,
    createOrganization,
    updateOrganization,
  };
}

// useStore - Gestión de tienda activa
function useStore() {
  const { 
    stores, 
    currentStore, 
    storesWithAccess 
  } = useStoreState();
  const { selectStore } = useStoreActions();
  
  return {
    stores,
    currentStore,
    storesWithAccess,
    selectStore,
  };
}

// usePermissions - Gestión de permisos
function usePermissions() {
  const { 
    permissions, 
    role, 
    isLoading 
  } = usePermissionsState();
  
  const hasPermission = (permission: string) => {
    return permissions.includes(permission);
  };
  
  const hasAnyPermission = (perms: string[]) => {
    return perms.some(p => permissions.includes(p));
  };
  
  const hasAllPermissions = (perms: string[]) => {
    return perms.every(p => permissions.includes(p));
  };
  
  const isOwner = role === 'OWNER';
  const isAdmin = role === 'ADMIN' || isOwner;
  
  return {
    permissions,
    role,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isOwner,
    isAdmin,
  };
}
```

### 7.2 Data Fetching

```typescript
// useProducts - CRUD de productos
function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => productApi.list(filters),
    staleTime: 5 * 60 * 1000,
  });
}

function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.get(id),
    enabled: !!id,
  });
}

function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateProductInput) => productApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductInput }) =>
      productApi.update(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['product', updated.id], updated);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
```

### 7.3 Document Operations

```typescript
// useDocumentWorkflow - Workflow de documentos
function useDocumentWorkflow(type: 'offer' | 'preinvoice' | 'invoice') {
  const createMutation = useCreateDocument(type);
  const updateMutation = useUpdateDocument(type);
  const convertMutation = useConvertDocument(type);
  
  const create = async (data: DocumentInput) => {
    return createMutation.mutateAsync(data);
  };
  
  const update = async (id: string, data: Partial<DocumentInput>) => {
    return updateMutation.mutateAsync({ id, data });
  };
  
  const convert = async (id: string, toType: DocumentType) => {
    return convertMutation.mutateAsync({ id, toType });
  };
  
  return {
    create,
    update,
    convert,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isConverting: convertMutation.isPending,
  };
}
```

---

## 8. API Layer

### 8.1 Cliente Supabase

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// lib/api/client.ts
import { supabase } from '@/lib/supabase';
import type { Product, ProductInput } from '@/types';

export const productApi = {
  async list(filters?: ProductFilters): Promise<Product[]> {
    let query = supabase
      .from('products')
      .select('*, category:product_categories(*)')
      .eq('organization_id', filters?.organizationId)
      .eq('is_active', true)
      .order('name');
    
    if (filters?.storeId) {
      query = query.eq('store_id', filters.storeId);
    }
    
    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
    }
    
    if (filters?.lowStock) {
      query = query.lte('min_stock', filters.lowStockThreshold);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
  
  async get(id: string): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:product_categories(*), variants:product_variants(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },
  
  async create(input: ProductInput): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  
  async update(id: string, input: Partial<ProductInput>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id);
    if (error) throw error;
  },
};
```

### 8.2 Edge Functions

```typescript
// Reports - Sales
// supabase/functions/reports-sales/index.ts
Deno.serve(async (req) => {
  const { organizationId, storeId, startDate, endDate } = await req.json();
  
  const { data } = await supabase
    .from('invoices')
    .select(`
      *,
      items:invoice_items(*),
      customer:customers(*)
    `)
    .eq('organization_id', organizationId)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .eq('status', 'ISSUED');
  
  return Response.json({ data });
});

// Reports - Audit
// supabase/functions/reports-audit/index.ts
Deno.serve(async (req) => {
  const { organizationId, tableName, action, userId, startDate, endDate } = await req.json();
  
  const { data } = await supabase
    .from('audit_logs')
    .select('*, user:users(full_name)')
    .eq('organization_id', organizationId)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });
  
  return Response.json({ data });
});
```

---

## 9. Estructura del Proyecto

```
gestio-web/
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/
│   │   └── logo.svg
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── MobileNav.tsx
│   │   │   └── PageContainer.tsx
│   │   │
│   │   ├── forms/
│   │   │   ├── ProductForm.tsx
│   │   │   ├── CustomerForm.tsx
│   │   │   ├── InvoiceForm.tsx
│   │   │   ├── DocumentEditor.tsx
│   │   │   └── FormField.tsx
│   │   │
│   │   ├── tables/
│   │   │   ├── DataTable.tsx
│   │   │   ├── ProductTable.tsx
│   │   │   ├── CustomerTable.tsx
│   │   │   ├── InvoiceTable.tsx
│   │   │   └── ColumnHeader.tsx
│   │   │
│   │   ├── pos/
│   │   │   ├── POSLayout.tsx
│   │   │   ├── POSProductGrid.tsx
│   │   │   ├── POSCart.tsx
│   │   │   ├── POSCheckout.tsx
│   │   │   └── PaymentDialog.tsx
│   │   │
│   │   ├── charts/
│   │   │   ├── SalesChart.tsx
│   │   │   ├── InventoryPieChart.tsx
│   │   │   ├── PaymentMethodsChart.tsx
│   │   │   └── DashboardMetrics.tsx
│   │   │
│   │   ├── documents/
│   │   │   ├── DocumentWorkflow.tsx
│   │   │   ├── DocumentItemsTable.tsx
│   │   │   ├── DocumentSummary.tsx
│   │   │   ├── DocumentPrint.tsx
│   │   │   └── PaymentHistory.tsx
│   │   │
│   │   └── shared/
│   │       ├── StockBadge.tsx
│   │       ├── StatusBadge.tsx
│   │       ├── CurrencyDisplay.tsx
│   │       ├── DateRangePicker.tsx
│   │       ├── EmptyState.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── ConfirmDialog.tsx
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   └── VerifyEmailPage.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx
│   │   │
│   │   ├── inventory/
│   │   │   ├── ProductsPage.tsx
│   │   │   ├── ProductDetailPage.tsx
│   │   │   ├── CategoriesPage.tsx
│   │   │   ├── MovementsPage.tsx
│   │   │   └── TransfersPage.tsx
│   │   │
│   │   ├── customers/
│   │   │   ├── CustomersPage.tsx
│   │   │   ├── CustomerDetailPage.tsx
│   │   │   ├── SuppliersPage.tsx
│   │   │   └── CustomerAddressesPage.tsx
│   │   │
│   │   ├── billing/
│   │   │   ├── OffersPage.tsx
│   │   │   ├── OfferDetailPage.tsx
│   │   │   ├── PreInvoicesPage.tsx
│   │   │   ├── InvoicesPage.tsx
│   │   │   ├── InvoiceDetailPage.tsx
│   │   │   └── DocumentEditorPage.tsx
│   │   │
│   │   ├── stores/
│   │   │   ├── StoresPage.tsx
│   │   │   ├── StoreDetailPage.tsx
│   │   │   └── StoreAssignmentsPage.tsx
│   │   │
│   │   ├── consignments/
│   │   │   ├── ConsignmentsPage.tsx
│   │   │   ├── ConsignmentDetailPage.tsx
│   │   │   ├── NewConsignmentPage.tsx
│   │   │   └── PartnersPage.tsx
│   │   │
│   │   ├── cash-register/
│   │   │   ├── SessionsPage.tsx
│   │   │   ├── SessionDetailPage.tsx
│   │   │   └── MovementsPage.tsx
│   │   │
│   │   ├── teams/
│   │   │   ├── TeamsPage.tsx
│   │   │   ├── TeamDetailPage.tsx
│   │   │   ├── SchedulesPage.tsx
│   │   │   └── TasksPage.tsx
│   │   │
│   │   ├── reports/
│   │   │   ├── ReportsDashboardPage.tsx
│   │   │   ├── SalesReportPage.tsx
│   │   │   ├── InventoryReportPage.tsx
│   │   │   ├── FinancialReportPage.tsx
│   │   │   └── AuditLogPage.tsx
│   │   │
│   │   ├── pos/
│   │   │   └── POSPage.tsx
│   │   │
│   │   └── settings/
│   │       ├── SettingsLayout.tsx
│   │       ├── ProfilePage.tsx
│   │       ├── OrganizationPage.tsx
│   │       ├── MembersPage.tsx
│   │       ├── InvitationsPage.tsx
│   │       ├── PermissionsPage.tsx
│   │       ├── ExchangeRatesPage.tsx
│   │       └── PrinterPage.tsx
│   │
│   ├── lib/
│   │   ├── supabase.ts              # Cliente Supabase
│   │   ├── utils.ts                 # Utilidades (formatCurrency, etc.)
│   │   └── constants.ts             # Constantes de la app
│   │
│   ├── api/
│   │   ├── client.ts                # Cliente API base
│   │   ├── products.ts
│   │   ├── customers.ts
│   │   ├── invoices.ts
│   │   ├── stores.ts
│   │   ├── consignments.ts
│   │   ├── cash-register.ts
│   │   ├── teams.ts
│   │   └── reports.ts
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useOrganization.ts
│   │   ├── useStore.ts
│   │   ├── usePermissions.ts
│   │   ├── useProducts.ts
│   │   ├── useCustomers.ts
│   │   ├── useInvoices.ts
│   │   └── useToast.ts
│   │
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── uiStore.ts
│   │   └── posStore.ts
│   │
│   ├── types/
│   │   ├── database.ts              # Tipos generados de Supabase
│   │   ├── auth.ts
│   │   ├── products.ts
│   │   ├── customers.ts
│   │   ├── billing.ts
│   │   └── index.ts
│   │
│   ├── schemas/
│   │   ├── product.ts
│   │   ├── customer.ts
│   │   ├── invoice.ts
│   │   └── auth.ts
│   │
│   ├── validators/
│   │   ├── permissions.ts
│   │   └── navigation.ts
│   │
│   ├── router/
│   │   ├── AppRouter.tsx
│   │   ├── AuthRouter.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── PermissionRoute.tsx
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── supabase/
│   ├── migrations/
│   │   └── [copiar de gestiov2/supabase/migrations/]
│   │
│   └── functions/
│       ├── reports-sales/
│       │   └── index.ts
│       ├── reports-inventory/
│       │   └── index.ts
│       ├── reports-financial/
│       │   └── index.ts
│       ├── reports-audit/
│       │   └── index.ts
│       └── send-invitation/
│           └── index.ts
│
├── components.json                  # Config shadcn/ui
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
├── package.json
├── .env.example
└── README.md
```

---

## 10. Dependencias

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.24.0",
    
    "@supabase/supabase-js": "^2.45.0",
    "@tanstack/react-query": "^5.51.0",
    "@tanstack/react-table": "^8.19.0",
    
    "zustand": "^4.5.0",
    "react-hook-form": "^7.52.0",
    "@hookform/resolvers": "^3.9.0",
    "zod": "^3.23.0",
    
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.4.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-select": "^2.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-toast": "^1.2.0",
    "@radix-ui/react-tooltip": "^1.1.0",
    "@radix-ui/react-popover": "^1.1.0",
    "@radix-ui/react-avatar": "^1.1.0",
    "@radix-ui/react-separator": "^1.1.0",
    "lucide-react": "^0.400.0",
    
    "recharts": "^2.12.0",
    "date-fns": "^3.6.0",
    "currency.js": "^2.0.4",
    "papaparse": "^5.4.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.4.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "eslint": "^9.8.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "prettier": "^3.3.0",
    "prettier-plugin-tailwindcss": "^0.6.0"
  }
}
```

---

## 11. Migración de Pantallas Android → Web

| Android Screen | Web Route | Componente Principal |
|----------------|-----------|---------------------|
| `HomeScreen` | `/dashboard` | `DashboardPage.tsx` |
| `ProductListScreen` | `/inventory/products` | `ProductsPage.tsx` |
| `ProductDetailScreen` | `/inventory/products/:id` | `ProductDetailPage.tsx` |
| `CategoryListScreen` | `/inventory/categories` | `CategoriesPage.tsx` |
| `MovementListScreen` | `/inventory/movements` | `MovementsPage.tsx` |
| `CustomerListScreen` | `/customers/list` | `CustomersPage.tsx` |
| `CustomerDetailScreen` | `/customers/:id` | `CustomerDetailPage.tsx` |
| `DocumentListScreen` | `/billing/offers|invoices` | `OffersPage.tsx`, `InvoicesPage.tsx` |
| `DocumentDetailScreen` | `/billing/:type/:id` | `InvoiceDetailPage.tsx` |
| `DocumentEditorScreen` | `/billing/editor` | `DocumentEditorPage.tsx` |
| `StoreListScreen` | `/stores` | `StoresPage.tsx` |
| `StoreDetailScreen` | `/stores/:id` | `StoreDetailPage.tsx` |
| `ConsignmentListScreen` | `/consignments/list` | `ConsignmentsPage.tsx` |
| `ConsignmentDetailScreen` | `/consignments/:id` | `ConsignmentDetailPage.tsx` |
| `CashRegisterScreen` | `/cash-register/sessions` | `SessionsPage.tsx` |
| `TeamsScreen` | `/teams` | `TeamsPage.tsx` |
| `ScheduleScreen` | `/teams/schedules` | `SchedulesPage.tsx` |
| `ReportsScreen` | `/reports` | `ReportsDashboardPage.tsx` |
| `AuditLogScreen` | `/reports/audit` | `AuditLogPage.tsx` |
| `SettingsScreen` | `/settings` | Secciones en `SettingsLayout` |
| `MembersScreen` | `/settings/members` | `MembersPage.tsx` |
| `PermissionsScreen` | `/settings/permissions` | `PermissionsPage.tsx` |
| `PosKioskActivity` | `/pos` | `POSPage.tsx` |

---

## 12. Plan de Implementación

### Fase 1: Setup y Auth (Semana 1)
1. [ ] Scaffold proyecto Vite + React + TypeScript
2. [ ] Configurar TailwindCSS + shadcn/ui
3. [ ] Configurar Supabase client
4. [ ] Implementar Login/Register
5. [ ] Implementar logout y sesión persistente
6. [ ] Selector de organización

### Fase 2: Core Modules (Semana 2)
1. [ ] Dashboard con métricas básicas
2. [ ] Layout con Sidebar y Header
3. [ ] Navegación protegida con permisos
4. [ ] Selector de tienda activa
5. [ ] Configuración de perfil

### Fase 3: Inventory (Semana 3)
1. [ ] Lista de productos con DataTable
2. [ ] Crear/Editar producto
3. [ ] Variantes de producto
4. [ ] Categorías
5. [ ] Movimientos de stock
6. [ ] Búsqueda y filtros

### Fase 4: Customers (Semana 4)
1. [ ] Lista de clientes/proveedores
2. [ ] Crear/Editar cliente
3. [ ] Direcciones y contactos
4. [ ] Notas
5. [ ] Exportación CSV

### Fase 5: Billing (Semana 5)
1. [ ] Lista de documentos
2. [ ] Editor de documentos
3. [ ] Workflow Offer → Invoice
4. [ ] Pagos parciales
5. [ ] Versionado

### Fase 6: Stores & Consignments (Semana 6)
1. [ ] CRUD tiendas
2. [ ] Asignación usuarios-tiendas
3. [ ] Lista consignaciones
4. [ ] Registro ventas/devoluciones
5. [ ] Liquidación

### Fase 7: POS & Cash Register (Semana 7)
1. [ ] Interfaz POS completa
2. [ ] Carrito y checkout
3. [ ] Sesiones de caja
4. [ ] Movimientos de caja

### Fase 8: Reports & Polish (Semana 8)
1. [ ] Dashboards con gráficos
2. [ ] Reportes de ventas
3. [ ] Reportes financieros
4. [ ] Log de auditoría
5. [ ] Equipos y horarios
6. [ ] Testing y polish

---

## 13. Notas de Implementación

### 13.1 Sincronización con Backend Android

- Usar las **mismas tablas SQL** de `supabase/migrations/`
- Mantener **compatibilidad de tipos** con los DTOs del Android
- Reutilizar **Edge Functions** existentes o crear nuevos para web

### 13.2 Manejo de Monedas

- Todas las monedas se manejan como `string` (BigDecimal) para evitar problemas de precisión
- Usar la librería `currency.js` para cálculos en el frontend
- Formatear según la moneda seleccionada en la organización

### 13.3 Offline Support

- TanStack Query maneja cache y stale data
- Para offline completo, considerar agregar IndexedDB local
- Sincronizar cambios cuando vuelva la conexión

### 13.4 Responsive Design

- Sidebar colapsable en tablet
- Menú hamburguesa en móvil
- POS optimizado para tablets en landscape
- DataTables con scroll horizontal en móvil

---

## 14. Casos de Uso Reales y Flujos Operativos

### 14.1 Casos de Uso Reales por Tipo de Negocio

| Caso de uso | Actor principal | Frecuencia | Módulos involucrados | Resultado esperado |
|-------------|-----------------|------------|----------------------|--------------------|
| Apertura diaria de tienda y caja | Cajero / Encargado de tienda | Diario (inicio de turno) | Auth, Multistore, CashRegister | Sesión de caja abierta con montos iniciales por moneda y usuario responsable |
| Venta mostrador con cliente frecuente | Vendedor | Alta (todo el día) | POS, Customers, Inventory, Billing | Ticket o factura emitida, stock descontado y movimiento de caja registrado |
| Venta B2B con negociación | Comercial | Media | Customers, Billing (Offer/PreInvoice/Invoice), Reports | Flujo completo cotización a factura con trazabilidad y control de estados |
| Reposición por stock bajo | Responsable de inventario | Diario | Inventory, Reports, Stores | Productos críticos detectados y ajustados o transferidos entre tiendas |
| Cierre de caja con descuadre | Cajero / Supervisor | Diario (cierre de turno) | CashRegister, Permissions, Reports, Audit | Sesión cerrada con diferencias documentadas y evidencia para revisión |
| Consignación con partner externo | Gestor de consignación | Semanal | Consignment, Inventory, Customers, Billing | Entrega, venta, devolución y liquidación registradas por estado |
| Gestión de equipo y turnos | RRHH / Administrador | Semanal | Teams, Settings, Permissions | Horarios activos, tareas asignadas y responsables por tienda |
| Revisión gerencial de desempeño | Owner / Admin | Diario/Semanal | Dashboard, Reports, Audit | Visión consolidada de ventas, margen, caja y eventos críticos |

### 14.2 Flujos de Trabajo Reales (End-to-End)

#### Flujo A: Venta Rápida en POS (mostrador)

1. El cajero inicia sesión y selecciona organización/tienda activa.
2. Abre una sesión de caja con montos iniciales por moneda.
3. En POS busca productos por nombre, SKU o categoría y agrega al carrito.
4. Opcionalmente asocia cliente para historial y saldo.
5. Aplica descuentos según permiso del rol.
6. Confirma método de pago y procesa el checkout.
7. El sistema crea documento de venta, descuenta inventario y registra movimiento de caja.
8. El supervisor revisa en reportes el total de ventas por turno.

Reglas críticas:

- No permitir checkout sin sesión de caja abierta.
- Validar stock disponible antes de confirmar la venta.
- En multi-moneda, persistir moneda del documento y tasa aplicada.

#### Flujo B: Cotización a Factura (B2B)

1. El comercial crea una oferta para un cliente empresarial.
2. Ajusta precios, impuestos, descuentos y vigencia.
3. Envía oferta y cambia estado a SENT.
4. Si cliente acepta, convierte oferta a prefactura.
5. El admin aprueba prefactura y convierte a factura.
6. Se registra pago parcial o total según acuerdo.
7. Se actualiza payment status y balance del cliente.
8. Gerencia consulta margen y aging de cuentas por cobrar en reportes.

Reglas críticas:

- Mantener versionado de documento en cada transición.
- Bloquear edición de ciertos campos después de emitir factura.
- Toda conversión debe dejar traza en auditoría.

#### Flujo C: Reposición de Inventario entre Tiendas

1. Encargado revisa alertas de stock bajo por tienda.
2. Identifica tienda origen con sobrestock y tienda destino con quiebre.
3. Crea transferencia con productos, variantes y cantidades.
4. Tienda destino confirma recepción.
5. El sistema registra TRANSFER_OUT y TRANSFER_IN.
6. Se recalculan existencias y se refrescan dashboards.

Reglas críticas:

- Todas las operaciones deben estar filtradas por organization y store.
- No permitir transferencia con stock negativo.
- Registrar usuario y referencia de transferencia para auditoría.

#### Flujo D: Cierre de Caja y Control de Diferencias

1. Al final del turno, el cajero cuenta efectivo por denominaciones.
2. El sistema calcula esperado por moneda con base en movimientos.
3. El cajero confirma cierre y sistema calcula diferencias.
4. Si hay descuadre, se exige nota explicativa.
5. Se cierra sesión y se bloquean nuevos movimientos en esa caja.
6. Se exporta reporte CSV/PDF para control interno.

Reglas críticas:

- Solo roles con permiso REGISTER_CLOSE pueden cerrar.
- Registrar diferencias en audit log con metadata de sesión.
- No permitir cerrar dos veces la misma sesión.

#### Flujo E: Consignación con Liquidación

1. Se crea consignación con partner, productos y cantidades entregadas.
2. Durante el período, se registran ventas y devoluciones parciales.
3. El sistema actualiza delivered, sold y returned por item.
4. Al cierre del período se ejecuta liquidación y cálculo de comisión.
5. Se emite documento de liquidación y, si aplica, factura asociada.

Reglas críticas:

- Estado de consignación debe transicionar de forma controlada.
- No permitir ventas por encima de cantidad consignada.
- Conservar historial completo de movimientos por partner.

#### Flujo F: Gobierno Operativo y Auditoría

1. Owner configura roles y permisos por módulo.
2. Admin invita miembros y asigna tiendas permitidas.
3. Cada acción sensible (precio, anulación, cierre de caja) queda auditada.
4. Auditor filtra eventos por tabla, acción, usuario y fecha.
5. Reporta incidentes y define acciones correctivas.

Reglas críticas:

- Aplicar permission guards en UI y en capa de datos.
- Mantener trazabilidad old/new data para operaciones críticas.
- Respetar políticas RLS multi-organización y multi-tienda.

### 14.3 Flujos Operativos por Jornada

#### Inicio de jornada

1. Login y selección de organización/tienda.
2. Verificación de permisos efectivos.
3. Apertura de caja por turno.
4. Revisión rápida de alertas de stock y tareas pendientes.

#### Operación continua

1. Ventas en POS y/o facturación asistida.
2. Ajustes de inventario y transferencias según demanda.
3. Registro de incidencias en notas internas o auditoría.
4. Seguimiento de cobros parciales y cuentas pendientes.

#### Cierre de jornada

1. Conteo y cierre de caja con diferencias.
2. Revisión de ventas netas, método de pago y margen del día.
3. Exportación de reportes operativos.
4. Validación de pendientes para el turno siguiente.

### 14.4 Indicadores Operativos Recomendados (KPIs)

- Tiempo promedio de cobro en POS.
- Porcentaje de sesiones de caja con diferencia.
- Rotación de inventario por tienda y categoría.
- Tasa de conversión de oferta a factura.
- Días promedio de cobro de facturas.
- Porcentaje de consignaciones liquidadas en fecha.
- Incidencias de permisos y acciones anuladas por auditoría.

---

**Blueprint creado para Gestio Web - Versión 1.0**
