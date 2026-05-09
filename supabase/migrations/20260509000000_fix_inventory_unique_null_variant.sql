-- Fix inventory unique constraint + RPC for NULL variant_id
--
-- Problem: PostgreSQL UNIQUE constraints treat NULLs as distinct,
-- so products without variants (variant_id IS NULL) get a NEW row
-- on every movement instead of updating the existing one.
-- This breaks stock validation and creates unbounded row growth.
--
-- Fix:
--   1. Consolidate existing duplicate rows
--   2. Replace UNIQUE constraint with NULLS NOT DISTINCT index
--   3. Fix handle_inventory_movement to SUM when checking stock

-- Step 1: Consolidate duplicate rows (variant_id IS NULL) into single rows
DO $$
DECLARE
    rec RECORD;
    keep_id UUID;
    total_qty NUMERIC(15,3);
    first_created TIMESTAMPTZ;
BEGIN
    FOR rec IN (
        SELECT organization_id, product_id, store_id
        FROM inventory
        WHERE variant_id IS NULL
        GROUP BY organization_id, product_id, store_id
        HAVING COUNT(*) > 1
    ) LOOP
        SELECT SUM(quantity), MIN(created_at)
        INTO total_qty, first_created
        FROM inventory
        WHERE organization_id = rec.organization_id
          AND product_id = rec.product_id
          AND store_id = rec.store_id
          AND variant_id IS NULL;

        SELECT id INTO keep_id
        FROM inventory
        WHERE organization_id = rec.organization_id
          AND product_id = rec.product_id
          AND store_id = rec.store_id
          AND variant_id IS NULL
          AND created_at = first_created
        ORDER BY id
        LIMIT 1;

        UPDATE inventory
        SET quantity = total_qty, updated_at = NOW()
        WHERE id = keep_id;

        DELETE FROM inventory
        WHERE organization_id = rec.organization_id
          AND product_id = rec.product_id
          AND store_id = rec.store_id
          AND variant_id IS NULL
          AND id != keep_id;
    END LOOP;
END $$;

-- Step 2: Replace UNIQUE constraint with NULLS NOT DISTINCT unique index
ALTER TABLE inventory
DROP CONSTRAINT IF EXISTS inventory_organization_id_product_id_variant_id_store_id_key;

CREATE UNIQUE INDEX inventory_org_prod_var_store_unique
ON inventory (organization_id, product_id, variant_id, store_id)
NULLS NOT DISTINCT;

-- Step 3: Fix handle_inventory_movement to SUM quantities for stock check
CREATE OR REPLACE FUNCTION public.handle_inventory_movement(
    p_organization_id uuid,
    p_store_id uuid,
    p_product_id uuid,
    p_variant_id uuid,
    p_movement_type character varying,
    p_quantity numeric,
    p_cost numeric,
    p_reference_type character varying,
    p_reference_id uuid,
    p_notes text,
    p_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    v_movement_id UUID;
    v_current_stock NUMERIC(15, 3);
    v_stock_change NUMERIC(15, 3);
BEGIN
    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'La cantidad debe ser mayor a 0';
    END IF;

    CASE p_movement_type
        WHEN 'ENTRADA_COMPRA', 'ENTRADA_DEVOLUCION', 'ENTRADA_CONSIGNACION', 'ENTRADA_AJUSTE', 'ENTRADA_INICIAL' THEN
            v_stock_change := p_quantity;
        WHEN 'SALIDA_VENTA', 'SALIDA_DEVOLUCION_PROVEEDOR', 'SALIDA_CONSIGNACION', 'SALIDA_AJUSTE' THEN
            v_stock_change := -p_quantity;
        ELSE
            RAISE EXCEPTION 'Tipo de movimiento desconocido: %', p_movement_type;
    END CASE;

    -- Use SUM to get total stock across all rows (handles legacy duplicates)
    SELECT COALESCE(SUM(quantity), 0) INTO v_current_stock
    FROM public.inventory
    WHERE organization_id = p_organization_id
      AND store_id = p_store_id
      AND product_id = p_product_id
      AND COALESCE(variant_id::text, '') = COALESCE(p_variant_id::text, '');

    IF v_stock_change < 0 AND (v_current_stock + v_stock_change) < 0 THEN
        RAISE EXCEPTION 'Stock insuficiente. Stock actual: %', v_current_stock;
    END IF;

    INSERT INTO public.inventory_movements (
        organization_id, store_id, product_id, variant_id,
        movement_type, quantity, cost, reference_type,
        reference_id, notes, user_id, created_at
    ) VALUES (
        p_organization_id, p_store_id, p_product_id, p_variant_id,
        p_movement_type, p_quantity, p_cost, p_reference_type,
        p_reference_id, p_notes, p_user_id, NOW()
    )
    RETURNING id INTO v_movement_id;

    INSERT INTO public.inventory (organization_id, store_id, product_id, variant_id, quantity, updated_at)
    VALUES (p_organization_id, p_store_id, p_product_id, p_variant_id, v_stock_change, NOW())
    ON CONFLICT (organization_id, product_id, variant_id, store_id)
    WHERE (variant_id IS NOT NULL OR (variant_id IS NULL AND TRUE))
    DO UPDATE SET
        quantity = inventory.quantity + v_stock_change,
        updated_at = NOW();

    RETURN v_movement_id;
END;
$function$;
