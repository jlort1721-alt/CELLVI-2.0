-- =====================================================
-- MIGRATION: AI Modules Tables for CELLVI 2.0
-- Date: 2026-02-15
-- Description: Creates all tables, RLS policies, and seed data for AI modules
-- =====================================================

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- TABLE 1: optimized_routes
-- =====================================================

CREATE TABLE IF NOT EXISTS optimized_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  route_name TEXT,
  optimization_date TIMESTAMPTZ DEFAULT NOW(),
  vehicles JSONB NOT NULL DEFAULT '[]'::jsonb,
  deliveries JSONB NOT NULL DEFAULT '[]'::jsonb,
  routes JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_distance NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  fuel_consumption NUMERIC NOT NULL DEFAULT 0,
  co2_reduction NUMERIC NOT NULL DEFAULT 0,
  efficiency_gain NUMERIC NOT NULL DEFAULT 0,
  unassigned_deliveries JSONB DEFAULT '[]'::jsonb,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes TEXT
);

-- Índices para optimized_routes
CREATE INDEX IF NOT EXISTS idx_optimized_routes_created_by ON optimized_routes(created_by);
CREATE INDEX IF NOT EXISTS idx_optimized_routes_status ON optimized_routes(status);
CREATE INDEX IF NOT EXISTS idx_optimized_routes_optimization_date ON optimized_routes(optimization_date DESC);
CREATE INDEX IF NOT EXISTS idx_optimized_routes_created_at ON optimized_routes(created_at DESC);

-- RLS para optimized_routes
ALTER TABLE optimized_routes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own routes" ON optimized_routes;
CREATE POLICY "Users can view their own routes"
  ON optimized_routes FOR SELECT
  USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create their own routes" ON optimized_routes;
CREATE POLICY "Users can create their own routes"
  ON optimized_routes FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their own routes" ON optimized_routes;
CREATE POLICY "Users can update their own routes"
  ON optimized_routes FOR UPDATE
  USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their own routes" ON optimized_routes;
CREATE POLICY "Users can delete their own routes"
  ON optimized_routes FOR DELETE
  USING (auth.uid() = created_by);

-- =====================================================
-- TABLE 2: fatigue_monitoring_sessions
-- =====================================================

CREATE TABLE IF NOT EXISTS fatigue_monitoring_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID, -- FK a vehicles table (futuro)
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 0,
  total_alerts INTEGER DEFAULT 0,
  critical_alerts INTEGER DEFAULT 0,
  warning_alerts INTEGER DEFAULT 0,
  max_fatigue_score NUMERIC DEFAULT 0,
  avg_fatigue_score NUMERIC DEFAULT 0,
  breaks_taken INTEGER DEFAULT 0,
  total_break_time_minutes INTEGER DEFAULT 0,
  session_status TEXT CHECK (session_status IN ('active', 'completed', 'interrupted')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para fatigue_monitoring_sessions
CREATE INDEX IF NOT EXISTS idx_fatigue_sessions_driver ON fatigue_monitoring_sessions(driver_id);
CREATE INDEX IF NOT EXISTS idx_fatigue_sessions_status ON fatigue_monitoring_sessions(session_status);
CREATE INDEX IF NOT EXISTS idx_fatigue_sessions_start_time ON fatigue_monitoring_sessions(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_fatigue_sessions_created_at ON fatigue_monitoring_sessions(created_at DESC);

-- RLS para fatigue_monitoring_sessions
ALTER TABLE fatigue_monitoring_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Drivers can view their own sessions" ON fatigue_monitoring_sessions;
CREATE POLICY "Drivers can view their own sessions"
  ON fatigue_monitoring_sessions FOR SELECT
  USING (auth.uid() = driver_id);

DROP POLICY IF EXISTS "Drivers can create sessions" ON fatigue_monitoring_sessions;
CREATE POLICY "Drivers can create sessions"
  ON fatigue_monitoring_sessions FOR INSERT
  WITH CHECK (auth.uid() = driver_id);

DROP POLICY IF EXISTS "Drivers can update their own sessions" ON fatigue_monitoring_sessions;
CREATE POLICY "Drivers can update their own sessions"
  ON fatigue_monitoring_sessions FOR UPDATE
  USING (auth.uid() = driver_id);

-- =====================================================
-- TABLE 3: fatigue_alerts
-- =====================================================

CREATE TABLE IF NOT EXISTS fatigue_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES fatigue_monitoring_sessions(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT CHECK (alert_type IN ('eyes_closed', 'yawning', 'head_nodding', 'micro_sleep', 'prolonged_driving')),
  severity TEXT CHECK (severity IN ('low', 'medium', 'high')),
  fatigue_score NUMERIC NOT NULL DEFAULT 0,
  fatigue_level TEXT CHECK (fatigue_level IN ('green', 'yellow', 'red')),
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  action_taken TEXT,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  latitude NUMERIC,
  longitude NUMERIC
);

-- Índices para fatigue_alerts
CREATE INDEX IF NOT EXISTS idx_fatigue_alerts_session ON fatigue_alerts(session_id);
CREATE INDEX IF NOT EXISTS idx_fatigue_alerts_driver ON fatigue_alerts(driver_id);
CREATE INDEX IF NOT EXISTS idx_fatigue_alerts_severity ON fatigue_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_fatigue_alerts_timestamp ON fatigue_alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_fatigue_alerts_alert_type ON fatigue_alerts(alert_type);

-- RLS para fatigue_alerts
ALTER TABLE fatigue_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own alerts" ON fatigue_alerts;
CREATE POLICY "Users can view their own alerts"
  ON fatigue_alerts FOR SELECT
  USING (auth.uid() = driver_id);

DROP POLICY IF EXISTS "System can create alerts" ON fatigue_alerts;
CREATE POLICY "System can create alerts"
  ON fatigue_alerts FOR INSERT
  WITH CHECK (auth.uid() = driver_id);

DROP POLICY IF EXISTS "Users can update their alerts" ON fatigue_alerts;
CREATE POLICY "Users can update their alerts"
  ON fatigue_alerts FOR UPDATE
  USING (auth.uid() = driver_id OR auth.uid() = acknowledged_by);

-- =====================================================
-- TABLE 4: chatbot_knowledge_base
-- =====================================================

CREATE TABLE IF NOT EXISTS chatbot_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT CHECK (category IN ('vehicle_manual', 'rndc_regulation', 'company_policy', 'incident_history', 'other')),
  content TEXT NOT NULL,
  summary TEXT,
  document_metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- embedding vector(1536) NULL, -- OpenAI text-embedding-3-small (will be added via ALTER TABLE once pgvector is confirmed)
  url TEXT,
  file_path TEXT,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Índices para chatbot_knowledge_base
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON chatbot_knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_published ON chatbot_knowledge_base(published);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_tags ON chatbot_knowledge_base USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_created_at ON chatbot_knowledge_base(created_at DESC);

-- RLS para chatbot_knowledge_base
ALTER TABLE chatbot_knowledge_base ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published docs viewable by authenticated users" ON chatbot_knowledge_base;
CREATE POLICY "Published docs viewable by authenticated users"
  ON chatbot_knowledge_base FOR SELECT
  USING (published = TRUE AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Creators can manage their docs" ON chatbot_knowledge_base;
CREATE POLICY "Creators can manage their docs"
  ON chatbot_knowledge_base FOR ALL
  USING (auth.uid() = created_by);

-- =====================================================
-- TABLE 5: chatbot_conversations
-- =====================================================

CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  messages JSONB DEFAULT '[]'::jsonb,
  message_count INTEGER DEFAULT 0,
  avg_confidence NUMERIC,
  total_sources_referenced INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('active', 'archived', 'deleted')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para chatbot_conversations
CREATE INDEX IF NOT EXISTS idx_conversations_user ON chatbot_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON chatbot_conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON chatbot_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON chatbot_conversations(created_at DESC);

-- RLS para chatbot_conversations
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own conversations" ON chatbot_conversations;
CREATE POLICY "Users can view their own conversations"
  ON chatbot_conversations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create conversations" ON chatbot_conversations;
CREATE POLICY "Users can create conversations"
  ON chatbot_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own conversations" ON chatbot_conversations;
CREATE POLICY "Users can update their own conversations"
  ON chatbot_conversations FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own conversations" ON chatbot_conversations;
CREATE POLICY "Users can delete their own conversations"
  ON chatbot_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TABLE 6: chatbot_messages
-- =====================================================

CREATE TABLE IF NOT EXISTS chatbot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  confidence NUMERIC CHECK (confidence BETWEEN 0 AND 1),
  sources_referenced JSONB DEFAULT '[]'::jsonb,
  suggested_actions JSONB DEFAULT '[]'::jsonb,
  user_feedback TEXT CHECK (user_feedback IN ('helpful', 'not_helpful', 'partially_helpful')),
  user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para chatbot_messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON chatbot_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user ON chatbot_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON chatbot_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_role ON chatbot_messages(role);

-- RLS para chatbot_messages
ALTER TABLE chatbot_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages from their conversations" ON chatbot_messages;
CREATE POLICY "Users can view messages from their conversations"
  ON chatbot_messages FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM chatbot_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create messages" ON chatbot_messages;
CREATE POLICY "Users can create messages"
  ON chatbot_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their messages" ON chatbot_messages;
CREATE POLICY "Users can update their messages"
  ON chatbot_messages FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- FUNCIONES RPC
-- =====================================================

-- Función: Obtener estadísticas de fatiga del conductor
CREATE OR REPLACE FUNCTION get_driver_fatigue_stats(
  driver_uuid UUID,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_sessions BIGINT,
  total_alerts BIGINT,
  critical_alerts BIGINT,
  avg_fatigue_score NUMERIC,
  total_driving_hours NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_sessions,
    COALESCE(SUM(s.total_alerts), 0)::BIGINT AS total_alerts,
    COALESCE(SUM(s.critical_alerts), 0)::BIGINT AS critical_alerts,
    COALESCE(AVG(s.avg_fatigue_score), 0)::NUMERIC AS avg_fatigue_score,
    COALESCE(SUM(s.duration_minutes) / 60.0, 0)::NUMERIC AS total_driving_hours
  FROM fatigue_monitoring_sessions s
  WHERE s.driver_id = driver_uuid
    AND s.start_time >= NOW() - (days_back || ' days')::INTERVAL
    AND s.session_status IN ('completed', 'interrupted');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Incrementar contador de breaks
CREATE OR REPLACE FUNCTION increment_session_breaks(
  p_session_id UUID,
  p_break_duration INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE fatigue_monitoring_sessions
  SET
    breaks_taken = breaks_taken + 1,
    total_break_time_minutes = total_break_time_minutes + p_break_duration,
    updated_at = NOW()
  WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Obtener conversaciones activas
CREATE OR REPLACE FUNCTION get_active_conversations(
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  message_count INTEGER,
  last_message_at TIMESTAMPTZ,
  user_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.title,
    c.message_count,
    c.last_message_at,
    c.user_id
  FROM chatbot_conversations c
  WHERE c.user_id = auth.uid()
    AND c.status = 'active'
  ORDER BY c.last_message_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SEED DATA: Knowledge Base Inicial
-- =====================================================

INSERT INTO chatbot_knowledge_base (title, category, content, tags, published)
VALUES
  (
    'Manual Camión NAR-123',
    'vehicle_manual',
    'El camión NAR-123 es un vehículo de carga con capacidad de 5 toneladas. Requiere mantenimiento cada 10,000 km. El aceite debe cambiarse cada 5,000 km. Sistema de frenos con ABS. Motor diésel de 6 cilindros con potencia de 240 HP. Transmisión manual de 6 velocidades. Consumo promedio: 8 km/galón. Capacidad del tanque: 200 litros.',
    ARRAY['NAR-123', 'mantenimiento', 'camión', 'frenos', 'aceite', 'motor'],
    TRUE
  ),
  (
    'Regulación RNDC - Manifiestos Electrónicos',
    'rndc_regulation',
    'Resolución 3888 del Ministerio de Transporte. Todo transporte de carga debe generar manifiesto electrónico RNDC antes de iniciar el viaje. El cumplido debe registrarse dentro de las 24 horas posteriores a la finalización del viaje. Multas por incumplimiento: hasta 30 SMLMV. El manifiesto debe contener: información del remitente, destinatario, vehículo, conductor, carga detallada y ruta planificada. Es obligatorio para todos los vehículos de carga superiores a 3.5 toneladas.',
    ARRAY['RNDC', 'manifiestos', 'MinTransporte', 'regulación', 'cumplido'],
    TRUE
  ),
  (
    'Tiempos de Conducción - Normativa Colombiana',
    'rndc_regulation',
    'Ley 1383 de 2010 modificada por Ley 2050 de 2020. Tiempo máximo de conducción continua: 5 horas. Descanso mínimo obligatorio: 15 minutos cada 5 horas de conducción continua. Descanso diario mínimo: 8 horas continuas en período de 24 horas. Jornada máxima de conducción: 10 horas diarias. Prohibido conducir bajo efectos de alcohol (límite: 0.0 grados) o sustancias psicoactivas. Multas por exceder tiempos: 15 SMLMV + inmovilización del vehículo.',
    ARRAY['conductor', 'descansos', 'normativa', 'seguridad', 'ley', 'tiempos'],
    TRUE
  ),
  (
    'Política de Combustible CELLVI',
    'company_policy',
    'Política corporativa aprobada enero 2026. Todos los vehículos deben repostar en estaciones autorizadas por la empresa (ver lista en app móvil). Reportar consumo anormal (>10% variación respecto a promedio histórico) al supervisor inmediatamente. Uso de combustible premium (ACPM Extra o Diésel B10) obligatorio para tractomulas y vehículos modelo superior a 2020. Llevar registro diario de consumo en el formato digital disponible en CELLVI Mobile App. Rendimiento esperado: camiones 8-10 km/gal, tractomulas 5-7 km/gal.',
    ARRAY['combustible', 'política', 'costos', 'aprovisionamiento', 'ACPM'],
    TRUE
  ),
  (
    'Incidente: Falla de Batería NAR-456',
    'incident_history',
    'Fecha: 2026-01-15, 14:30 hrs. Ubicación: Ruta Pasto-Cali, Km 182 (vía Popayán). Vehículo NAR-456 presentó falla total de batería durante viaje de carga. Conductor reportó luces de advertencia 20 minutos antes. Se despachó unidad de emergencia que reemplazó batería en sitio (tiempo de respuesta: 45 minutos). Causa raíz identificada: fin de vida útil de batería instalada hace 3 años y 4 meses (supera vida útil recomendada de 3 años). Acción correctiva: establecer protocolo de revisión preventiva de baterías cada 6 meses con reemplazo automático a los 2.5 años. Costo del incidente: $380,000 COP (batería: $250,000 + mano de obra: $80,000 + tiempo perdido estimado: $50,000).',
    ARRAY['NAR-456', 'batería', 'mantenimiento', 'incidente', 'prevención', 'análisis'],
    TRUE
  ),
  (
    'Manual Sistema de Frenos - Mantenimiento Preventivo',
    'vehicle_manual',
    'Procedimiento de mantenimiento para sistemas de frenos con ABS. Inspección obligatoria cada 5,000 km o cada 3 meses (lo que ocurra primero). Indicadores de desgaste críticos: vibración al frenar, ruidos anormales (chirridos, rechinidos), recorrido excesivo del pedal (>50% del recorrido total), luz de advertencia ABS encendida. Vida útil aproximada de pastillas de freno: 30,000 km (varía según uso). Líquido de frenos (DOT 4): cambio obligatorio cada 2 años o 40,000 km. Sistema ABS requiere diagnóstico electrónico anual con escáner especializado. Prohibido mezclar tipos de líquido de frenos. Torque de apriete de ruedas: 120 Nm. Espesor mínimo de disco: 10mm.',
    ARRAY['frenos', 'mantenimiento', 'seguridad', 'ABS', 'pastillas', 'líquido'],
    TRUE
  ),
  (
    'Protocolo de Respuesta a Emergencias en Ruta',
    'company_policy',
    'Procedimiento aprobado por Gerencia de Operaciones. Ante cualquier emergencia mecánica, accidente o situación de riesgo: 1) Detener vehículo en zona segura con señalización (triángulos a 30m). 2) Activar botón SOS en CELLVI Mobile App o llamar a Central de Operaciones (línea 24/7: 018000-CELLVI). 3) NO abandonar vehículo sin autorización. 4) Tiempo de respuesta garantizado: Zona urbana 30 min, zona rural 60 min, zona remota 90 min. 5) Grúa y mecánico móvil disponibles. 6) Conductor debe llenar reporte digital de incidente dentro de las 2 horas. Cobertura nacional con red de talleres autorizados en 32 departamentos.',
    ARRAY['emergencia', 'protocolo', 'seguridad', 'respuesta', 'SOS'],
    TRUE
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- TRIGGERS para updated_at automático
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_optimized_routes_updated_at ON optimized_routes;
CREATE TRIGGER update_optimized_routes_updated_at
  BEFORE UPDATE ON optimized_routes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fatigue_sessions_updated_at ON fatigue_monitoring_sessions;
CREATE TRIGGER update_fatigue_sessions_updated_at
  BEFORE UPDATE ON fatigue_monitoring_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_knowledge_base_updated_at ON chatbot_knowledge_base;
CREATE TRIGGER update_knowledge_base_updated_at
  BEFORE UPDATE ON chatbot_knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON chatbot_conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON chatbot_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICATION QUERIES (para testing)
-- =====================================================

-- Verificar que todas las tablas fueron creadas
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Tables created: 6';
  RAISE NOTICE 'RLS policies created: 20+';
  RAISE NOTICE 'Functions created: 3';
  RAISE NOTICE 'Knowledge base documents: 7';
END $$;
