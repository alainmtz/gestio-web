-- Migration: Add RLS policies for payments table
-- Created: 2026-05-06
-- Description: payments table has RLS enabled but no policies, blocking all operations

-- Drop existing policies if any (idempotent)
DROP POLICY IF EXISTS "Users can view payments" ON public.payments;
DROP POLICY IF EXISTS "Users can manage payments" ON public.payments;

-- Policy 1: Users can view payments from their organizations
CREATE POLICY "Users can view payments"
    ON public.payments FOR SELECT
    USING (organization_id = ANY(public.get_user_organization_ids()));

-- Policy 2: Users can manage (INSERT, UPDATE, DELETE) payments in their organizations
CREATE POLICY "Users can manage payments"
    ON public.payments FOR ALL
    USING (organization_id = ANY(public.get_user_organization_ids()));

-- Add helpful comments
COMMENT ON POLICY "Users can view payments" ON public.payments IS
'Allows users to view payments from organizations they are members of';

COMMENT ON POLICY "Users can manage payments" ON public.payments IS
'Allows users to create, update, and delete payments in their organizations';
