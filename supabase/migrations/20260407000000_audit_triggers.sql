-- Audit Triggers para captura automática de cambios
-- Este trigger captura INSERT, UPDATE y DELETE en las tablas monitoreadas

-- Función helper para capturar cambios
CREATE OR REPLACE FUNCTION public.capture_audit_changes()
RETURNS TRIGGER AS $$
DECLARE
    audit_row audit_logs%ROWTYPE;
    current_user_id TEXT;
    client_ip TEXT;
    client_ua TEXT;
BEGIN
    -- Obtener información del usuario actual
    current_user_id := COALESCE(
        (SELECT raw_user_meta_data->>'id' FROM auth.users WHERE id = auth.uid()),
        auth.uid()::TEXT
    );
    
    -- Obtener IP del cliente (si está disponible)
    client_ip := COALESCE(
        current_setting('request.headers', true)::JSON->>'x-forwarded-for',
        current_setting('request.headers', true)::JSON->>'cf-connecting-ip',
        'unknown'
    );
    
    -- Obtener User Agent
    client_ua := COALESCE(
        current_setting('request.headers', true)::JSON->>'user-agent',
        'unknown'
    );

    -- Determinar el tipo de acción
    IF TG_OP = 'INSERT' THEN
        audit_row.action := 'INSERT';
        audit_row.new_data := row_to_json(NEW);
        audit_row.old_data := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        audit_row.action := 'UPDATE';
        audit_row.new_data := row_to_json(NEW);
        audit_row.old_data := row_to_json(OLD);
    ELSIF TG_OP = 'DELETE' THEN
        audit_row.action := 'DELETE';
        audit_row.new_data := NULL;
        audit_row.old_data := row_to_json(OLD);
    END IF;

    -- Extraer organization_id si existe
    IF TG_TABLE_NAME IN ('products', 'customers', 'offers', 'pre_invoices', 'invoices', 
                         'cash_registers', 'consignments', 'inventory_entries', 'stores',
                         'categories', 'product_categories') THEN
        IF TG_OP = 'DELETE' THEN
            audit_row.organization_id := OLD.organization_id;
        ELSE
            audit_row.organization_id := NEW.organization_id;
        END IF;
    END IF;

    -- Campos comunes
    audit_row.table_name := TG_TABLE_NAME;
    audit_row.record_id := COALESCE(
        NEW.id::TEXT,
        OLD.id::TEXT,
        'unknown'
    );
    audit_row.user_id := COALESCE(current_user_id, 'system');
    audit_row.ip_address := client_ip;
    audit_row.user_agent := client_ua;

    -- Insertar en audit_logs
    INSERT INTO audit_logs (
        organization_id, user_id, table_name, record_id, action,
        old_data, new_data, ip_address, user_agent
    ) VALUES (
        audit_row.organization_id, audit_row.user_id, audit_row.table_name,
        audit_row.record_id, audit_row.action, audit_row.old_data,
        audit_row.new_data, audit_row.ip_address, audit_row.user_agent
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tablas a monitorear (descomenta las que necesites)
-- Products
CREATE TRIGGER products_audit_insert
    AFTER INSERT ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.capture_audit_changes();

CREATE TRIGGER products_audit_update
    AFTER UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.capture_audit_changes();

CREATE TRIGGER products_audit_delete
    AFTER DELETE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.capture_audit_changes();

-- Customers
CREATE TRIGGER customers_audit_insert
    AFTER INSERT ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.capture_audit_changes();

CREATE TRIGGER customers_audit_update
    AFTER UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.capture_audit_changes();

CREATE TRIGGER customers_audit_delete
    AFTER DELETE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.capture_audit_changes();

-- Offers (cotizaciones)
CREATE TRIGGER offers_audit_insert
    AFTER INSERT ON public.offers
    FOR EACH ROW EXECUTE FUNCTION public.capture_audit_changes();

CREATE TRIGGER offers_audit_update
    AFTER UPDATE ON public.offers
    FOR EACH ROW EXECUTE FUNCTION public.capture_audit_changes();

CREATE TRIGGER offers_audit_delete
    AFTER DELETE ON public.offers
    FOR EACH ROW EXECUTE FUNCTION public.capture_audit_changes();

-- Invoices
CREATE TRIGGER invoices_audit_insert
    AFTER INSERT ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.capture_audit_changes();

CREATE TRIGGER invoices_audit_update
    AFTER UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.capture_audit_changes();

CREATE TRIGGER invoices_audit_delete
    AFTER DELETE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.capture_audit_changes();

-- Cash Registers
CREATE TRIGGER cash_registers_audit_insert
    AFTER INSERT ON public.cash_registers
    FOR EACH ROW EXECUTE FUNCTION public.capture_audit_changes();

CREATE TRIGGER cash_registers_audit_update
    AFTER UPDATE ON public.cash_registers
    FOR EACH ROW EXECUTE FUNCTION public.capture_audit_changes();

CREATE TRIGGER cash_registers_audit_delete
    AFTER DELETE ON public.cash_registers
    FOR EACH ROW EXECUTE FUNCTION public.capture_audit_changes();

-- Consignments
CREATE TRIGGER consignments_audit_insert
    AFTER INSERT ON public.consignments
    FOR EACH ROW EXECUTE FUNCTION public.capture_audit_changes();

CREATE TRIGGER consignments_audit_update
    AFTER UPDATE ON public.consignments
    FOR EACH ROW EXECUTE FUNCTION public.capture_audit_changes();

CREATE TRIGGER consignments_audit_delete
    AFTER DELETE ON public.consignments
    FOR EACH ROW EXECUTE FUNCTION public.capture_audit_changes();

-- Stores
CREATE TRIGGER stores_audit_insert
    AFTER INSERT ON public.stores
    FOR EACH ROW EXECUTE FUNCTION public.capture_audit_changes();

CREATE TRIGGER stores_audit_update
    AFTER UPDATE ON public.stores
    FOR EACH ROW EXECUTE FUNCTION public.capture_audit_changes();

CREATE TRIGGER stores_audit_delete
    AFTER DELETE ON public.stores
    FOR EACH ROW EXECUTE FUNCTION public.capture_audit_changes();

COMMENT ON FUNCTION public.capture_audit_changes() IS 
'Función trigger para capturar automáticamente cambios en tablas monitoreadas y registrarlos en audit_logs';
