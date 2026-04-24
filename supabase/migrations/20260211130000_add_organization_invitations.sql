-- Migration: Add organization_invitations table
-- Description: Enables invitation workflow for organization members
-- Date: 2026-02-11

-- Create organization_invitations table
CREATE TABLE IF NOT EXISTS public.organization_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invitation_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_role CHECK (role IN ('owner', 'admin', 'member'))
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_invitations_org ON public.organization_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.organization_invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.organization_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.organization_invitations(organization_id, accepted_at) 
    WHERE accepted_at IS NULL;

-- Enable RLS
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can view all invitations for their organization
CREATE POLICY "Admins can view organization invitations"
    ON public.organization_invitations FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Admins can create invitations for their organization
CREATE POLICY "Admins can create invitations"
    ON public.organization_invitations FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Admins can update invitations (mark as accepted)
CREATE POLICY "Admins can update invitations"
    ON public.organization_invitations FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Admins can delete invitations (cancel)
CREATE POLICY "Admins can delete invitations"
    ON public.organization_invitations FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Add is_active column to organization_members if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'organization_members' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.organization_members ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Add invited_by column to organization_members if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'organization_members' 
        AND column_name = 'invited_by'
    ) THEN
        ALTER TABLE public.organization_members ADD COLUMN invited_by UUID REFERENCES auth.users(id);
    END IF;
END $$;
