-- Add RLS policies for currencies table (read-only global reference data)

-- Drop existing policies if any
DROP POLICY IF EXISTS "currencies_select_authenticated" ON public.currencies;

-- Allow authenticated users to read currencies (global reference data)
CREATE POLICY "currencies_select_authenticated"
ON public.currencies
FOR SELECT
TO authenticated
USING (true);

-- Note: currencies is a global reference table with no organization/store scope.
-- Only SELECT is allowed for authenticated users; INSERT/UPDATE/DELETE remain restricted.
