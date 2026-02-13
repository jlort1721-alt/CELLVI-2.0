-- COPIAR Y PEGAR EN EL SQL EDITOR DE SUPABASE DASHBOARD
-- Para habilitar el monitoreo avanzado de Cadena de Frío.

-- 1. Configuración de límites por vehículo
-- Usar esto para activar el monitoreo en un vehículo de prueba
UPDATE public.vehicles 
SET thermal_config = '{
    "enabled": true,
    "min_temp": 2.0,
    "max_temp": 8.0,
    "alert_delay_minutes": 1,
    "sensors": ["INTERNAL_PHARMA_01"]
}'::jsonb
WHERE plate = 'TEST-001'; -- Cambiar por una placa real si es necesario

-- 2. Trigger de Integridad Térmica (Asegura que esto ya se haya corrido via migración)
-- Esta función genera una alerta crítica en segundos si la temp sale de rango.
-- Ver: supabase/migrations/20260215000000_advanced_cold_chain.sql
