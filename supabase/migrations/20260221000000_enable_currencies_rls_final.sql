-- ============================================================================
-- Migration: Enable RLS for currencies table (FINAL - Idempotent)
-- Date: 2026-02-21
-- Description: Habilita RLS y crea políticas para la tabla currencies.
--              Esta es una tabla de referencia global de solo lectura para
--              usuarios autenticados. Las modificaciones solo las puede hacer
--              el service_role.
-- ============================================================================

-- Habilitar RLS en la tabla currencies (idempotente)
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (idempotente)
DROP POLICY IF EXISTS "currencies_select_authenticated" ON public.currencies;
DROP POLICY IF EXISTS "currencies_insert_service_role" ON public.currencies;
DROP POLICY IF EXISTS "currencies_update_service_role" ON public.currencies;
DROP POLICY IF EXISTS "currencies_delete_service_role" ON public.currencies;

-- ============================================================================
-- SELECT Policy: Todos los usuarios autenticados pueden leer currencies
-- ============================================================================
CREATE POLICY "currencies_select_authenticated"
    ON public.currencies
    FOR SELECT
    TO authenticated
    USING (true);

-- ============================================================================
-- INSERT Policy: Solo service_role puede insertar nuevas monedas
-- ============================================================================
CREATE POLICY "currencies_insert_service_role"
    ON public.currencies
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- ============================================================================
-- UPDATE Policy: Solo service_role puede actualizar monedas
-- ============================================================================
CREATE POLICY "currencies_update_service_role"
    ON public.currencies
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- DELETE Policy: Solo service_role puede eliminar monedas
-- ============================================================================
CREATE POLICY "currencies_delete_service_role"
    ON public.currencies
    FOR DELETE
    TO service_role
    USING (true);

-- ============================================================================
-- Comentario explicativo
-- ============================================================================
COMMENT ON TABLE public.currencies IS 'Global currency catalog shared by all organizations. SELECT allowed for authenticated users; INSERT/UPDATE/DELETE restricted to service_role.';
