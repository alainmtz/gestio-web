# ADR-0004: Granular Role-Based Permission System

**Status:** Accepted  
**Date:** 2026-02-11

## Context

Gestio supports multi-organization multi-tenant operation with three user roles (Owner, Admin, Member). Each role needs different access levels across 14+ modules.

## Decision

Implement a granular permission system with role-permission mapping:

**Three roles:** `OWNER`, `ADMIN`, `MEMBER`

**Granular permissions:** 50+ individual permissions scoped by module (e.g., `PRODUCT_VIEW`, `PRODUCT_CREATE`, `INVENTORY_ADJUST`, `REGISTER_OPEN`).

**Enforcement layers:**
1. **Route guards** — `<PermissionRoute>` checks permissions before rendering page
2. **UI gating** — `hasPermission()` hides/disables buttons and sections
3. **RLS policies** — database-level isolation ensures users can only access their organization's data

**Role mapping:**
- `OWNER` → all permissions
- `ADMIN` → management permissions minus `MEMBER_ROLE`/`MEMBER_REMOVE`
- `MEMBER` → view-only + basic operations (POS access, register open)

## Consequences

**Positive:**
- Fine-grained control — can restrict access per action, not just per page
- Defense in depth — UI gating + route guards + RLS
- Easy to add new permissions without restructuring
- Admin can delegate most operations without full owner access

**Negative:**
- Permission constants must be maintained in sync across hooks and routes
- Some routes need multiple permissions (OR logic), adding complexity
- No runtime permission checking on API calls (relies on RLS)
