# ADR-0003: Zustand for Client State, React Query for Server State

**Status:** Accepted  
**Date:** 2026-01-22

## Context

The app needed state management for two distinct concerns: server-state (API data, caching, mutations) and client-state (UI state, auth session, cart).

## Decision

Split state management by concern:

**Server state → TanStack Query (React Query v5)**
- Data fetching with `useQuery` — automatic caching, deduplication, refetching
- Mutations with `useMutation` — optimistic updates, error handling, cache invalidation
- Custom hooks (`useProducts`, `useCustomers`, `useStores`, etc.) encapsulate queries

**Client state → Zustand**
- `authStore` — authentication session, active organization, user profile
- `uiStore` — sidebar state, selected store, UI preferences
- `notificationStore` — notification center state
- `posStore` — POS cart and transaction state

## Consequences

**Positive:**
- Clear separation of concerns — no confusion about where state lives
- React Query handles cache lifecycle automatically
- Zustand is lightweight (~1KB) with minimal boilerplate
- Custom hooks provide a clean abstraction layer over Supabase queries
- No Redux boilerplate, no Context re-render issues

**Negative:**
- Two state management libraries to learn
- Must decide per-use-case which tool to use
- Zustand stores are mutable outside React — requires discipline
