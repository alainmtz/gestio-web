-- RPC to load all permissions for a user in an organization
-- Returns TEXT[] of "module:action" keys matching DB_PERMISSION_KEY_MAP

CREATE OR REPLACE FUNCTION public.get_role_permissions(
    p_user_id UUID,
    p_organization_id UUID
)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_permissions TEXT[];
BEGIN
    SELECT ARRAY_AGG(DISTINCT p.module || ':' || p.action)
    INTO v_permissions
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id
      AND ur.organization_id = p_organization_id;

    RETURN COALESCE(v_permissions, ARRAY[]::TEXT[]);
END;
$$;

-- Grant execution to authenticated users and service_role
GRANT ALL ON FUNCTION public.get_role_permissions(UUID, UUID) TO authenticated;
GRANT ALL ON FUNCTION public.get_role_permissions(UUID, UUID) TO service_role;
