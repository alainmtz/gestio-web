-- ============================================================================
-- Migration: Add RLS Policies for exchange_rates table
-- Date: 2026-01-26
-- Description: Agrega políticas de Row Level Security para la tabla exchange_rates
--              que faltaban en la migración inicial
-- ============================================================================

-- Drop existing policies if any (idempotent)
DROP POLICY IF EXISTS "Users can view exchange rates" ON public.exchange_rates;
DROP POLICY IF EXISTS "Users can manage exchange rates" ON public.exchange_rates;
DROP POLICY IF EXISTS "Admins can manage exchange rates" ON public.exchange_rates;

-- Create policies for exchange_rates
-- SELECT: Users can view exchange rates from their organizations
CREATE POLICY "Users can view exchange rates"
    ON public.exchange_rates FOR SELECT
    USING (organization_id = ANY(public.get_user_organization_ids()));

-- INSERT: Only organization owners and admins can create exchange rates
CREATE POLICY "Admins can create exchange rates"
    ON public.exchange_rates FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- UPDATE: Only organization owners and admins can update exchange rates
CREATE POLICY "Admins can update exchange rates"
    ON public.exchange_rates FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- DELETE: Only organization owners and admins can delete exchange rates
CREATE POLICY "Admins can delete exchange rates"
    ON public.exchange_rates FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Verify RLS is enabled (should already be enabled from previous migration)
DO $$ 
BEGIN
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'exchange_rates') THEN
        ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;
