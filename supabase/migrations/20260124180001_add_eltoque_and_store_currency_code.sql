-- Migration: Agrega tabla para tokens por organización (ElToque) y columna currency_code en stores
-- Fecha: 2026-01-24 18:00

BEGIN;

-- 1) Tabla para almacenar tokens de proveedores externos por organización
CREATE TABLE IF NOT EXISTS public.organization_eltoque_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    provider varchar(100) NOT NULL DEFAULT 'eltoque',
    token text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    last_synced_at timestamptz NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_eltoque_organization_id ON public.organization_eltoque_tokens (organization_id);

-- 2) Agregar columna currency_code a stores para aceptar códigos como 'USD' desde el frontend
ALTER TABLE public.stores
    ADD COLUMN IF NOT EXISTS currency_code varchar(8);

-- 3) Función y trigger para sincronizar currency_id desde currency_code (si currency_code presente)
CREATE OR REPLACE FUNCTION public.sync_store_currency_code()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.currency_code IS NOT NULL THEN
        -- Intentar resolver currency_id a partir del código (case-insensitive)
        SELECT id INTO NEW.currency_id FROM public.currencies WHERE lower(code) = lower(NEW.currency_code) LIMIT 1;
    END IF;

    -- Actualizar timestamp
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_store_currency_code ON public.stores;
CREATE TRIGGER trg_sync_store_currency_code
BEFORE INSERT OR UPDATE ON public.stores
FOR EACH ROW EXECUTE FUNCTION public.sync_store_currency_code();

COMMIT;
