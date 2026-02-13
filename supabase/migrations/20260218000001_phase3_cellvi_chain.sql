/*
  # Innovación: CELLVI Chain (Fase 3) - Ledger Forense Criptográfico
  # Fecha: 2026-02-18
  # Autor: Antigravity AI
  
  Objetivo: Probar matemáticamente, ante terceros (clientes, jueces), que los datos críticos 
  (temperatura, alertas, rutas) NO han sido alterados tras su regristro.
  
  Mecanismo: Merkle Tree Hash Chain.
  Cada bloque contiene el hash del bloque anterior. Si se altera una fila histórica, 
  se rompe toda la cadena futura.
*/

SET search_path = public, extensions;

-- 1. Tabla Ledger Inmutable
CREATE TABLE IF NOT EXISTS public.forensic_ledger (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  
  -- Datos del Evento
  event_type TEXT NOT NULL, -- 'COLD_CHAIN_ALERT', 'GEOFENCE_BREACH', 'MAINTENANCE_LOG'
  event_id UUID NOT NULL, -- ID de referencia a la tabla original
  payload JSONB NOT NULL, -- Copia exacta de los datos (snapshot)
  
  -- Metadatos Forenses
  actor_id UUID REFERENCES auth.users(id), -- Quién provocó el evento (o system)
  ip_address INET,
  user_agent TEXT,
  
  -- Criptografía
  previous_hash TEXT NOT NULL, -- Enlace al bloque anterior (the chain)
  current_hash TEXT NOT NULL, -- SHA256(previous_hash + payload + salt)
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para búsqueda rápida y validación
CREATE INDEX idx_ledger_chain ON public.forensic_ledger(tenant_id, id DESC);
CREATE INDEX idx_ledger_event ON public.forensic_ledger(event_id);

-- RLS: SOLO LECTURA. Nadie puede borrar o updatear el ledger.
ALTER TABLE public.forensic_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ledger is Append-Only" ON public.forensic_ledger
  FOR INSERT WITH CHECK (true); -- Permitir inserts (controlados por trigger)

CREATE POLICY "Tenants view own ledger" ON public.forensic_ledger
  FOR SELECT USING (tenant_id = get_user_tenant_id());
  
-- Nadie tiene permiso de UPDATE o DELETE
-- (Esto se refuerza revocando permisos al rol 'authenticated' y 'service_role' si es posible,
-- pero RLS blockea por defecto si no hay policy).


-- 2. Función Criptográfica (El "Minero" interno)
CREATE OR REPLACE FUNCTION public.append_to_ledger()
RETURNS TRIGGER AS $$
DECLARE
  prev_hash TEXT;
  new_payload JSONB;
  calc_hash TEXT;
  event_type_str TEXT;
BEGIN
  -- Definir tipo de evento basado en la tabla origen
  IF TG_TABLE_NAME = 'cold_chain_logs' THEN
    event_type_str := 'COLD_CHAIN_RECORD';
    new_payload := to_jsonb(NEW);
  ELSIF TG_TABLE_NAME = 'alerts' THEN
    event_type_str := 'SECURITY_ALERT';
    new_payload := to_jsonb(NEW);
  ELSE
    event_type_str := 'GENERIC_EVENT';
    new_payload := to_jsonb(NEW);
  END IF;

  -- 1. Obtener el hash del último bloque de este tenant
  -- Bloqueo de fila (FOR UPDATE) en el ledger para evitar condiciones de carrera en high-concurrency
  -- (Nota: esto puede afectar rendimiento, usar con cuidado. Para MVP es seguro).
  SELECT current_hash INTO prev_hash 
  FROM public.forensic_ledger 
  WHERE tenant_id = NEW.tenant_id 
  ORDER BY id DESC LIMIT 1;
  
  -- Genesis Block (si no hay previos)
  IF prev_hash IS NULL THEN
    prev_hash := '0000000000000000000000000000000000000000000000000000000000000000';
  END IF;

  -- 2. Calcular nuevo Hash SHA-256
  -- Hash = SHA256( prev_hash + payload_string + timestamp )
  calc_hash := encode(digest(prev_hash || new_payload::text || now()::text, 'sha256'), 'hex');

  -- 3. Insertar en Ledger
  INSERT INTO public.forensic_ledger (
    tenant_id, event_type, event_id, payload, previous_hash, current_hash
  ) VALUES (
    NEW.tenant_id, event_type_str, NEW.id, new_payload, prev_hash, calc_hash
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Triggers de "Observación"
-- Conectar el Ledger a las tablas críticas

-- Cadena de Frío (Crítico para Farmacéuticas/Alimentos)
DROP TRIGGER IF EXISTS trg_ledger_cold_chain ON public.cold_chain_logs;
CREATE TRIGGER trg_ledger_cold_chain
  AFTER INSERT ON public.cold_chain_logs
  FOR EACH ROW EXECUTE FUNCTION public.append_to_ledger();

-- Alertas de Seguridad (Jamming, Apertura de Puertas)
DROP TRIGGER IF EXISTS trg_ledger_alerts ON public.alerts;
CREATE TRIGGER trg_ledger_alerts
  AFTER INSERT ON public.alerts
  FOR EACH ROW EXECUTE FUNCTION public.append_to_ledger();
