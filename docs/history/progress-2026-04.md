# Progress History - Web App (Gestio v2)

## April 2026

### Session 27-28 April 2026

- Resolved pipeline block (`/home/alain/proyectos/WEB/package.json` empty causing `ERR_INVALID_PACKAGE_CONFIG`)
- Installed `jsdom` (29.0.2 → 29.1.0)
- Created `src/lib/errorToast.ts` for standardized error handling
- Applied error handling to: customers, products, stores, suppliers, movements, exchange rates, categories
- Expanded CRUD coverage in `CustomersPage.ui.test.tsx`
- Added auth routing tests: `src/App.auth-routing.test.tsx`, `src/router/ProtectedRoute.test.tsx`
- Fixed `DialogContent` accessibility warning in `CategoriesPage.tsx`
- Security fix: password change requires current password verification
- ESLint v9 flat config configured
- React 19 type compatibility for tests

**Final validation (27/04/2026):**
- `npm run lint -- --quiet` → OK
- `npm run typecheck` → OK
- `npm run test -- --run` → 18 files PASS, 199 tests PASS
- `npm run build` → exit 0, JS 1.60 MB / 425 KB gzip

### Session 28 April 2026

- `VITE_SUPABASE_ANON_KEY` confirmed present in `.env`
- Added `store_type` column to `stores` table
- Inserted demo store ("Tienda Principal", code T001)
- Fixed RLS on `stores` to allow INSERT for active members
- Sidebar: responsive design with mobile overlay, submenu expand on subroutes
- Login/logout verified working
- Navigation between modules verified

## Pre-April 2026

Initial web port from Android app. See [BLUEPRINT.md](../../BLUEPRINT.md) for architecture.
