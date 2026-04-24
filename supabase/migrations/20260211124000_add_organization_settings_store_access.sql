-- Add organization settings table with store access configuration
-- Includes RLS policies and defaults

CREATE TABLE IF NOT EXISTS public.organization_settings (
    organization_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
    default_currency VARCHAR(3) DEFAULT 'CUP',
    default_language VARCHAR(10) DEFAULT 'es',
    default_timezone VARCHAR(100) DEFAULT 'America/Havana',
    fiscal_year_start_month INTEGER DEFAULT 1,
    enable_multi_currency BOOLEAN DEFAULT true,
    enable_inventory BOOLEAN DEFAULT true,
    enable_billing BOOLEAN DEFAULT true,
    enable_consignment BOOLEAN DEFAULT false,
    enable_teams BOOLEAN DEFAULT false,
    enable_pos_kiosk BOOLEAN DEFAULT false,
    allowed_store_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backfill settings for existing organizations
INSERT INTO public.organization_settings (organization_id)
SELECT id FROM public.organizations
ON CONFLICT (organization_id) DO NOTHING;

-- Trigger to keep updated_at in sync
DROP TRIGGER IF EXISTS update_organization_settings_updated_at ON public.organization_settings;
CREATE TRIGGER update_organization_settings_updated_at
    BEFORE UPDATE ON public.organization_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure settings row exists for new organizations
CREATE OR REPLACE FUNCTION public.create_organization_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.organization_settings (organization_id)
    VALUES (NEW.id)
    ON CONFLICT (organization_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_organization_settings_created ON public.organizations;
CREATE TRIGGER trigger_organization_settings_created
    AFTER INSERT ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.create_organization_settings();

-- RLS
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view organization settings"
    ON public.organization_settings FOR SELECT
    USING (organization_id = ANY(public.get_user_organization_ids()));

CREATE POLICY "Owners can update organization settings"
    ON public.organization_settings FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id
            FROM public.organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Owners can insert organization settings"
    ON public.organization_settings FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id
            FROM public.organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );
