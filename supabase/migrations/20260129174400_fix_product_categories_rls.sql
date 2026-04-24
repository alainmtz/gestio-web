-- Fix RLS Policies for product_categories to work with profiles.organization_id
-- Date: 2026-01-29

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view categories from their organizations" ON public.product_categories;
DROP POLICY IF EXISTS "Inventory managers can create categories" ON public.product_categories;
DROP POLICY IF EXISTS "Inventory managers can update categories" ON public.product_categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.product_categories;

-- SELECT: Users can view categories from organizations they belong to (via profile OR organization_members)
CREATE POLICY "Users can view categories from their organizations"
    ON public.product_categories FOR SELECT
    USING (
        organization_id IN (
            -- Check via profile.organization_id
            SELECT organization_id
            FROM public.profiles
            WHERE id = auth.uid()
            AND organization_id IS NOT NULL
            
            UNION
            
            -- Check via organization_members
            SELECT organization_id
            FROM public.organization_members
            WHERE user_id = auth.uid()
        )
    );

-- INSERT: Users can create categories in their organization
CREATE POLICY "Users can create categories in their organization"
    ON public.product_categories FOR INSERT
    WITH CHECK (
        organization_id IN (
            -- Check via profile.organization_id
            SELECT organization_id
            FROM public.profiles
            WHERE id = auth.uid()
            AND organization_id IS NOT NULL
            
            UNION
            
            -- Check via organization_members with appropriate roles
            SELECT organization_id
            FROM public.organization_members
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin', 'inventory_manager')
        )
    );

-- UPDATE: Users can update categories in their organization
CREATE POLICY "Users can update categories in their organization"
    ON public.product_categories FOR UPDATE
    USING (
        organization_id IN (
            -- Check via profile.organization_id
            SELECT organization_id
            FROM public.profiles
            WHERE id = auth.uid()
            AND organization_id IS NOT NULL
            
            UNION
            
            -- Check via organization_members with appropriate roles
            SELECT organization_id
            FROM public.organization_members
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin', 'inventory_manager')
        )
    );

-- DELETE: Only admins/owners can delete categories
CREATE POLICY "Admins can delete categories"
    ON public.product_categories FOR DELETE
    USING (
        organization_id IN (
            -- Check via organization_members with admin roles only
            SELECT organization_id
            FROM public.organization_members
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );
