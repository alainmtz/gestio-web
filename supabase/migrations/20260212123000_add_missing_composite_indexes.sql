-- ============================================================================
-- MISSING COMPOSITE INDEXES - TODO: Índices y performance (Supabase)
-- Fecha: 12 Febrero 2026
-- Propósito: completar índices compuestos pendientes para queries multi-tenant
-- ============================================================================

-- products(organization_id, store_id)
CREATE INDEX IF NOT EXISTS idx_products_org_store
ON public.products(organization_id, store_id);

-- customers(organization_id, is_active)
CREATE INDEX IF NOT EXISTS idx_customers_org_is_active
ON public.customers(organization_id, is_active);

-- invoices(organization_id, status)
CREATE INDEX IF NOT EXISTS idx_invoices_org_status
ON public.invoices(organization_id, status);
