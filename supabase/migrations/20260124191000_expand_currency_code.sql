-- Expand currency code column to support longer codes like USDT_TRC20
-- Created: 2026-01-24

-- Increase currency code length from VARCHAR(3) to VARCHAR(20)
ALTER TABLE public.currencies 
ALTER COLUMN code TYPE VARCHAR(20);

-- Add comment
COMMENT ON COLUMN public.currencies.code IS 'Currency code - extended to support blockchain tokens like USDT_TRC20, BNB, etc.';
