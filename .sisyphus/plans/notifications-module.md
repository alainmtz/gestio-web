# Notifications Module - Work Plan

## Context
- **Goal**: Role-based persistent notifications with realtime delivery
- **User confirmed**: In-App + Realtime, persistent BD table, dedicated page + improved header bell
- **Events**: Task/work assignment, status changes, low inventory, transfers, inventory movements, credit notes
- **Filtering**: Both organization role AND team role
- **Rules**: Defined by Atlas (user accepted)

## Gap Analysis (Resolved)

### Critical Gaps Addressed
1. **Current realtime fires for ALL org members** → New approach: DB table with user_id, each user sees only their notifications
2. **No persistent storage** → New `notifications` table with RLS
3. **Notification creation points identified**:
   - Work schedules: create, update status (confirm/complete/cancel)
   - Team tasks: create, assign, update
   - Inventory: low stock updates, movements, transfers
   - Billing: credit notes
4. **Multi-store users** → Notifications filtered by organization_id + user_id
5. **Org switching** → Notifications scoped to current organization

### Auto-Resolved Decisions
- **Historial**: 90 días (configurable via cleanup cron)
- **Batch vs Individual**: Individual por evento (más granular)
- **Notification creation**: App-side en mutaciones existentes (no DB triggers)
- **Permission**: Sin NOTIFICATION_VIEW - las notificaciones son personales, siempre accesibles
- **Max notifications**: 200 por usuario (RLS + pagination)

## Implementation Plan

### Phase 1: Database Schema
- [ ] **P1.1**: Create migration for `notifications` table
  - Columns: id (uuid), user_id (uuid FK profiles), organization_id (uuid FK organizations), type (text), title (text), message (text), href (text nullable), read (boolean default false), read_at (timestamptz nullable), metadata (jsonb nullable), created_at (timestamptz default now)
  - Indexes: user_id, organization_id, created_at, read
  - RLS: Users can only SELECT/UPDATE their own notifications (user_id = auth.uid())
  - Enable realtime publication
- [ ] **P1.2**: Update `notification_preferences` if needed (add categories for new event types)

### Phase 2: Notification Service
- [ ] **P2.1**: Create `src/api/notifications.ts`
  - `getNotifications(userId, orgId, { limit, offset, filter })` - paginated query
  - `markAsRead(notificationId)` - update read status
  - `markAllAsRead(userId, orgId)` - bulk update
  - `deleteNotification(notificationId)` - soft delete
  - `getUnreadCount(userId, orgId)` - count unread
  - `createNotification(notification)` - insert new notification
- [ ] **P2.2**: Create `src/hooks/useNotifications.ts`
  - useQuery for notifications list (paginated)
  - useQuery for unread count
  - useMutation for mark read, mark all read, delete
  - Realtime subscription to `notifications` table filtered by user_id
- [ ] **P2.3**: Update `src/stores/notificationStore.ts`
  - Extend NotificationType with new types: 'task_assigned', 'status_change', 'transfer', 'movement', 'credit_note'
  - Keep backward compatibility with existing types

### Phase 3: Notification Creation Points
- [ ] **P3.1**: Work Schedule notifications
  - In SchedulesPage create mutation: notify team leader + team members
  - In SchedulesPage status mutations: notify leader when member changes status, notify member when leader changes status
  - In TeamDetailPage: notify on schedule confirm/complete/cancel
- [ ] **P3.2**: Team Task notifications
  - In TeamsTasksPage create mutation: notify assignee
  - In TeamsTasksPage update mutation: notify on assignment change
- [ ] **P3.3**: Inventory notifications
  - Update useRealtimeNotifications.ts to create DB notifications (not just Zustand)
  - Low stock: notify store_manager of that store + org_admin/owner
  - Movements: notify store_manager of that store + org_admin/owner
  - Transfers: notify both store_managers + org_admin/owner
- [ ] **P3.4**: Credit Note notifications
  - In credit note creation/approval: notify org_admin/owner + store_manager

### Phase 4: UI - Notifications Page
- [ ] **P4.1**: Create `src/pages/notifications/NotificationsPage.tsx`
  - List of notifications with pagination
  - Filter by type (all, task, inventory, billing, transfer)
  - Filter by read/unread
  - Mark individual as read
  - Mark all as read
  - Delete individual notification
  - Clear all read notifications
  - Empty state
  - Mobile responsive
- [ ] **P4.2**: Create `src/pages/notifications/index.ts` barrel export

### Phase 5: UI - Header Bell Enhancement
- [ ] **P5.1**: Update `src/components/notifications/NotificationsPanel.tsx`
  - Fetch from DB instead of Zustand only
  - Show recent notifications (last 10)
  - Unread count from DB
  - "Ver todas" link to /notifications page
  - Keep Zustand for realtime updates
- [ ] **P5.2**: Update `src/components/layout/Header.tsx` if needed

### Phase 6: Routing & Navigation
- [ ] **P6.1**: Add route in `src/router/AppRouter.tsx`
  - `/notifications` route (no permission guard - personal feature)
- [ ] **P6.2**: Add sidebar item in `src/components/layout/Sidebar.tsx`
  - Bell icon with unread count badge
  - Link to `/notifications`

### Phase 7: Realtime Integration
- [ ] **P7.1**: Update `src/hooks/useRealtimeNotifications.ts`
  - Keep existing Zustand notifications for immediate feedback
  - Add DB notification creation alongside Zustand
  - Subscribe to `notifications` table for realtime updates
- [ ] **P7.2**: Update `src/components/layout/DashboardLayout.tsx` if needed

## Acceptance Criteria
- [ ] Notifications persist across page refreshes
- [ ] Realtime delivery within 2 seconds of event
- [ ] Users only see their own notifications (RLS verified)
- [ ] Unread count updates in real-time in header bell
- [ ] Notifications page loads with pagination (20 per page)
- [ ] Mark as read works (individual and bulk)
- [ ] Filter by type and read status works
- [ ] Mobile responsive design
- [ ] No breaking changes to existing notification system
- [ ] All 6 event types generate correct notifications based on role rules

## Technical Constraints
- Use existing Supabase client pattern (`@/lib/supabase`)
- Follow existing mutation patterns (react-query useMutation)
- Maintain backward compatibility with Zustand store
- RLS policies must be strict (user_id = auth.uid())
- No new dependencies
- Mobile-first responsive design

## Files to Create
- `supabase/migrations/XXXX_notifications_table.sql`
- `src/api/notifications.ts`
- `src/hooks/useNotifications.ts`
- `src/pages/notifications/NotificationsPage.tsx`
- `src/pages/notifications/index.ts`

## Files to Modify
- `src/stores/notificationStore.ts` - extend types
- `src/components/notifications/NotificationsPanel.tsx` - DB integration
- `src/hooks/useRealtimeNotifications.ts` - DB notification creation
- `src/router/AppRouter.tsx` - add route
- `src/components/layout/Sidebar.tsx` - add nav item
- `src/pages/teams/SchedulesPage.tsx` - add notification creation
- `src/pages/teams/TeamDetailPage.tsx` - add notification creation
- `src/pages/teams/TeamsTasksPage.tsx` - add notification creation
- `src/pages/inventory/MovementsPage.tsx` - add notification creation
- `src/pages/inventory/TransfersPage.tsx` - add notification creation
- `src/pages/inventory/LowStockPage.tsx` - add notification creation
- `src/pages/billing/InvoiceDetailPage.tsx` - add credit note notifications

## Notification Rules Matrix

| Event | org_owner | org_admin | store_manager | cashier | team_leader | team_member |
|-------|-----------|-----------|---------------|---------|-------------|-------------|
| Task assigned to team | ✅ summary | ✅ summary | - | - | ✅ detail | ✅ if member |
| Task assigned to user | - | - | - | - | - | ✅ |
| Work schedule created | ✅ | ✅ | - | - | ✅ if team | ✅ if member |
| Status changed (confirm) | - | - | - | - | ✅ | ✅ |
| Status changed (complete) | - | - | - | - | ✅ | ✅ |
| Status changed (cancel) | ✅ | ✅ | - | - | ✅ | ✅ |
| Low stock | ✅ all | ✅ all | ✅ own store | ✅ handled | - | - |
| Transfer initiated | ✅ | ✅ | ✅ origin+dest | - | - | - |
| Movement recorded | ✅ | ✅ | ✅ own store | - | - | - |
| Credit note created | ✅ | ✅ | ✅ own store | - | - | - |
