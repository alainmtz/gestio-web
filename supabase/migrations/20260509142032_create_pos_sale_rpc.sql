-- Create POS Sale RPC
-- Atomically creates invoice, items, payment, and inventory movements for POS sales.
-- Handles store resolution: if store_id is NULL (all-stores mode), picks the best
-- store that has sufficient stock for all cart items.
-- Records payment extra fields for card/transfer methods.
-- Creates cash_movements entry (INCOME) for cash payments in an open session.
-- Patterns match billing.ts (createInvoice + addInvoicePayment) and
-- cashRegister.ts (addMovement).

CREATE OR REPLACE FUNCTION public.create_pos_sale(
    p_organization_id UUID,
    p_user_id UUID,
    p_store_id UUID DEFAULT NULL,
    p_customer_id UUID DEFAULT NULL,
    p_cash_session_id UUID DEFAULT NULL,
    p_payment_method TEXT DEFAULT 'cash',
    p_total NUMERIC DEFAULT 0,
    p_currency_id UUID DEFAULT NULL,
    p_items JSONB DEFAULT '[]'::JSONB,
    p_card_number TEXT DEFAULT NULL,
    p_customer_name TEXT DEFAULT NULL,
    p_identity_card TEXT DEFAULT NULL,
    p_transfer_code TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    v_invoice_id UUID;
    v_store_id UUID;
    v_item JSONB;
    v_document_number TEXT;
    v_year INT;
    v_count INT;
    v_unit_price NUMERIC;
    v_idx INT;
    v_line_subtotal NUMERIC;
    v_currency_code TEXT;
BEGIN
    -- Resolve currency code from currency_id
    v_currency_code := 'CUP';
    IF p_currency_id IS NOT NULL THEN
        SELECT code INTO v_currency_code FROM currencies WHERE id = p_currency_id;
        v_currency_code := COALESCE(v_currency_code, 'CUP');
    END IF;

    -- Resolve store
    IF p_store_id IS NULL THEN
        SELECT s.id INTO v_store_id
        FROM stores s
        WHERE s.organization_id = p_organization_id
          AND s.is_active = true
          AND NOT EXISTS (
              SELECT 1
              FROM jsonb_array_elements(p_items) AS ci
              WHERE NOT EXISTS (
                  SELECT 1
                  FROM inventory i
                  WHERE i.store_id = s.id
                    AND i.product_id = (ci->>'product_id')::UUID
                    AND (COALESCE(i.variant_id::text, '') = COALESCE((ci->>'variant_id')::text, ''))
                    AND i.quantity >= (ci->>'quantity')::INT
              )
          )
        LIMIT 1;

        IF v_store_id IS NULL THEN
            SELECT s.id INTO v_store_id
            FROM stores s
            WHERE s.organization_id = p_organization_id
              AND s.is_active = true
            ORDER BY (
                SELECT COUNT(*)
                FROM jsonb_array_elements(p_items) AS ci
                WHERE EXISTS (
                    SELECT 1
                    FROM inventory i
                    WHERE i.store_id = s.id
                      AND i.product_id = (ci->>'product_id')::UUID
                      AND (COALESCE(i.variant_id::text, '') = COALESCE((ci->>'variant_id')::text, ''))
                      AND i.quantity >= (ci->>'quantity')::INT
                )
            ) DESC
            LIMIT 1;
        END IF;

        IF v_store_id IS NULL THEN
            SELECT id INTO v_store_id
            FROM stores
            WHERE organization_id = p_organization_id
              AND is_active = true
            ORDER BY name
            LIMIT 1;
        END IF;
    ELSE
        v_store_id := p_store_id;
    END IF;

    IF v_store_id IS NULL THEN
        RAISE EXCEPTION 'No hay una tienda activa disponible para realizar la venta.';
    END IF;

    -- Generate document number
    v_year := EXTRACT(YEAR FROM NOW())::INT;
    SELECT COUNT(*) + 1 INTO v_count
    FROM invoices
    WHERE organization_id = p_organization_id
      AND EXTRACT(YEAR FROM created_at) = v_year;

    v_document_number := 'POS-' || v_year::TEXT || '-' || LPAD(v_count::TEXT, 4, '0');

    -- Create invoice (status=paid for POS — paid immediately)
    INSERT INTO invoices (
        organization_id, store_id, customer_id, number,
        status, payment_status, subtotal, tax_amount,
        discount_amount, total, paid_amount, balance,
        currency_id, exchange_rate, payment_method,
        created_by, created_at
    ) VALUES (
        p_organization_id, v_store_id, p_customer_id, v_document_number,
        'paid', 'paid', COALESCE(p_total, 0), 0,
        0, COALESCE(p_total, 0), COALESCE(p_total, 0), 0,
        p_currency_id, 1, p_payment_method,
        p_user_id, NOW()
    )
    RETURNING id INTO v_invoice_id;

    -- Create invoice items
    v_idx := 0;
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_idx := v_idx + 1;
        v_unit_price := COALESCE((v_item->>'unit_price')::NUMERIC, 0);
        v_line_subtotal := v_unit_price * GREATEST(1, (v_item->>'quantity')::INT);

        INSERT INTO invoice_items (
            invoice_id, line_number, product_id,
            description, quantity, unit_price,
            discount_percentage, tax_rate, subtotal,
            tax_amount, total
        ) VALUES (
            v_invoice_id,
            v_idx,
            COALESCE((v_item->>'product_id')::UUID, NULL),
            COALESCE(v_item->>'product_name', v_item->>'sku', 'Producto'),
            GREATEST(1, (v_item->>'quantity')::INT),
            v_unit_price,
            0,
            COALESCE((v_item->>'tax_rate')::NUMERIC, 0),
            v_line_subtotal,
            COALESCE((v_item->>'tax_amount')::NUMERIC, 0),
            COALESCE((v_item->>'total')::NUMERIC, v_line_subtotal)
        );
    END LOOP;

    -- Record payment (matches addInvoicePayment pattern)
    INSERT INTO payments (
        invoice_id, organization_id, amount, payment_method,
        currency_id, exchange_rate, transaction_date, created_by,
        card_number, customer_name, identity_card, transfer_code
    ) VALUES (
        v_invoice_id, p_organization_id, p_total, p_payment_method,
        p_currency_id, 1, CURRENT_DATE, p_user_id,
        p_card_number, p_customer_name, p_identity_card, p_transfer_code
    );

    -- Cash register movement (only for cash payments in an open session)
    -- Matches addMovement pattern: movement_type INCOME (uppercase), currency ISO code
    IF p_cash_session_id IS NOT NULL AND p_payment_method = 'cash' THEN
        INSERT INTO cash_movements (
            register_id, movement_type, currency, currency_id,
            amount, user_id, invoice_id, notes
        ) VALUES (
            p_cash_session_id, 'INCOME', v_currency_code, p_currency_id,
            p_total, p_user_id, v_invoice_id, 'Venta POS'
        );
    END IF;

    -- Inventory movements (matches createMovement('SALE') → SALIDA_VENTA)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        PERFORM public.handle_inventory_movement(
            p_organization_id,
            v_store_id,
            (v_item->>'product_id')::UUID,
            NULL,
            'SALIDA_VENTA',
            GREATEST(1, (v_item->>'quantity')::INT),
            COALESCE((v_item->>'cost')::NUMERIC, NULL),
            'invoice',
            v_invoice_id,
            'Venta POS',
            p_user_id
        );
    END LOOP;

    RETURN v_invoice_id;
END;
$function$;
