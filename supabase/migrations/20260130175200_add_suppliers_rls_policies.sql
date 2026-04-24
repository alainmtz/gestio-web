-- Migration: Add RLS policies for suppliers table
-- Created: 2026-01-30
-- Description: Suppliers table has RLS enabled but no policies, blocking all operations
-- This adds the same policies as customers table for consistency

-- Drop existing policies if any (idempotent)
DROP POLICY IF EXISTS "Users can view suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Users can manage suppliers" ON public.suppliers;

-- Policy 1: Users can view suppliers from their organizations
CREATE POLICY "Users can view suppliers"
    ON public.suppliers FOR SELECT
    USING (organization_id = ANY(public.get_user_organization_ids()));

-- Policy 2: Users can manage (INSERT, UPDATE, DELETE) suppliers in their organizations
CREATE POLICY "Users can manage suppliers"
    ON public.suppliers FOR ALL
    USING (organization_id = ANY(public.get_user_organization_ids()));

-- Add helpful comments
COMMENT ON POLICY "Users can view suppliers" ON public.suppliers IS 
'Allows users to view suppliers from organizations they are members of';

COMMENT ON POLICY "Users can manage suppliers" ON public.suppliers IS 
'Allows users to create, update, and delete suppliers in their organizations';
