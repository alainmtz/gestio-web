-- Fix: Disable RLS on currencies table (global catalog, no organization_id)
-- This table is a shared catalog of all available currencies
-- Created: 2026-01-24

-- Disable RLS on currencies table
ALTER TABLE public.currencies DISABLE ROW LEVEL SECURITY;

-- Add comment explaining why RLS is disabled
COMMENT ON TABLE public.currencies IS 'Global currency catalog shared by all organizations. RLS disabled because this is a reference table without organization_id.';
