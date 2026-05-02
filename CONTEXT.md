# CONTEXT.md — Gestio Web Domain Glossary

## Project

**Gestio v2** — Enterprise CRM system. Multi-store, multi-currency, multi-organization web application for inventory, billing, POS, and team management.

Port of the Android app, minus mobile-only features (thermal printing, barcode scanning, FCM push notifications, Bluetooth).

## Core Entities

### Organization

A company or business that uses Gestio. Everything is scoped to an organization — products, customers, stores, teams, billing. Users belong to one organization at a time but may be members of multiple.

- **Plan tiers:** `FREE`, `PRO`, `ENTERPRISE`
- **Not:** a "tenant" in SaaS terminology; "organization" is the canonical term.

### Store

A physical or virtual business location within an organization. Each store has its own inventory, currency, and cash register sessions.

- Stores can have a **parent store** (hierarchical).
- Users are assigned to stores via `UserStore` join table with POS access flag.
- **Not:** "branch" or "location" — use "store" exclusively.

### User / Member

- **User:** A person with a Supabase auth account and a `users` table record.
- **OrganizationMember:** A user's membership in an organization with a role (`OWNER`, `ADMIN`, `MEMBER`).
- A user can be a member of multiple organizations but has one **active organization** at a time.

### Customer

A business relationship with an external party. Two types: `INDIVIDUAL` and `BUSINESS`.

- Can have multiple **contacts** (named persons at the customer)
- Can have multiple **addresses** (billing, shipping, other)
- Can have **notes** (timestamped by user)
- Can have **tags** (custom labels for filtering)

### Supplier

Same model as customer but for procurement. Shares the contact and address pattern.

### Product

An item in inventory. Can have **variants** (e.g., size, color) and belongs to a **category** (hierarchical — categories can have parent categories).

- Stock is tracked per **store**, not globally.
- Has **min_stock** and **max_stock** thresholds for low stock alerts.
- **Attributes:** free-form key-value metadata on the product.

### Inventory Movement

A recorded change in stock balance. Ten types:

| Type | Meaning |
|---|---|
| `PURCHASE` | Stock received from supplier |
| `SALE` | Stock sold |
| `ADJUSTMENT` | Manual stock correction |
| `TRANSFER_IN` | Stock received from another store |
| `TRANSFER_OUT` | Stock sent to another store |
| `RETURN` | Stock returned by customer |
| `DAMAGE` | Damaged/destroyed stock |
| `CONSIGNMENT_IN` | Stock received on consignment |
| `CONSIGNMENT_OUT` | Stock sent on consignment |
| `OPENING` | Initial stock entry |

### Inventory Transfer

A stock transfer between two stores within the same organization. Creates a `TRANSFER_OUT` movement at the source and a `TRANSFER_IN` at the destination.

### Consignment

Stock sent to a partner (customer or supplier) for sale on behalf of the organization. Tracked via `Consignment` (header) and `ConsignmentStock` (line items). States: `ACTIVE`, `PARTIAL`, `COMPLETED`, `CANCELLED`.

### Billing Documents

Three-stage workflow:

1. **Offer** (`DRAFT` → `SENT` → `ACCEPTED`/`REJECTED`/`EXPIRED`) — A price quote to a customer.
2. **PreInvoice** (`DRAFT` → `PENDING_APPROVAL` → `APPROVED`/`REJECTED`) — An internal approval document.
3. **Invoice** (`DRAFT` → `ISSUED` → `PAID`/`CANCELLED`) — A finalized bill. Has `paymentStatus` (`PENDING`, `PARTIAL`, `PAID`).

Each has items, supports multi-currency, item-level and global discounts, and tax calculations.

**Not:** "quote" — use "offer". **Not:** "proforma" — use "pre-invoice".

### Cash Register Session

A cash handling session tied to a store and user. Status: `OPEN` or `CLOSED`. Tracks opening/closing amounts, expected vs actual, and difference.

Cash movements within a session: `INCOME`, `EXPENSE`, `DEPOSIT`, `WITHDRAWAL`.

### Team

A group of users within an organization. Has:

- **Members** with roles (`LEADER`, `MEMBER`)
- **Work schedules** — weekly recurring schedules per user/store
- **Tasks** — assignable work items with status (`PENDING`, `IN_PROGRESS`, `COMPLETED`) and priority (`LOW`, `MEDIUM`, `HIGH`)

### Notification

A persistent notification stored in the `notifications` table with Supabase Realtime subscription for live updates. Created automatically by mutations (schedule changes, inventory alerts, etc.).

### Audit Log

Automatic change tracking via Postgres triggers on all tables. Records `INSERT`, `UPDATE`, `DELETE` actions with old/new data. Retention policy enforced.

## Currencies

Four currencies supported:

| Code | Name | Symbol |
|---|---|---|
| `CUP` | Peso Cubano | ₱ |
| `USD` | Dólar Estadounidense | $ |
| `EUR` | Euro | € |
| `MLC` | Moneda Libremente Convertible | MLC |

Exchange rates are organization-specific and time-bounded (`validFrom` / `validUntil`).

## Permissions

Granular permissions scoped by module. Three roles:

| Role | Access Level |
|---|---|
| `OWNER` | All permissions |
| `ADMIN` | Management minus member role changes |
| `MEMBER` | Read-only + basic operations |

Permissions are checked via `hasPermission(PERMISSIONS.X)` in components and `<PermissionRoute>` for route guards.

## El Toque

Integration with "El Toque" — a Cuban exchange rate data service. Used to fetch and display currency rates. Tokens stored per organization.

## Key Terms to Avoid

| Avoid | Use Instead |
|---|---|
| "Quote" | "Offer" |
| "Proforma" | "PreInvoice" |
| "Branch" | "Store" |
| "Tenant" | "Organization" |
| "Item" (when referring to products) | "Product" |
| "Client" | "Customer" (external) or "Client" (web client) — be explicit |
