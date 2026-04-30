-- Create team_tasks table
CREATE TABLE IF NOT EXISTS team_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date date,
  assigned_to uuid REFERENCES organization_members(id) ON DELETE SET NULL,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_team_tasks_org ON team_tasks(organization_id);
CREATE INDEX idx_team_tasks_status ON team_tasks(status);
CREATE INDEX idx_team_tasks_assigned ON team_tasks(assigned_to);
CREATE INDEX idx_team_tasks_due_date ON team_tasks(due_date);
CREATE INDEX idx_team_tasks_team ON team_tasks(team_id);

ALTER TABLE team_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks in their organization"
  ON team_tasks FOR SELECT
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tasks in their organization"
  ON team_tasks FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks in their organization"
  ON team_tasks FOR UPDATE
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks in their organization"
  ON team_tasks FOR DELETE
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()
    )
  );
