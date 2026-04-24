-- Retention Policy: Eliminar logs de auditoría mayores a 2 años
-- Esta función se ejecuta diariamente via pg_cron

-- Función para limpiar logs antiguos
CREATE OR REPLACE FUNCTION public.clean_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
    cutoff_date TIMESTAMPTZ;
BEGIN
    -- Calcular fecha de corte (2 años atrás)
    cutoff_date := NOW() - INTERVAL '2 years';
    
    -- Contar registros a eliminar (para logging)
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Eliminar registros antiguos
    DELETE FROM public.audit_logs
    WHERE created_at < cutoff_date;
    
    deleted_count := ROW_COUNT;
    
    -- Log del resultado (visible en logs de Supabase)
    RAISE NOTICE 'Audit log cleanup: deleted % records older than %', deleted_count, cutoff_date;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Agregar comentario a la función
COMMENT ON FUNCTION public.clean_old_audit_logs() IS 
'Elimina registros de audit_logs mayores a 2 años. Debe ejecutarse diariamente via pg_cron.';

-- Programa pg_cron para ejecutar la limpieza diariamente a las 3:00 AM
-- Nota: Requiere extensión pg_cron habilitada en Supabase
-- SELECT cron.schedule('clean-old-audit-logs', '0 3 * * *', 'SELECT public.clean_old_audit_logs()');

-- Función alternativa para PostgreSQL sin pg_cron (usar desde Edge Functions)
CREATE OR REPLACE FUNCTION public.clean_old_audit_logs_manual()
RETURNS JSONB AS $$
DECLARE
    deleted_count INTEGER;
    cutoff_date TIMESTAMPTZ;
    start_time TIMESTAMPTZ := NOW();
BEGIN
    cutoff_date := NOW() - INTERVAL '2 years';
    
    DELETE FROM public.audit_logs
    WHERE created_at < cutoff_date;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN jsonb_build_object(
        'success', true,
        'deleted_count', deleted_count,
        'cutoff_date', cutoff_date,
        'duration_ms', EXTRACT(MILLISECONDS FROM NOW() - start_time)::INTEGER
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.clean_old_audit_logs_manual() IS 
'Versión manual de limpieza de audit logs. Retorna JSON con estadísticas. Seguro para llamar desde Edge Functions.';

-- Vista para ver estadísticas de retention
CREATE OR REPLACE VIEW public.audit_retention_stats AS
SELECT 
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as last_30_days,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '90 days') as last_90_days,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 year') as last_year,
    COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '2 years') as older_than_2_years,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record,
    pg_size_pretty(pg_total_relation_size('public.audit_logs')) as table_size
FROM public.audit_logs;

COMMENT ON VIEW public.audit_retention_stats IS 
'Vista con estadísticas de retención de audit_logs para monitoreo';

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.clean_old_audit_logs() TO service_role;
GRANT EXECUTE ON FUNCTION public.clean_old_audit_logs_manual() TO service_role;
GRANT SELECT ON public.audit_retention_stats TO authenticated;
