-- =====================================================
-- CELLVI 2.0 - AI Modules Database Schema
-- Created: 2026-02-15
-- Purpose: Persistence for Route Genius, Vision Guard, Neuro-Core
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. ROUTE GENIUS - Optimización de Rutas
-- =====================================================

-- Tabla principal de rutas optimizadas
CREATE TABLE IF NOT EXISTS optimized_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  route_name TEXT,
  optimization_date TIMESTAMPTZ DEFAULT NOW(),

  -- Vehículos asignados
  vehicles JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Entregas incluidas
  deliveries JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Rutas optimizadas (resultado del algoritmo)
  routes JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Métricas de optimización
  total_distance NUMERIC(10, 2) NOT NULL,
  total_cost NUMERIC(12, 2) NOT NULL,
  fuel_consumption NUMERIC(10, 2) NOT NULL,
  co2_reduction NUMERIC(10, 2) NOT NULL,
  efficiency_gain NUMERIC(5, 2) NOT NULL,

  -- Entregas sin asignar
  unassigned_deliveries JSONB DEFAULT '[]'::jsonb,

  -- Estado de la ruta
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Notas adicionales
  notes TEXT
);

-- Índices para optimized_routes
CREATE INDEX idx_optimized_routes_created_by ON optimized_routes(created_by);
CREATE INDEX idx_optimized_routes_status ON optimized_routes(status);
CREATE INDEX idx_optimized_routes_date ON optimized_routes(optimization_date);
CREATE INDEX idx_optimized_routes_created_at ON optimized_routes(created_at DESC);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_optimized_routes_updated_at
  BEFORE UPDATE ON optimized_routes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. VISION GUARD - Detección de Fatiga
-- =====================================================

-- Tabla de sesiones de monitoreo
CREATE TABLE IF NOT EXISTS fatigue_monitoring_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id TEXT,

  -- Información de la sesión
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,

  -- Estadísticas de la sesión
  total_alerts INTEGER DEFAULT 0,
  critical_alerts INTEGER DEFAULT 0,
  warning_alerts INTEGER DEFAULT 0,
  max_fatigue_score INTEGER DEFAULT 0,
  avg_fatigue_score NUMERIC(5, 2) DEFAULT 0,

  -- Breaks tomados
  breaks_taken INTEGER DEFAULT 0,
  total_break_time_minutes INTEGER DEFAULT 0,

  -- Estado final
  session_status TEXT CHECK (session_status IN ('active', 'completed', 'interrupted')) DEFAULT 'active',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de alertas de fatiga
CREATE TABLE IF NOT EXISTS fatigue_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES fatigue_monitoring_sessions(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Tipo de alerta
  alert_type TEXT CHECK (alert_type IN ('eyes_closed', 'yawning', 'head_nodding', 'micro_sleep', 'prolonged_driving')) NOT NULL,

  -- Severidad
  severity TEXT CHECK (severity IN ('low', 'medium', 'high')) NOT NULL,

  -- Score de fatiga en el momento
  fatigue_score INTEGER NOT NULL CHECK (fatigue_score >= 0 AND fatigue_score <= 100),
  fatigue_level TEXT CHECK (fatigue_level IN ('green', 'yellow', 'red')) NOT NULL,

  -- Métricas en el momento de la alerta
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- {
  --   "eyeAspectRatio": 0.15,
  --   "yawnDetected": true,
  --   "headPose": {"pitch": 10, "yaw": 5, "roll": 2},
  --   "blinkRate": 25,
  --   "microSleepEvents": 3
  -- }

  -- Descripción de la alerta
  description TEXT NOT NULL,

  -- Acción tomada
  action_taken TEXT,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id),

  -- Metadata
  timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- Geolocalización (opcional)
  latitude NUMERIC(10, 6),
  longitude NUMERIC(10, 6)
);

-- Índices para fatigue_alerts
CREATE INDEX idx_fatigue_alerts_session ON fatigue_alerts(session_id);
CREATE INDEX idx_fatigue_alerts_driver ON fatigue_alerts(driver_id);
CREATE INDEX idx_fatigue_alerts_severity ON fatigue_alerts(severity);
CREATE INDEX idx_fatigue_alerts_timestamp ON fatigue_alerts(timestamp DESC);
CREATE INDEX idx_fatigue_alerts_level ON fatigue_alerts(fatigue_level);

-- Índices para fatigue_monitoring_sessions
CREATE INDEX idx_fatigue_sessions_driver ON fatigue_monitoring_sessions(driver_id);
CREATE INDEX idx_fatigue_sessions_status ON fatigue_monitoring_sessions(session_status);
CREATE INDEX idx_fatigue_sessions_start ON fatigue_monitoring_sessions(start_time DESC);

-- Trigger para actualizar estadísticas de sesión al crear alerta
CREATE OR REPLACE FUNCTION update_session_stats_on_alert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE fatigue_monitoring_sessions
  SET
    total_alerts = total_alerts + 1,
    critical_alerts = CASE WHEN NEW.severity = 'high' THEN critical_alerts + 1 ELSE critical_alerts END,
    warning_alerts = CASE WHEN NEW.severity IN ('medium', 'low') THEN warning_alerts + 1 ELSE warning_alerts END,
    max_fatigue_score = GREATEST(max_fatigue_score, NEW.fatigue_score),
    updated_at = NOW()
  WHERE id = NEW.session_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_session_stats_trigger
  AFTER INSERT ON fatigue_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_session_stats_on_alert();

-- =====================================================
-- 3. NEURO-CORE - Chatbot RAG
-- =====================================================

-- Tabla de conversaciones
CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Información de la conversación
  title TEXT,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- [
  --   {"id": "msg-1", "role": "user", "content": "...", "timestamp": "..."},
  --   {"id": "msg-2", "role": "assistant", "content": "...", "metadata": {...}}
  -- ]

  -- Estadísticas
  message_count INTEGER DEFAULT 0,
  avg_confidence NUMERIC(3, 2),
  total_sources_referenced INTEGER DEFAULT 0,

  -- Estado
  status TEXT CHECK (status IN ('active', 'archived', 'deleted')) DEFAULT 'active',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de knowledge base (documentos)
CREATE TABLE IF NOT EXISTS chatbot_knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Información del documento
  title TEXT NOT NULL,
  category TEXT CHECK (category IN ('vehicle_manual', 'rndc_regulation', 'company_policy', 'incident_history', 'other')) NOT NULL,

  -- Contenido
  content TEXT NOT NULL,
  summary TEXT,

  -- Metadata del documento
  document_metadata JSONB DEFAULT '{}'::jsonb,
  -- {
  --   "author": "...",
  --   "version": "1.0",
  --   "vehicleModel": "NAR-123",
  --   "regulation": "Resolución 3888"
  -- }

  -- Tags para búsqueda
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Embeddings (para búsqueda semántica)
  embedding vector(1536), -- OpenAI embeddings size

  -- URLs y referencias
  url TEXT,
  file_path TEXT,

  -- Estado
  published BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabla de mensajes individuales (para analytics)
CREATE TABLE IF NOT EXISTS chatbot_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Rol del mensaje
  role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,

  -- Contenido
  content TEXT NOT NULL,

  -- Metadata para mensajes de assistant
  confidence NUMERIC(3, 2),
  sources_referenced JSONB DEFAULT '[]'::jsonb,
  suggested_actions JSONB DEFAULT '[]'::jsonb,

  -- Feedback del usuario
  user_feedback TEXT CHECK (user_feedback IN ('helpful', 'not_helpful', 'partially_helpful')),
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),

  -- Metadata
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para chatbot_conversations
CREATE INDEX idx_chatbot_conversations_user ON chatbot_conversations(user_id);
CREATE INDEX idx_chatbot_conversations_status ON chatbot_conversations(status);
CREATE INDEX idx_chatbot_conversations_updated ON chatbot_conversations(updated_at DESC);

-- Índices para chatbot_knowledge_base
CREATE INDEX idx_chatbot_kb_category ON chatbot_knowledge_base(category);
CREATE INDEX idx_chatbot_kb_published ON chatbot_knowledge_base(published);
CREATE INDEX idx_chatbot_kb_tags ON chatbot_knowledge_base USING GIN(tags);

-- Índice para búsqueda vectorial (si usamos pgvector)
-- CREATE INDEX idx_chatbot_kb_embedding ON chatbot_knowledge_base USING ivfflat (embedding vector_cosine_ops);

-- Índices para chatbot_messages
CREATE INDEX idx_chatbot_messages_conversation ON chatbot_messages(conversation_id);
CREATE INDEX idx_chatbot_messages_user ON chatbot_messages(user_id);
CREATE INDEX idx_chatbot_messages_timestamp ON chatbot_messages(timestamp DESC);

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE optimized_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fatigue_monitoring_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fatigue_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS - Route Genius
-- =====================================================

-- Los usuarios pueden ver sus propias rutas
CREATE POLICY "Users can view own optimized routes"
  ON optimized_routes FOR SELECT
  USING (auth.uid() = created_by);

-- Los usuarios pueden crear rutas
CREATE POLICY "Users can create optimized routes"
  ON optimized_routes FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Los usuarios pueden actualizar sus propias rutas
CREATE POLICY "Users can update own optimized routes"
  ON optimized_routes FOR UPDATE
  USING (auth.uid() = created_by);

-- Admins pueden ver todas las rutas
CREATE POLICY "Admins can view all optimized routes"
  ON optimized_routes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

-- =====================================================
-- POLÍTICAS RLS - Vision Guard
-- =====================================================

-- Los conductores pueden ver sus propias sesiones
CREATE POLICY "Drivers can view own monitoring sessions"
  ON fatigue_monitoring_sessions FOR SELECT
  USING (auth.uid() = driver_id);

-- Los conductores pueden crear sesiones
CREATE POLICY "Drivers can create monitoring sessions"
  ON fatigue_monitoring_sessions FOR INSERT
  WITH CHECK (auth.uid() = driver_id);

-- Los conductores pueden actualizar sus propias sesiones
CREATE POLICY "Drivers can update own monitoring sessions"
  ON fatigue_monitoring_sessions FOR UPDATE
  USING (auth.uid() = driver_id);

-- Managers y admins pueden ver todas las sesiones
CREATE POLICY "Managers can view all monitoring sessions"
  ON fatigue_monitoring_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' IN ('admin', 'super_admin', 'manager')
    )
  );

-- Los conductores pueden ver sus propias alertas
CREATE POLICY "Drivers can view own fatigue alerts"
  ON fatigue_alerts FOR SELECT
  USING (auth.uid() = driver_id);

-- Los conductores pueden crear alertas (automáticas)
CREATE POLICY "Drivers can create fatigue alerts"
  ON fatigue_alerts FOR INSERT
  WITH CHECK (auth.uid() = driver_id);

-- Managers pueden ver todas las alertas
CREATE POLICY "Managers can view all fatigue alerts"
  ON fatigue_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' IN ('admin', 'super_admin', 'manager')
    )
  );

-- Managers pueden acknowledjar alertas
CREATE POLICY "Managers can acknowledge alerts"
  ON fatigue_alerts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' IN ('admin', 'super_admin', 'manager')
    )
  );

-- =====================================================
-- POLÍTICAS RLS - Neuro-Core
-- =====================================================

-- Los usuarios pueden ver sus propias conversaciones
CREATE POLICY "Users can view own conversations"
  ON chatbot_conversations FOR SELECT
  USING (auth.uid() = user_id);

-- Los usuarios pueden crear conversaciones
CREATE POLICY "Users can create conversations"
  ON chatbot_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus propias conversaciones
CREATE POLICY "Users can update own conversations"
  ON chatbot_conversations FOR UPDATE
  USING (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus propias conversaciones
CREATE POLICY "Users can delete own conversations"
  ON chatbot_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Knowledge base es público para lectura (si está publicado)
CREATE POLICY "Published knowledge base is readable by all"
  ON chatbot_knowledge_base FOR SELECT
  USING (published = true);

-- Solo admins pueden crear/modificar knowledge base
CREATE POLICY "Admins can manage knowledge base"
  ON chatbot_knowledge_base FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

-- Los usuarios pueden ver sus propios mensajes
CREATE POLICY "Users can view own messages"
  ON chatbot_messages FOR SELECT
  USING (auth.uid() = user_id);

-- Los usuarios pueden crear mensajes
CREATE POLICY "Users can create messages"
  ON chatbot_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden dar feedback a sus mensajes
CREATE POLICY "Users can update own message feedback"
  ON chatbot_messages FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- 5. FUNCIONES ÚTILES
-- =====================================================

-- Función para obtener estadísticas de fatiga de un conductor
CREATE OR REPLACE FUNCTION get_driver_fatigue_stats(driver_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  total_sessions INTEGER,
  total_alerts INTEGER,
  critical_alerts INTEGER,
  avg_fatigue_score NUMERIC,
  total_driving_hours NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT s.id)::INTEGER as total_sessions,
    COALESCE(SUM(s.total_alerts), 0)::INTEGER as total_alerts,
    COALESCE(SUM(s.critical_alerts), 0)::INTEGER as critical_alerts,
    COALESCE(AVG(s.avg_fatigue_score), 0)::NUMERIC as avg_fatigue_score,
    COALESCE(SUM(s.duration_minutes), 0)::NUMERIC / 60 as total_driving_hours
  FROM fatigue_monitoring_sessions s
  WHERE s.driver_id = driver_uuid
    AND s.start_time >= NOW() - (days_back || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener rutas más eficientes
CREATE OR REPLACE FUNCTION get_top_efficient_routes(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  route_name TEXT,
  efficiency_gain NUMERIC,
  total_distance NUMERIC,
  co2_reduction NUMERIC,
  optimization_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.route_name,
    r.efficiency_gain,
    r.total_distance,
    r.co2_reduction,
    r.optimization_date
  FROM optimized_routes r
  WHERE r.status = 'completed'
  ORDER BY r.efficiency_gain DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener conversaciones más activas
CREATE OR REPLACE FUNCTION get_active_conversations(limit_count INTEGER DEFAULT 20)
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
  WHERE c.status = 'active'
  ORDER BY c.last_message_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. DATOS DEMO INICIALES PARA KNOWLEDGE BASE
-- =====================================================

-- Insertar documentos de ejemplo en knowledge base
INSERT INTO chatbot_knowledge_base (title, category, content, tags, published) VALUES
(
  'Manual de Mantenimiento NAR-123',
  'vehicle_manual',
  'El vehículo NAR-123 requiere mantenimiento preventivo cada 10,000 km. Incluye cambio de aceite, revisión de frenos, y verificación de sistemas eléctricos. La batería debe revisarse cada 6 meses. Los neumáticos deben rotarse cada 15,000 km.',
  ARRAY['mantenimiento', 'NAR-123', 'preventivo', 'batería'],
  true
),
(
  'Resolución 3888 - Manifiestos Electrónicos RNDC',
  'rndc_regulation',
  'La Resolución 3888 del Ministerio de Transporte establece que todos los vehículos de carga deben generar manifiestos electrónicos antes de iniciar cada viaje. El conductor debe portar el código QR del manifiesto en todo momento. La validez del manifiesto es de 5 días.',
  ARRAY['RNDC', 'manifiesto', 'regulación', 'transporte'],
  true
),
(
  'Política de Combustible',
  'company_policy',
  'Los conductores deben reportar el consumo de combustible al inicio y fin de cada ruta. El rendimiento esperado es de 8-10 km/litro. Desviaciones mayores al 15% deben ser justificadas. Solo se autoriza reabastecimiento en estaciones aprobadas.',
  ARRAY['combustible', 'política', 'reportes'],
  true
),
(
  'Tiempos de Conducción - Resolución 1565',
  'rndc_regulation',
  'Los conductores no pueden conducir más de 10 horas en un período de 24 horas. Deben tomar un descanso mínimo de 30 minutos cada 5 horas de conducción. El descanso entre jornadas debe ser de al menos 8 horas consecutivas.',
  ARRAY['RNDC', 'conducción', 'descanso', 'seguridad'],
  true
);

-- =====================================================
-- FIN DEL SCHEMA
-- =====================================================

-- Comentarios finales
COMMENT ON TABLE optimized_routes IS 'Almacena rutas optimizadas generadas por Route Genius';
COMMENT ON TABLE fatigue_monitoring_sessions IS 'Sesiones de monitoreo de fatiga de Vision Guard';
COMMENT ON TABLE fatigue_alerts IS 'Alertas individuales de fatiga detectadas durante monitoreo';
COMMENT ON TABLE chatbot_conversations IS 'Conversaciones completas con Neuro-Core';
COMMENT ON TABLE chatbot_knowledge_base IS 'Base de conocimiento para RAG del chatbot';
COMMENT ON TABLE chatbot_messages IS 'Mensajes individuales para analytics y feedback';
