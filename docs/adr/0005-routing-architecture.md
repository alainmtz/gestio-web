# ADR-0005: React Router v7 with Permission-Protected Route Tree

**Status:** Accepted  
**Date:** 2026-04-11

## Context

The app needed client-side routing with authentication gating and permission-based access control across 14 modules with nested routes.

## Decision

Use **React Router v7** with a two-router architecture:

**AuthRouter** (`/auth/*`) — Unauthenticated routes
- Login, Register, Forgot Password, Reset Password

**AppRouter** (`/*`) — Authenticated routes, wrapped in `isAuthenticated` check
- All module routes with `<PermissionRoute>` guards
- Nested `<Outlet>` pattern for module sub-pages
- `<DashboardLayout>` as the outer layout wrapper
- `<SettingsLayout>` for settings sub-pages

**PermissionRoute** component:
- Accepts single `permission` or array of `permissions`
- Redirects to `/unauthorized` if check fails
- Supports OR logic (any permission grants access)

## Consequences

**Positive:**
- Clean separation of auth vs. app routes
- Permission checks at the route level, not per-page
- Nested layouts (`DashboardLayout`, `SettingsLayout`) for consistent UI chrome
- `Navigate` redirects for module index pages (e.g., `/inventory` → `/inventory/products`)

**Negative:**
- Upgraded from React Router v6 to v7 during development (breaking change)
- Permission checks are client-side only — RLS provides server-side enforcement
- Route tree must be manually maintained as new modules are added
