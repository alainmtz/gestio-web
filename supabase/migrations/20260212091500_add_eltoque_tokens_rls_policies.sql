-- ============================================================================
-- Migration: Add RLS Policies for organization_eltoque_tokens table
-- Date: 2026-02-12
-- Description: Enable RLS and define access policies for ElToque tokens per org
-- ============================================================================

-- Drop existing policies if any (idempotent)
DROP POLICY IF EXISTS "Users can view ElToque tokens" ON public.organization_eltoque_tokens;
DROP POLICY IF EXISTS "Admins can create ElToque tokens" ON public.organization_eltoque_tokens;
DROP POLICY IF EXISTS "Admins can update ElToque tokens" ON public.organization_eltoque_tokens;
DROP POLICY IF EXISTS "Admins can delete ElToque tokens" ON public.organization_eltoque_tokens;

-- SELECT: Any member of the organization can view tokens (read-only)
CREATE POLICY "Users can view ElToque tokens"
    ON public.organization_eltoque_tokens FOR SELECT
    USING (organization_id = ANY(public.get_user_organization_ids()));

-- INSERT: Only owners/admins can create tokens
CREATE POLICY "Admins can create ElToque tokens"
    ON public.organization_eltoque_tokens FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id
            FROM public.organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- UPDATE: Only owners/admins can update tokens
CREATE POLICY "Admins can update ElToque tokens"
    ON public.organization_eltoque_tokens FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id
            FROM public.organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- DELETE: Only owners/admins can delete tokens
CREATE POLICY "Admins can delete ElToque tokens"
    ON public.organization_eltoque_tokens FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id
            FROM public.organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Ensure RLS is enabled
DO $$
BEGIN
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'organization_eltoque_tokens') THEN
        ALTER TABLE public.organization_eltoque_tokens ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;
