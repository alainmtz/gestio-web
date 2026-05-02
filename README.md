# Gestio Web — Sistema CRM Empresarial

**Gestio v2** is a web-based enterprise CRM system for multi-store inventory management, billing, POS, customer relations, team management, and financial reporting.

Web port of the [Gestio Android app](https://github.com/alainmtz/gestio-android), optimized for browser use (no mobile-only features like thermal printing, barcode scanning, or FCM push).

## Quick Start

```bash
git clone https://github.com/alainmtz/gestio-web.git
cd gestio-web
npm install
cp .env.example .env  # edit with your Supabase credentials
npm run dev
```

The app starts at `http://localhost:3000`. See [SETUP.md](./SETUP.md) for full instructions.

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 + TypeScript |
| **Build** | Vite 7 |
| **UI** | shadcn/ui (Radix + Tailwind CSS) |
| **State** | Zustand (client) + React Query (server) |
| **Routing** | React Router 7 |
| **Forms** | React Hook Form + Zod validation |
| **Charts** | Recharts |
| **Backend** | Supabase (Auth + PostgreSQL + Realtime) |
| **Tables** | TanStack Table |
| **Tests** | Vitest + Testing Library |
| **Deploy** | Vercel |

## Project Structure

```
src/
├── api/                    # Supabase data access functions
├── components/
│   ├── layout/             # Sidebar, Header, DashboardLayout
│   ├── ui/                 # shadcn/ui component primitives
│   ├── notifications/      # NotificationsPanel
│   └── ...                 # Domain-specific components
├── hooks/                  # Custom hooks per domain
├── lib/                    # Utils (supabase client, toast, constants, error handling)
├── pages/                  # Pages organized by module
│   ├── auth/               # Login, register, password recovery
│   ├── billing/            # Offers, pre-invoices, invoices
│   ├── cash-register/      # Cash sessions and movements
│   ├── consignments/       # Consignment management
│   ├── customers/          # Customer CRM
│   ├── dashboard/          # Metrics overview
│   ├── inventory/          # Products, categories, movements, transfers
│   ├── notifications/      # Notification center
│   ├── pos/                # Point of sale
│   ├── reports/            # Sales, inventory, financial, audit
│   ├── settings/           # Profile, org, members, permissions, exchange rates
│   ├── stores/             # Multi-store management
│   ├── suppliers/          # Supplier management
│   └── teams/              # Teams, schedules, tasks
├── router/                 # AppRouter, AuthRouter, PermissionRoute, ProtectedRoute
├── schemas/                # Zod validation schemas
├── stores/                 # Zustand stores (auth, notifications, pos, ui)
└── test/                   # Test setup and mocks
```

## Modules

| Module | Description |
|---|---|
| **Auth** | Login, register, password recovery, multi-organization support |
| **Dashboard** | Business metrics and summary |
| **Inventory** | Products, variants, categories, stock movements, transfers, low stock alerts |
| **Customers** | CRM with contacts, addresses, notes, tags, CSV export |
| **Suppliers** | Supplier management with contacts and addresses |
| **Billing** | Offer → PreInvoice → Invoice workflow, multi-currency, partial payments |
| **Stores** | Multi-store with independent inventory, currency per store |
| **Consignments** | Consignment stock with partners, sales/returns tracking, liquidation |
| **Cash Register** | Cash sessions, income/expense movements, closing reconciliation |
| **Teams** | Work teams, weekly schedules, task assignment |
| **Notifications** | Persistent notification center with Supabase Realtime |
| **POS** | Point-of-sale interface |
| **Reports** | Sales, inventory, financial dashboards + audit log |
| **Settings** | Profile, organization, members, permissions, exchange rates |

## Development

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint
npm run typecheck    # TypeScript type check
npm run test         # Run Vitest tests
npm run test:watch   # Watch mode
```

## Permission Model

Three roles with granular permissions:

| Role | Access |
|---|---|
| **Owner** | All permissions |
| **Admin** | Full management except member role changes |
| **Member** | View + basic operations (POS access, register open) |

Protected via `PermissionRoute` in routing and `hasPermission()` in UI.

## Documentation

- [SETUP.md](./SETUP.md) — Development environment setup
- [BLUEPRINT.md](./BLUEPRINT.md) — Full architecture specification (data models, routes, permissions)
- [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md) — Pre-release validation steps
- [CONTEXT.md](./CONTEXT.md) — Domain glossary and project terminology
- [docs/adr/](./docs/adr/) — Architectural decision records

## Deploy

Push to `main` triggers automatic Vercel deploy. Required environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
