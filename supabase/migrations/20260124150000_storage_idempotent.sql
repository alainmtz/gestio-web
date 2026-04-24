-- ============================================================================
-- IDEMPOTENT MIGRATION: Storage Setup & Policies
-- Description: Ensures 'products' bucket exists, 'image_url' column exists,
--              and configures RLS policies safely.
-- ============================================================================

-- 1. Ensure 'products' bucket exists
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('products', 'products', true, false, 5242880, ARRAY['image/png', 'image/jpeg', 'image/jpg'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Ensure 'image_url' column exists in products table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'image_url'
    ) THEN
        ALTER TABLE public.products ADD COLUMN image_url TEXT;
    END IF;
END $$;

-- 3. Configure Policies (Drop first to ensure idempotency)

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Access for products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON storage.objects;

-- Policy 1: Anyone can view product images (public bucket)
CREATE POLICY "Public Access for products"
ON storage.objects FOR SELECT
USING ( bucket_id = 'products' );

-- Policy 2: Authenticated users can upload if they belong to the organization
-- Matches organization_id folder name: "org-uuid/filename.jpg"
CREATE POLICY "Authenticated users can upload products"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'products' AND
    (storage.foldername(name))[1] IN (
        SELECT organization_id::text 
        FROM public.organization_members 
        WHERE user_id = auth.uid()
    )
);

-- Policy 3: Users can update images in their organization folders
CREATE POLICY "Authenticated users can update products"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'products' AND
    (storage.foldername(name))[1] IN (
        SELECT organization_id::text 
        FROM public.organization_members 
        WHERE user_id = auth.uid()
    )
);

-- Policy 4: Users can delete images in their organization folders
CREATE POLICY "Authenticated users can delete products"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'products' AND
    (storage.foldername(name))[1] IN (
        SELECT organization_id::text 
        FROM public.organization_members 
        WHERE user_id = auth.uid()
    )
);
