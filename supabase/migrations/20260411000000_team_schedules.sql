-- ============================================================================
-- Team Schedules - Sistema de horarios de equipos
-- Description: tabla para asignar facturas a equipos (trabajos) y gestionar confirmación
-- Date: 2026-04-11
-- ============================================================================

--Agregar campo assigned_team_id a invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS assigned_team_id UUID REFERENCES teams(id);

-- Tabla de horarios de equipos (trabajos)
CREATE TABLE IF NOT EXISTS team_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
    confirmed_by UUID REFERENCES auth.users(id),
    confirmed_at TIMESTAMPTZ,
    notes TEXT,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, invoice_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_team_schedules_team_id ON team_schedules(team_id);
CREATE INDEX IF NOT EXISTS idx_team_schedules_invoice_id ON team_schedules(invoice_id);
CREATE INDEX IF NOT EXISTS idx_team_schedules_status ON team_schedules(status);
CREATE INDEX IF NOT EXISTS idx_team_schedules_org ON team_schedules(organization_id);

-- RLS Policies para team_schedules
ALTER TABLE team_schedules ENABLE ROW LEVEL SECURITY;

-- Policy: miembros de la organización pueden ver
CREATE POLICY "team_schedules_org_view" ON team_schedules
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );

-- Policy: miembros de la organización pueden insertar
CREATE POLICY "team_schedules_org_insert" ON team_schedules
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );

-- Policy: miembros de la organización pueden actualizar
CREATE POLICY "team_schedules_org_update" ON team_schedules
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );

-- Policy: miembros de la organización pueden eliminar
CREATE POLICY "team_schedules_org_delete" ON team_schedules
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );

-- Agregar RLS a invoices para assigned_team_id
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Actualizar invoice RLS para permitir update de assigned_team_id
DROP POLICY IF EXISTS "invoices_team_update" ON invoices;
CREATE POLICY "invoices_team_update" ON invoices
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
        )
    );

COMMENT ON TABLE team_schedules IS 'Asignación de facturas a equipos (trabajos)';
COMMENT ON COLUMN team_schedules.status IS 'Estado: PENDING (pendiente), CONFIRMED (confirmado), COMPLETED (completado), CANCELLED (cancelado)';