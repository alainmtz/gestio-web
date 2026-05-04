# Bundle Size Optimization - Gestio Web

## TL;DR

> **Quick Summary**: Reduce ~1.69 MB single JS bundle to route-based code splitting with vendor chunks.
> 
> **Deliverables**: 
> - Route-based lazy loading via `React.lazy()` in AppRouter.tsx
> - Vendor chunk splitting via `manualChunks` in vite.config.ts
> - Loading fallback component for Suspense boundaries
> 
> **Estimated Effort**: Short
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: vite.config.ts → AppRouter.tsx conversion → Build verification

---

## Context

### Original Request
Optimizar el bundle size desde el último commit (`e2d8678` - fix: resolve all lint errors). El TODO.md lista "Bundle JS (~1.60 MB / ~425 KB gzip) — candidate for route-based code splitting" como pendiente.

### Interview Summary
**Key Discussions**:
- Build actual: 1 chunk `index-HwmhR_Li.js` de 1,689.67 kB (436.70 kB gzip)
- Vite warning: "Some chunks are larger than 500 kB after minification"
- Causa raíz: 44 imports estáticos de páginas en AppRouter.tsx (sin `React.lazy()`)
- vite.config.ts sin `build.rollupOptions.output.manualChunks`
- Dependencias pesadas: recharts, @supabase/supabase-js, lucide-react, radix-ui/*

**Research Findings**:
- AppRouter.tsx tiene todos los imports estáticos al inicio del archivo
- No hay uso de `lazy()` de React Router o `React.lazy()` en todo el proyecto
- Vite 7 soporta code splitting nativo con dynamic imports
- Target: initial load <200 KB gzip (solo auth + dashboard + layout)

### Metis Review
**Identified Gaps** (addressed):
- [Gap 1]: Suspense boundaries needed - Resolved: Crear LoadingFallback component
- [Gap 2]: PermissionRoute wrapping lazy components - Resolved: Lazy components inside existing PermissionRoute
- [Gap 3]: Test updates for lazy routes - Resolved: Add test verification task

---

## Work Objectives

### Core Objective
Reducir el tiempo de carga inicial dividiendo el bundle monolítico en chunks bajo demanda por ruta.

### Concrete Deliverables
- `vite.config.ts` actualizado con `manualChunks` para vendors
- `AppRouter.tsx` convertido a `React.lazy()` para todas las páginas
- Componente `LoadingFallback.tsx` para Suspense
- Build output: 15-20 chunks pequeños en lugar de 1 monolítico

### Definition of Done
- [ ] `npm run build` produce múltiples chunks JS
- [ ] Chunk principal <200 KB gzip
- [ ] Todas las rutas cargan correctamente (verificado manualmente)
- [ ] No regressions en lint ni typecheck

### Must Have
- Route-based code splitting con `React.lazy()`
- Vendor chunking para deps pesadas (recharts, supabase, lucide)
- Suspense boundaries con fallback UI

### Must NOT Have (Guardrails)
- NO tree-shaking manual de librerías (ya lo hace el bundler)
- NO eliminación de funcionalidades para reducir tamaño
- NO dynamic imports fuera de routing (hooks, utilidades, etc.)
- NO cambios en la lógica de negocio o UI

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Vitest + Testing Library)
- **Automated tests**: Tests-after (tareas de verificación)
- **Framework**: vitest
- **If TDD**: N/A

### QA Policy
Cada tarea DEBE incluir escenarios de QA ejecutados por agente (ver TODOs).
Evidencia guardada en `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright - Navigate, verify lazy chunk loaded
- **Build verification**: Use Bash - `npm run build`, inspect dist/assets/
- **Lint/Typecheck**: Use Bash - `npm run lint`, `npm run typecheck`

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately - foundation):
├── Task 1: Update vite.config.ts with manualChunks [quick]
└── Task 2: Create LoadingFallback component [quick]

Wave 2 (After Wave 1 - core routing changes, MAX PARALLEL):
├── Task 3: Convert Inventory routes to React.lazy() [quick]
├── Task 4: Convert Customer/Supplier routes to React.lazy() [quick]
├── Task 5: Convert Billing routes to React.lazy() [quick]
├── Task 6: Convert Store/Consignment routes to React.lazy() [quick]
├── Task 7: Convert Teams/CashRegister routes to React.lazy() [quick]
├── Task 8: Convert Reports/Settings/POS routes to React.lazy() [quick]
└── Task 9: Convert Auth/Dashboard/Notifications routes [quick]

Wave 3 (After Wave 2 - verification):
├── Task 10: Build and verify chunk output [quick]
├── Task 11: Run lint and typecheck [quick]
└── Task 12: Verify routes load (sample test) [quick]

Wave FINAL (After ALL tasks):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay
```

### Dependency Matrix

- **1-2**: - - 3-9, 1
- **3**: 1, 2 - 10, 2
- **4**: 1, 2 - 10, 2
- **5**: 1, 2 - 10, 2
- **6**: 1, 2 - 10, 2
- **7**: 1, 2 - 10, 2
- **8**: 1, 2 - 10, 2
- **9**: 1, 2 - 10, 2
- **10**: 3-9 - F1-F4, 3
- **11**: 3-9 - F1-F4, 3
- **12**: 3-9 - F1-F4, 3

### Agent Dispatch Summary

- **1**: **2** - T1 → `quick`, T2 → `quick`
- **2**: **7** - T3-T9 → `quick` (all same profile)
- **3**: **3** - T10-T12 → `quick`
- **FINAL**: **4** - F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

> Implementation + Test = ONE Task. Never separate.
> EVERY task MUST have: Recommended Agent Profile + Parallelization info + QA Scenarios.
> **A task WITHOUT QA Scenarios is INCOMPLETE. No exceptions.**

---

## TODOs

> Implementation + Test = ONE Task. Never separate.
> EVERY task MUST have: Recommended Agent Profile + Parallelization info + QA Scenarios.
> **A task WITHOUT QA Scenarios is INCOMPLETE. No exceptions.**

- [ ] 1. Update vite.config.ts with manualChunks and build optimization

  **What to do**:
  - Add `build.rollupOptions.output.manualChunks` to vite.config.ts
  - Split vendor chunks: `recharts`, `supabase`, `lucide-react`, `radix-ui`, `@tanstack/*`, `react-query`
  - Set `build.chunkSizeWarningLimit` to 1000 (or remove warning)
  - Keep existing plugins and resolve config intact

  **Must NOT do**:
  - Don't remove the react() plugin
  - Don't change the resolve.alias configuration
  - Don't add tree-shaking config (Vite handles this)

  **Recommended Agent Profile**:
  > Select category + skills based on task domain. Justify each choice.
  - **Category**: `quick`
    - Reason: Single config file change, no complex logic, well-documented Vite API
  - **Skills**: []
    - No additional skills needed for Vite config editing
  - **Skills Evaluated but Omitted**:
    - `vercel-react-best-practices`: Not needed, this is build config not React code

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Task 10 (build verification)
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `vite.config.ts:1-16` - Current Vite config structure to preserve

  **External References** (libraries and frameworks):
  - https://vitejs.dev/config/build-options.html#build-rollupoptions - manualChunks API docs
  - https://rollupjs.org/configuration-options/#output-manualchunks - Rollup manualChunks patterns

  **WHY Each Reference Matters** (explain the relevance):
  - vite.config.ts: Base structure to extend with build options
  - Vite docs: Official API for manualChunks configuration

  **Acceptance Criteria**:

  **If TDD (tests enabled):**
  - N/A - config change, no TDD needed

  **QA Scenarios (MANDATORY - task is INCOMPLETE without these):**

  ```
  Scenario: Vite config is valid and build works
    Tool: Bash
    Preconditions: vite.config.ts updated with manualChunks
    Steps:
      1. Run `npm run build` in project directory
      2. Verify build completes without config errors
      3. Check dist/assets/ has multiple JS files
    Expected Result: Build succeeds, multiple chunks generated
    Failure Indicators: Build fails with config error, single chunk output
    Evidence: .sisyphus/evidence/task-1-build-output.txt
  ```

  **Evidence to Capture:**
  - [ ] `sisyphus/evidence/task-1-build-output.txt` - Build log showing chunk creation
  - [ ] Screenshot/listing of dist/assets/ showing multiple files

  **Commit**: YES
  - Message: `chore(build): add manualChunks to vite.config.ts`
  - Files: `vite.config.ts`
  - Pre-commit: `npm run build`

- [ ] 2. Create LoadingFallback component for Suspense boundaries

  **What to do**:
  - Create `src/components/shared/LoadingFallback.tsx`
  - Simple spinner or skeleton UI with Tailwind CSS
  - Export default for use in AppRouter.tsx Suspense boundaries
  - Match app's existing UI style (shadcn/ui patterns)

  **Must NOT do**:
  - Don't add complex animation or heavy dependencies
  - Don't fetch data or perform side effects
  - Don't use router hooks (not inside a router context yet)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple UI component, no complex logic, follows existing patterns
  - **Skills**: []
    - No additional skills needed for simple component creation
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Overkill for a simple loading spinner

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Task 3-9 (router changes need this component)
  - **Blocked By**: None (can start immediately)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `src/components/shared/LoadingSpinner.tsx` - Existing loading component pattern
  - `src/components/ui/` - shadcn/ui component patterns

  **WHY Each Reference Matters**:
  - LoadingSpinner.tsx: Existing loading UI pattern to match
  - shadcn/ui: Component style guidelines

  **Acceptance Criteria**:
  - [ ] File created: `src/components/shared/LoadingFallback.tsx`
  - [ ] Component renders without errors
  - [ ] Uses Tailwind classes consistent with app theme

  **QA Scenarios (MANDATORY - task is INCOMPLETE without these):**

  ```
  Scenario: LoadingFallback renders correctly
    Tool: Bash (vitest)
    Preconditions: Component file created
    Steps:
      1. Run `npm run typecheck` to verify TypeScript validity
      2. Verify file exists at correct path
    Expected Result: No type errors, file exists
    Failure Indicators: Type errors, missing file
    Evidence: .sisyphus/evidence/task-2-typecheck.txt

  Scenario: LoadingFallback shows loading UI
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Navigate to any route with Suspense boundary
      2. Verify LoadingFallback appears during lazy load
    Expected Result: Loading UI visible during navigation
    Failure Indicators: No loading indicator shown
    Evidence: .sisyphus/evidence/task-2-loading-screenshot.png
  ```

  **Evidence to Capture:**
  - [ ] `sisyphus/evidence/task-2-typecheck.txt` - TypeScript check output
  - [ ] `sisyphus/evidence/task-2-loading-screenshot.png` - Loading UI screenshot

  **Commit**: YES
  - Message: `feat(components): add LoadingFallback for Suspense boundaries`
  - Files: `src/components/shared/LoadingFallback.tsx`
  - Pre-commit: `npm run lint`

- [ ] 3. Convert Inventory routes to React.lazy() in AppRouter.tsx

  **What to do**:
  - Change static imports to `lazy(() => import('@/pages/inventory/...'))` for:
    - ProductsPage, ProductDetailPage, CategoriesPage, MovementsPage, TransfersPage, LowStockPage
  - Wrap each route element in `<Suspense fallback={<LoadingFallback />}>`
  - Keep PermissionRoute wrapping intact
  - Remove static imports at top of file for these pages

  **Must NOT do**:
  - Don't change PermissionRoute logic
  - Don't modify page component internals
  - Don't lazy-load layout components (DashboardLayout, SettingsLayout)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Mechanical find-replace in single file, well-defined pattern
  - **Skills**: []
    - No additional skills needed for import changes
  - **Skills Evaluated but Omitted**:
    - `react:components`: Not needed, this is import modification not component creation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4-9)
  - **Blocks**: Task 10 (build verification)
  - **Blocked By**: Task 2 (LoadingFallback needed for Suspense)

  **References** (CRITICAL - Be Exhaustive):

  **Pattern References** (existing code to follow):
  - `src/router/AppRouter.tsx:1-10` - Current static imports to convert
  - `src/router/AppRouter.tsx:59-68` - Inventory route group to wrap

  **API/Type References** (contracts to implement against):
  - React.lazy() API: https://react.dev/reference/react/lazy

  **WHY Each Reference Matters**:
  - AppRouter.tsx: Exact file to modify, shows current structure
  - React.lazy docs: Correct API usage pattern

  **Acceptance Criteria**:
  - [ ] 6 inventory page imports converted to lazy()
  - [ ] Suspense boundaries added around route elements
  - [ ] Static imports removed from file top
  - [ ] `npm run lint` passes

  **QA Scenarios (MANDATORY - task is INCOMPLETE without these):**

  ```
  Scenario: Inventory routes load with lazy loading
    Tool: Playwright
    Preconditions: Dev server running, router updated
    Steps:
      1. Navigate to /inventory/products
      2. Verify ProductsPage loads correctly
      3. Navigate to /inventory/categories
      4. Verify CategoriesPage loads correctly
    Expected Result: Pages load on demand, no errors in console
    Failure Indicators: 404 on navigation, console errors
    Evidence: .sisyphus/evidence/task-3-inventory-routes.png

  Scenario: Lazy loading shows fallback
    Tool: Playwright
    Preconditions: Dev server running, slow network throttling
    Steps:
      1. Throttle network to Slow 3G
      2. Navigate to /inventory/products
      3. Verify LoadingFallback appears briefly
    Expected Result: LoadingFallback visible during chunk load
    Failure Indicators: No loading indicator, direct page load only
    Evidence: .sisyphus/evidence/task-3-fallback-visible.png
  ```

  **Evidence to Capture:**
  - [ ] `sisyphus/evidence/task-3-inventory-routes.png` - Screenshot of loaded page
  - [ ] `sisyphus/evidence/task-3-fallback-visible.png` - Loading state screenshot

  **Commit**: NO (grouped with other router changes)

- [ ] 4. Convert Customer and Supplier routes to React.lazy()

  **What to do**:
  - Convert to `lazy(() => import(...))` for:
    - CustomersPage, CustomerDetailPage (from @/pages/customers/)
    - SuppliersPage, SupplierDetailPage (from @/pages/suppliers/)
  - Add Suspense boundaries in route definitions
  - Remove static imports at top of AppRouter.tsx

  **Must NOT do**:
  - Don't modify the PermissionRoute wrapping
  - Don't change page component code

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - **Skills Evaluated but Omitted**: None

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 3, 5-9)
  - **Blocks**: Task 10
  - **Blocked By**: Task 2

  **References**:
  - `src/router/AppRouter.tsx:11-14` - Customer/Supplier imports
  - `src/router/AppRouter.tsx:70-80` - Route definitions to update

  **Acceptance Criteria**:
  - [ ] 4 page imports converted to lazy()
  - [ ] Suspense boundaries added
  - [ ] Lint passes

  **QA Scenarios**:
  ```
  Scenario: Customer routes lazy load
    Tool: Playwright
    Steps: Navigate to /customers/list, verify page loads
    Expected Result: Page loads correctly with lazy chunk
    Evidence: .sisyphus/evidence/task-4-customers.png
  ```

  **Commit**: NO (grouped)

- [ ] 5. Convert Billing routes to React.lazy()

  **What to do**:
  - Convert to lazy() for: OffersPage, OfferDetailPage, PreInvoicesPage, PreInvoiceDetailPage, InvoicesPage, InvoiceDetailPage
  - Add Suspense boundaries
  - Remove static imports

  **Must NOT do**:
  - Don't modify billing page internals
  - Don't change document workflow logic

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 10
  - **Blocked By**: Task 2

  **References**:
  - `src/router/AppRouter.tsx:15-22` - Billing imports
  - `src/router/AppRouter.tsx:82-93` - Billing routes

  **Acceptance Criteria**:
  - [ ] 6 billing page imports converted
  - [ ] Suspense boundaries added

  **QA Scenarios**:
  ```
  Scenario: Billing routes lazy load
    Tool: Playwright
    Steps: Navigate to /billing/offers, verify OffersPage loads
    Evidence: .sisyphus/evidence/task-5-billing.png
  ```

  **Commit**: NO (grouped)

- [ ] 6. Convert Store and Consignment routes to React.lazy()

  **What to do**:
  - Convert: StoresPage, StoreDetailPage, ConsignmentsPage, ConsignmentDetailPage, ConsignmentPartnersPage
  - Add Suspense boundaries
  - Remove static imports

  **Recommended Agent Profile**:
  - **Category**: `quick`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocked By**: Task 2

  **References**:
  - `src/router/AppRouter.tsx:21-25` - Store/Consignment imports
  - `src/router/AppRouter.tsx:95-106` - Route definitions

  **QA Scenarios**:
  ```
  Scenario: Store routes lazy load
    Tool: Playwright
    Steps: Navigate to /stores, verify StoresPage loads
    Evidence: .sisyphus/evidence/task-6-stores.png
  ```

  **Commit**: NO (grouped)

- [ ] 7. Convert Teams and Cash Register routes to React.lazy()

  **What to do**:
  - Convert: TeamsPage, TeamDetailPage, SchedulesPage, TeamsTasksPage, SessionsPage, SessionDetailPage
  - Add Suspense boundaries

  **Recommended Agent Profile**:
  - **Category**: `quick`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocked By**: Task 2

  **References**:
  - `src/router/AppRouter.tsx:26-31` - Teams/CashRegister imports
  - `src/router/AppRouter.tsx:108-121` - Route definitions

  **QA Scenarios**:
  ```
  Scenario: Teams routes lazy load
    Tool: Playwright
    Steps: Navigate to /teams, verify TeamsPage loads
    Evidence: .sisyphus/evidence/task-7-teams.png
  ```

  **Commit**: NO (grouped)

- [ ] 8. Convert Reports, Settings and POS routes to React.lazy()

  **What to do**:
  - Convert: ReportsDashboardPage, SalesReportPage, InventoryReportPage, FinancialReportPage, AuditLogPage
  - Convert: ProfilePage, OrganizationPage, MembersPage, PermissionsPage, ExchangeRatesPage
  - Convert: POSPage
  - Add Suspense boundaries

  **Recommended Agent Profile**:
  - **Category**: `quick`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocked By**: Task 2

  **References**:
  - `src/router/AppRouter.tsx:33-43` - Reports/Settings/POS imports
  - `src/router/AppRouter.tsx:123-144` - Route definitions

  **QA Scenarios**:
  ```
  Scenario: Reports routes lazy load
    Tool: Playwright
    Steps: Navigate to /reports, verify ReportsDashboardPage loads
    Evidence: .sisyphus/evidence/task-8-reports.png
  ```

  **Commit**: NO (grouped)

- [ ] 9. Convert Auth, Dashboard and Notifications routes to React.lazy()

  **What to do**:
  - Convert: DashboardPage, NotificationsPage, UnauthorizedPage
  - Note: LoginPage, RegisterPage, etc. are in AuthRouter.tsx (separate file)
  - Add Suspense boundaries for Dashboard and Notifications

  **Recommended Agent Profile**:
  - **Category**: `quick`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocked By**: Task 2

  **References**:
  - `src/router/AppRouter.tsx:4-6, 32, 44` - Dashboard/Notifications imports
  - `src/router/AppRouter.tsx:56-57, 123, 135` - Route definitions

  **QA Scenarios**:
  ```
  Scenario: Dashboard lazy loads
    Tool: Playwright
    Steps: Navigate to /dashboard after login, verify loads
    Evidence: .sisyphus/evidence/task-9-dashboard.png
  ```

  **Commit**: YES (grouped with all router changes)
  - Message: `refactor(router): lazy-load all page components with React.lazy()`
  - Files: `src/router/AppRouter.tsx`
  - Pre-commit: `npm run lint`

- [ ] 10. Build project and verify chunk output

  **What to do**:
  - Run `npm run build`
  - Verify dist/assets/ has 15+ JS chunks (not just 1)
  - Measure main chunk size (target: <200 KB gzip)
  - Document chunk sizes in build output

  **Must NOT do**:
  - Don't modify source code to artificially reduce size
  - Don't change the build command

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Tasks 1-9)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task F1-F4 (final verification)
  - **Blocked By**: Tasks 1-9

  **References**:
  - Build output from previous run: `dist/assets/` had 2 files (index.js + index.css)
  - Target: 15+ chunks after optimization

  **Acceptance Criteria**:
  - [ ] Build succeeds with `npm run build`
  - [ ] dist/assets/ contains 15+ JS files
  - [ ] Main chunk <200 KB gzip (or significantly reduced from 436 KB)
  - [ ] No build errors or warnings (except expected chunk size warnings)

  **QA Scenarios (MANDATORY - task is INCOMPLETE without these)**:

  ```
  Scenario: Build produces multiple chunks
    Tool: Bash
    Preconditions: Tasks 1-9 completed
    Steps:
      1. Run `npm run build 2>&1 | tee .sisyphus/evidence/task-10-build.log`
      2. List files: `ls -la dist/assets/*.js | wc -l`
      3. Check main chunk size: `ls -lh dist/assets/index-*.js`
    Expected Result: 15+ JS files, main chunk significantly smaller
    Failure Indicators: Still 1 JS file, main chunk still ~1.6 MB
    Evidence: .sisyphus/evidence/task-10-build.log
  ```

  **Evidence to Capture:**
  - [ ] `.sisyphus/evidence/task-10-build.log` - Full build output
  - [ ] `.sisyphus/evidence/task-10-chunk-list.txt` - List of generated chunks

  **Commit**: YES
  - Message: `test(build): verify code splitting and chunk output`
  - Files: Build output verification only
  - Pre-commit: `npm run build`

- [ ] 11. Run lint and typecheck verification

  **What to do**:
  - Run `npm run lint` - verify no new lint errors
  - Run `npm run typecheck` - verify no TypeScript errors
  - Check that lazy() imports don't cause type errors

  **Recommended Agent Profile**:
  - **Category**: `quick`

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 12)
  - **Parallel Group**: Wave 3
  - **Blocked By**: Tasks 1-9

  **Acceptance Criteria**:
  - [ ] `npm run lint` passes with no new errors
  - [ ] `npm run typecheck` passes

  **QA Scenarios**:
  ```
  Scenario: Lint and typecheck pass
    Tool: Bash
    Steps:
      1. Run `npm run lint 2>&1 | tee .sisyphus/evidence/task-11-lint.txt`
      2. Run `npm run typecheck 2>&1 | tee .sisyphus/evidence/task-11-typecheck.txt`
    Expected Result: Both pass with no errors
    Evidence: .sisyphus/evidence/task-11-lint.txt, task-11-typecheck.txt
  ```

  **Evidence to Capture:**
  - [ ] `.sisyphus/evidence/task-11-lint.txt`
  - [ ] `.sisyphus/evidence/task-11-typecheck.txt`

  **Commit**: NO (verification only)

- [ ] 12. Verify sample routes load correctly

  **What to do**:
  - Start dev server
  - Use Playwright to navigate to key routes
  - Verify pages load (not 404 or error)
  - Test: /dashboard, /inventory/products, /billing/offers, /reports

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`playwright`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 11)
  - **Parallel Group**: Wave 3
  - **Blocked By**: Tasks 1-9

  **QA Scenarios**:
  ```
  Scenario: Key routes load after lazy conversion
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Navigate to /dashboard - verify DashboardPage loads
      2. Navigate to /inventory/products - verify ProductsPage loads
      3. Navigate to /billing/offers - verify OffersPage loads
      4. Navigate to /reports - verify ReportsDashboardPage loads
    Expected Result: All pages load without errors
    Failure Indicators: 404, console errors, blank pages
    Evidence: .sisyphus/evidence/task-12-routes-*.png
  ```

  **Evidence to Capture:**
  - [ ] `.sisyphus/evidence/task-12-routes-dashboard.png`
  - [ ] `.sisyphus/evidence/task-12-routes-products.png`
  - [ ] `.sisyphus/evidence/task-12-routes-billing.png`

  **Commit**: NO (verification only)

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
>
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit` + linter + `npm run build`. Review all changed files for: `as any`, `@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp).
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill if UI)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (features working together, not isolation). Test edge cases: empty state, invalid input, rapid actions. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **1**: `chore(build): add manualChunks to vite.config.ts` - vite.config.ts, npm run build
- **2-9**: `refactor(router): lazy-load all page components with React.lazy()` - src/router/AppRouter.tsx, src/components/shared/LoadingFallback.tsx, npm run lint
- **10-12**: `test(build): verify code splitting and route loading` - dist/assets/ verification

---

## Success Criteria

### Verification Commands
```bash
npm run build  # Expected: Multiple JS chunks, main chunk <200 KB gzip
npm run lint   # Expected: No new warnings or errors
npm run typecheck  # Expected: No type errors
```

### Final Checklist
- [ ] All "Must Have" present (lazy loading, vendor chunks, suspense)
- [ ] All "Must NOT Have" absent (no features removed, no tree-shaking manual)
- [ ] All tests pass
- [ ] Build output shows 15+ chunks instead of 1
