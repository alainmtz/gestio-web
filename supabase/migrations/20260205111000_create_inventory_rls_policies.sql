-- Create RLS policies for inventory and inventory_movements tables
-- Fecha: 2026-02-05
-- Razón: Tablas tienen RLS habilitado pero sin políticas, bloquean todo acceso

-- Primero eliminar políticas si existen (por si hay que reaplicar migración)
DROP POLICY IF EXISTS multi_tenant_inventory ON public.inventory;
DROP POLICY IF EXISTS multi_tenant_inventory_movements ON public.inventory_movements;

-- Política para inventory: usar profiles.organization_id
CREATE POLICY multi_tenant_inventory ON public.inventory
FOR ALL USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles
        WHERE id = auth.uid()
    )
);

-- Política para inventory_movements: usar profiles.organization_id
CREATE POLICY multi_tenant_inventory_movements ON public.inventory_movements
FOR ALL USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles
        WHERE id = auth.uid()
    )
);
