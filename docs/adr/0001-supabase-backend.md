# ADR-0001: Supabase as Backend-as-a-Service

**Status:** Accepted  
**Date:** 2026-01-22

## Context

Gestio Web needed a backend for authentication, database, and realtime capabilities without managing infrastructure. The Android app already used Supabase, and the web port needed parity.

## Decision

Use **Supabase** (PostgreSQL + Auth + Realtime + Storage) as the complete backend layer.

- Direct Supabase JS client calls from the browser via `@supabase/supabase-js`
- No intermediate API layer (BFF or middleware)
- PostgreSQL database with Row-Level Security (RLS) policies for multi-tenant isolation
- Supabase Auth for user authentication with session persistence

## Consequences

**Positive:**
- Rapid development — no server-side code to maintain
- RLS enforces data isolation at the database level
- Realtime subscriptions built-in (used for notifications)
- Free tier sufficient for early development
- Same backend as Android app — data parity

**Negative:**
- Tight coupling to Supabase ecosystem
- No server-side validation beyond RLS
- Complex business logic must live client-side or in Edge Functions
- Bundle size includes full Supabase JS client
