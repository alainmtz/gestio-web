# Gestio - Setup & Development Guide

## Requisitos Previos

- **Node.js** >= 20.x
- **pnpm** >= 8.x
- **Supabase project** (local o cloud)

## 1. Clonar y Configurar

```bash
git clone https://github.com/alainmtz/gestio-web.git
cd gestio-web
cp .env.example .env
```

Edita `.env` con tus credenciales de Supabase:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon
```

## 2. Instalar Dependencias

```bash
pnpm install
```

## 3. Base de Datos

### Opción A: Supabase Cloud (recomendado)

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Aplica las migraciones:
   ```bash
   pnpm exec supabase db push
   ```
   O ejecuta `supabase/migrations/20260122153500_complete_schema.sql` en el SQL editor.

### Opción B: Supabase Local

```bash
pnpm add -g supabase
supabase init
supabase start
```

## 4. Ejecutar

```bash
# Desarrollo
pnpm run dev

# Build
pnpm run build

# Preview del build
pnpm run preview

# Type check
pnpm run typecheck

# Lint
pnpm run lint

# Tests
pnpm run test
pnpm run test:watch
```

La app arranca en `http://localhost:3000`

## 5. Deploy en Vercel

1. Conecta el repo en [vercel.com](https://vercel.com)
2. Agrega las variables de entorno:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy automático en cada push a `main`

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Framework** | React 19 + TypeScript |
| **Build** | Vite 7 |
| **UI** | shadcn/ui (Radix + Tailwind) |
| **Estado** | Zustand + React Query |
| **Rutas** | React Router 7 |
| **Forms** | React Hook Form + Zod |
| **BD** | Supabase (PostgreSQL) |
| **Realtime** | Supabase Realtime |
| **Charts** | Recharts |
| **Tests** | Vitest + Testing Library |
| **Deploy** | Vercel |

## Estructura del Proyecto

```
src/
├── api/                    # Funciones de acceso a Supabase
├── components/
│   ├── layout/             # Sidebar, Header, DashboardLayout
│   ├── ui/                 # Componentes shadcn reutilizables
│   ├── notifications/      # NotificationsPanel
│   └── ...                 # Componentes por dominio
├── hooks/                  # Custom hooks (useNotifications, usePermissions, etc.)
├── lib/                    # Utils (supabase, toast, constants)
├── pages/                  # Páginas organizadas por módulo
│   ├── auth/
│   ├── billing/
│   ├── customers/
│   ├── dashboard/
│   ├── inventory/
│   ├── notifications/      # Módulo de notificaciones
│   ├── pos/
│   ├── reports/
│   ├── settings/
│   ├── stores/
│   ├── suppliers/
│   └── teams/
├── router/                 # AppRouter, PermissionRoute, ProtectedRoute
├── schemas/                # Zod schemas
└── stores/                 # Zustand stores (auth, notifications)
```

## Módulos

- **Dashboard** - Métricas y resumen
- **Inventario** - Productos, categorías, movimientos, transferencias, stock bajo
- **Clientes** - Gestión de clientes y proveedores
- **Facturación** - Ofertas, pre-facturas, facturas
- **Tiendas** - Multi-tienda con inventario independiente
- **Consignaciones** - Gestión de consignaciones
- **Caja** - Sesiones de caja y movimientos
- **Equipos** - Equipos de trabajo, horarios y tareas
- **Notificaciones** - Centro de notificaciones persistente con realtime
- **POS** - Punto de venta
- **Reportes** - Ventas, inventario, financiero, auditoría
- **Configuración** - Perfil, organización, miembros, permisos, tasas de cambio

## Sistema de Permisos

Los permisos se gestionan por roles:

| Rol | Acceso |
|-----|--------|
| **Owner** | Todos los permisos |
| **Admin** | Amplio acceso (todo excepto gestión de miembros) |
| **Member** | Acceso limitado (solo lectura + operaciones básicas) |

Se usa `hasPermission(PERMISSIONS.X)` para proteger UI y `PermissionRoute` para rutas.

## Notificaciones

Sistema de notificaciones persistentes con:
- Tabla `notifications` en Supabase con RLS
- Realtime vía Supabase subscriptions
- Página dedicada `/notifications` con filtros y paginación
- Campana en Header con badge de no leídas
- Creación automática en mutaciones (horarios, inventario, etc.)
- Reglas basadas en rol (owner/admin reciben todo, manager recibe su tienda, etc.)

## Convenciones de Código

- **Alias**: `@/` apunta a `src/`
- **Nomenclatura**: PascalCase para componentes, camelCase para funciones/hooks
- **UI**: shadcn/ui con `cn()` para clases condicionales
- **API**: Supabase queries directas, organizadas por entidad en `src/api/`
- **Estado server**: React Query con `useQuery`/`useMutation`
- **Estado client**: Zustand stores
- **Tipado**: TypeScript strict, sin `as any` ni `@ts-ignore`
