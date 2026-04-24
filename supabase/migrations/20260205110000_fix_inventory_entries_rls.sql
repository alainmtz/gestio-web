-- Fix RLS policies for inventory_entries to use profiles table instead of JWT
-- Fecha: 2026-02-05
-- Razón: auth.jwt() ->> 'organization_id' no existe, usar profiles.organization_id

-- Drop existing policies
DROP POLICY IF EXISTS multi_tenant_inventory_entries ON public.inventory_entries;
DROP POLICY IF EXISTS multi_tenant_inventory_entry_items ON public.inventory_entry_items;

-- Recrear política para inventory_entries usando profiles
CREATE POLICY multi_tenant_inventory_entries ON public.inventory_entries
FOR ALL USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles
        WHERE id = auth.uid()
    )
);

-- Recrear política para inventory_entry_items usando profiles
CREATE POLICY multi_tenant_inventory_entry_items ON public.inventory_entry_items
FOR ALL USING (
    entry_id IN (
        SELECT id FROM public.inventory_entries
        WHERE organization_id IN (
            SELECT organization_id FROM public.profiles
            WHERE id = auth.uid()
        )
    )
);

-- Verificación (comentar para no romper migración)
-- SELECT policyname, tablename, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- AND tablename IN ('inventory_entries', 'inventory_entry_items');
