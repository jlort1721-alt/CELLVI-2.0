-- MIGRACIÓN FASE 7: OBSERVABILIDAD Y OPERACIONES
-- Objetivo: Vistas materializadas y consultas rápidas para monitoreo en tiempo real (Ops Dashboard).

-- 1. Resumen de Rendimiento de Integración (Integration Ops)
CREATE OR REPLACE VIEW public.ops_integration_summary AS
SELECT 
    type as job_type,
    status,
    COUNT(*) as total_jobs,
    ROUND(AVG(attempts), 2) as avg_retries,
    TO_CHAR(MIN(created_at), 'YYYY-MM-DD HH24:MI:SS') as oldest_pending,
    TO_CHAR(MAX(created_at), 'YYYY-MM-DD HH24:MI:SS') as newest_created,
    SUM(CASE WHEN status = 'dead_letter' THEN 1 ELSE 0 END) as failure_count
FROM public.integration_jobs
GROUP BY type, status;

-- 2. Tablero de Salud del Sistema (Health Check KPIs)
-- Usar esta vista para alimentar alertas automáticas (ej. si lagged_jobs > 100 -> PagerDuty)
CREATE OR REPLACE VIEW public.ops_system_health AS
SELECT
    NOW() as check_time,
    -- DLQ Spike: Si hay > 5 fallos fatales en la última hora, ALERTA CRÍTICA
    (SELECT COUNT(*) FROM integration_jobs WHERE status='dead_letter' AND created_at > NOW() - INTERVAL '1 hour') as dlq_last_hour,
    
    -- Lagged Jobs: Si hay > 50 trabajos encolados que debieron correr hace 5 min, ALERTA WORKER CAÍDO
    (SELECT COUNT(*) FROM integration_jobs WHERE status='queued' AND next_run_at < NOW() - INTERVAL '5 minutes') as jobs_lagged_5m,
    
    -- Audit Volume: Si hay > 1000 eventos de auditoría/hora, posible ataque o batch masivo no autorizado
    (SELECT COUNT(*) FROM audit_logs WHERE created_at > NOW() - INTERVAL '1 hour') as audit_events_last_hour;

-- 3. Detección de Anomalías de Comportamiento (User Behavior Analytics)
-- Detecta usuarios que modifican demasiados registros en poco tiempo (posible robo de cuenta o empleado descontento)
CREATE OR REPLACE VIEW public.ops_user_behavior_anomalies AS
SELECT
    actor_user_id,
    table_name,
    action,
    COUNT(*) as events_count,
    MIN(created_at) as first_event,
    MAX(created_at) as last_event
FROM public.audit_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY actor_user_id, table_name, action
HAVING COUNT(*) > 100 -- Umbral de sospecha (ajustable por tenant)
ORDER BY events_count DESC;

-- Permisos de lectura para rol 'service_role' o 'dashboard_monitor' (no anon)
GRANT SELECT ON public.ops_integration_summary TO service_role;
GRANT SELECT ON public.ops_system_health TO service_role;
GRANT SELECT ON public.ops_user_behavior_anomalies TO service_role;
