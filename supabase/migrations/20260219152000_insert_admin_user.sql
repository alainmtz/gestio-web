-- ============================================================================  
-- Migración: Insertar usuario administrador superadmin
-- Date: 2026-02-19
-- Purpose: Create admin@fulltime.com user for authentication testing
-- ============================================================================

-- 1. Insert admin user into auth.users
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '550e8400-e29b-41d4-a716-446655440000',
    'authenticated',
    'authenticated',
    'admin@fulltime.com',
    extensions.crypt('admin123', extensions.gen_salt('bf')),
    now(),
    '',
    '',
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Admin Full Time"}',
    FALSE,
    now(),
    now()
) ON CONFLICT (id) DO NOTHING;

-- 2. Get the organization ID (use first existing org or create one)
DO $$
DECLARE
    v_org_id UUID;
BEGIN
    -- Check if our target org exists
    SELECT id INTO v_org_id FROM public.organizations 
    WHERE id = '985d95f2-18cb-4393-bd89-f696058df7de' LIMIT 1;
    
    -- If not, use the first existing organization
    IF v_org_id IS NULL THEN
        SELECT id INTO v_org_id FROM public.organizations LIMIT 1;
    END IF;
    
    -- If still no org, create the admin one
    IF v_org_id IS NULL THEN
        INSERT INTO public.organizations (id, name, slug, is_active, subscription_plan)
        VALUES ('985d95f2-18cb-4393-bd89-f696058df7de', 'Full Time Demo', 'fulltime-demo', true, 'free')
        ON CONFLICT (id) DO NOTHING;
        v_org_id := '985d95f2-18cb-4393-bd89-f696058df7de';
    END IF;
    
    -- 3. Update or create profile for admin user with the correct org
    INSERT INTO public.profiles (
        id,
        organization_id,
        full_name,
        language,
        timezone,
        is_kiosk_user,
        created_at,
        updated_at
    ) VALUES (
        '550e8400-e29b-41d4-a716-446655440000',
        v_org_id,
        'Admin Full Time',
        'es',
        'America/Caracas',
        false,
        now(),
        now()
    ) ON CONFLICT (id) DO UPDATE SET
        full_name = 'Admin Full Time',
        language = 'es',
        timezone = 'America/Caracas';

    -- 4. Ensure admin is owner of the organization
    INSERT INTO public.organization_members (
        organization_id,
        user_id,
        role,
        joined_at
    ) VALUES (
        v_org_id,
        '550e8400-e29b-41d4-a716-446655440000',
        'owner',
        now()
    ) ON CONFLICT (organization_id, user_id) DO UPDATE SET
        role = 'owner';

    -- 5. Grant access to the main store if it exists
    INSERT INTO public.user_stores (
        user_id,
        store_id,
        is_default,
        can_access_pos
    ) 
    SELECT 
        '550e8400-e29b-41d4-a716-446655440000',
        id,
        true,
        true
    FROM public.stores 
    WHERE organization_id = v_org_id
    LIMIT 1
    ON CONFLICT (user_id, store_id) DO NOTHING;

END $$;

-- ============================================================================
-- Summary
-- ============================================================================
-- Email: admin@fulltime.com
-- Password: admin123
-- Role: owner (organization owner with full permissions)
-- ============================================================================
