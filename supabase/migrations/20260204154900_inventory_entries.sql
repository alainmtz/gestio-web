-- Inventario: documentos de entradas y sus líneas
-- Fecha: 2026-02-04

-- Tabla principal de entradas
CREATE TABLE IF NOT EXISTS public.inventory_entries (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    entry_number TEXT NOT NULL,
    entry_date DATE NOT NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    supplier_name TEXT NOT NULL,
    reference_number TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'COMPLETED',
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Evitar duplicados por organización/tienda/año
CREATE UNIQUE INDEX IF NOT EXISTS inventory_entries_org_store_number_uidx
    ON public.inventory_entries (organization_id, store_id, entry_number);

CREATE INDEX IF NOT EXISTS inventory_entries_org_store_date_idx
    ON public.inventory_entries (organization_id, store_id, entry_date DESC);

CREATE INDEX IF NOT EXISTS inventory_entries_org_store_status_idx
    ON public.inventory_entries (organization_id, store_id, status);

-- Tabla de líneas de entrada
CREATE TABLE IF NOT EXISTS public.inventory_entry_items (
    id UUID PRIMARY KEY,
    entry_id UUID NOT NULL REFERENCES public.inventory_entries(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    product_name TEXT NOT NULL,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    sku TEXT,
    quantity NUMERIC(20, 6) NOT NULL,
    unit_cost NUMERIC(20, 6) NOT NULL,
    cost_currency TEXT NOT NULL DEFAULT 'CUP',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inventory_entry_items_entry_id_idx
    ON public.inventory_entry_items (entry_id);

CREATE INDEX IF NOT EXISTS inventory_entry_items_product_id_idx
    ON public.inventory_entry_items (product_id);

-- RLS
ALTER TABLE public.inventory_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_entry_items ENABLE ROW LEVEL SECURITY;

-- Políticas: multi-tenant por organization_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public'
        AND tablename = 'inventory_entries' AND policyname = 'multi_tenant_inventory_entries'
    ) THEN
        CREATE POLICY multi_tenant_inventory_entries ON public.inventory_entries
        FOR ALL USING (
            organization_id = (auth.jwt() ->> 'organization_id')::uuid
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public'
        AND tablename = 'inventory_entry_items' AND policyname = 'multi_tenant_inventory_entry_items'
    ) THEN
        CREATE POLICY multi_tenant_inventory_entry_items ON public.inventory_entry_items
        FOR ALL USING (
            entry_id IN (
                SELECT id FROM public.inventory_entries
                WHERE organization_id = (auth.jwt() ->> 'organization_id')::uuid
            )
        );
    END IF;
END $$;
