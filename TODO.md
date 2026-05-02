# TODO - Web App (Gestio v2)

Last updated: 2026-05-02

## Completed

- [x] ESLint v9 flat config
- [x] Error handling standardization (`showErrorToast`) across all CRUD pages
- [x] Test coverage for critical flows (create/edit/delete)
- [x] Auth routing tests + protected route validation
- [x] Accessibility fixes (DialogDescription, password reauth)
- [x] Release checklist defined and validated
- [x] RLS policies for all tables
- [x] Inventory transfers module
- [x] Team schedules and tasks
- [x] Notifications with Supabase Realtime

## Pending

_No open items. Add new tasks here as they arise._

## Quality Debt

- Bundle JS (~1.60 MB / ~425 KB gzip) — candidate for route-based code splitting
- Lint warnings (non-blocking) — reduce incrementally
