-- =====================================================
-- Add created_by column to consignment_stock for audit trail
-- Date: 2026-02-20
-- Description: Add audit column to track which user created each consignment record
-- =====================================================

-- Add created_by column to consignment_stock
ALTER TABLE public.consignment_stock 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for audit queries
CREATE INDEX IF NOT EXISTS idx_consignment_created_by 
ON public.consignment_stock(created_by);

-- Create index for combined filters
CREATE INDEX IF NOT EXISTS idx_consignment_org_created_by 
ON public.consignment_stock(organization_id, created_by);

-- Update schema comments
COMMENT ON COLUMN public.consignment_stock.created_by 
IS 'User ID who created the consignment record (audit trail)';
