-- Add RLS Policies for product_categories table
-- This migration ensures that users can only create/read/update/delete categories
-- in organizations they belong to

-- SELECT: Users can view categories only from their organizations
CREATE POLICY "Users can view categories from their organizations"
    ON public.product_categories FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id
            FROM public.organization_members
            WHERE user_id = auth.uid()
        )
    );

-- INSERT: Users with inventory_manager role can create categories in their organization
CREATE POLICY "Inventory managers can create categories"
    ON public.product_categories FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id
            FROM public.organization_members
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin', 'inventory_manager')
        )
    );

-- UPDATE: Users with inventory_manager role can update categories
CREATE POLICY "Inventory managers can update categories"
    ON public.product_categories FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id
            FROM public.organization_members
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin', 'inventory_manager')
        )
    );

-- DELETE: Users with admin role can delete categories
CREATE POLICY "Admins can delete categories"
    ON public.product_categories FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id
            FROM public.organization_members
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_product_categories_org_id
    ON public.product_categories(organization_id);

CREATE INDEX IF NOT EXISTS idx_product_categories_parent_id
    ON public.product_categories(parent_id);
