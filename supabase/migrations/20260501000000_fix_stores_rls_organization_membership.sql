-- Migration: Fix stores RLS by ensuring organization creator is registered as active member
-- Issue: INSERT on stores fails because RLS requires user to be in organization_members with is_active=true
-- Root cause: on_organization_created() only initializes roles, never inserts creator as member

-- 1) Fix the on_organization_created trigger function to register the creator
CREATE OR REPLACE FUNCTION public.on_organization_created()
RETURNS TRIGGER AS $$
BEGIN
    -- Register the current auth user as owner of the new organization
    IF auth.uid() IS NOT NULL THEN
        INSERT INTO public.organization_members (organization_id, user_id, role, is_active)
        VALUES (NEW.id, auth.uid(), 'owner', true)
        ON CONFLICT (organization_id, user_id) DO NOTHING;
    END IF;

    -- Initialize roles for new organization
    PERFORM public.initialize_organization_roles(NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
