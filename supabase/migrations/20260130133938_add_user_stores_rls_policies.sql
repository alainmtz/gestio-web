-- Add RLS policies for user_stores table

-- Policy: Users can read their own store assignments
CREATE POLICY "user_stores_select_own" ON public.user_stores
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own store assignments (for onboarding)
CREATE POLICY "user_stores_insert_own" ON public.user_stores
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own store assignments
CREATE POLICY "user_stores_update_own" ON public.user_stores
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own store assignments
CREATE POLICY "user_stores_delete_own" ON public.user_stores
    FOR DELETE
    USING (auth.uid() = user_id);
