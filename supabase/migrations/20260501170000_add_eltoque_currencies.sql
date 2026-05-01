-- Migration: Add missing currencies for ElToque sync (TRX, BTC, USDT, BNB)
-- ElToque returns TRX, BTC, USDT_TRC20, BNB but they were being silently discarded
-- because they did not exist in the currencies table.

-- 1) Widen code column to support longer codes (USDT_TRC20, etc.)
ALTER TABLE public.currencies
  ALTER COLUMN code TYPE VARCHAR(16),
  ALTER COLUMN name TYPE VARCHAR(128);

-- 2) Insert missing currencies
INSERT INTO public.currencies (code, name, symbol, decimal_places, is_active) VALUES
  ('TRX', 'TRON', 'TRX', 2, true),
  ('BTC', 'Bitcoin', '₿', 8, true),
  ('USDT', 'Tether USD (TRC20)', '₮', 2, true),
  ('BNB', 'Binance Coin', 'BNB', 8, true)
ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name,
      symbol = EXCLUDED.symbol,
      decimal_places = EXCLUDED.decimal_places;
