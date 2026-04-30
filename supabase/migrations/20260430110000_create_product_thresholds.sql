-- Create product_thresholds table for low stock alerts
CREATE TABLE IF NOT EXISTS product_thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  low_stock_threshold integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, store_id)
);

CREATE INDEX idx_product_thresholds_org ON product_thresholds(organization_id);
CREATE INDEX idx_product_thresholds_product ON product_thresholds(product_id);
CREATE INDEX idx_product_thresholds_store ON product_thresholds(store_id);

-- Enable RLS
ALTER TABLE product_thresholds ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view thresholds in their organization"
  ON product_thresholds FOR SELECT
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert thresholds in their organization"
  ON product_thresholds FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update thresholds in their organization"
  ON product_thresholds FOR UPDATE
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete thresholds in their organization"
  ON product_thresholds FOR DELETE
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()
    )
  );

-- Seed default thresholds (10) for all existing inventory items
INSERT INTO product_thresholds (organization_id, product_id, store_id, low_stock_threshold)
SELECT i.organization_id, i.product_id, i.store_id, 10
FROM inventory i
WHERE NOT EXISTS (
  SELECT 1 FROM product_thresholds pt
  WHERE pt.product_id = i.product_id AND pt.store_id = i.store_id
);
