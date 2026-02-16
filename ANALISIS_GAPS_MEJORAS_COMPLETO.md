# 📊 ANÁLISIS COMPLETO DE GAPS Y MEJORAS - CELLVI 2.0
## Auditoría Técnica Exhaustiva | 15 de febrero de 2026

---

## 🎯 RESUMEN EJECUTIVO

Tras un análisis profundo de **toda la implementación** de CELLVI 2.0, incluyendo:
- ✅ Módulo Asegurar IA (10 dashboards organizacionales)
- ✅ 3 Librerías de IA (Route Genius, Vision Guard, Neuro-Core)
- ✅ Integración Supabase
- ✅ Tests automatizados

**Conclusión:** El proyecto está en **70-75% de completitud real**. Existen **discrepancias significativas** entre lo reportado y lo implementado, especialmente en las integraciones de APIs externas.

---

## 🚨 GAPS CRÍTICOS (PRIORIDAD MÁXIMA)

### 1. ❌ INTEGRACIÓN REAL DE APIs EXTERNAS

#### Problema:
Los reportes de implementación mencionan archivos como:
- `src/features/ai/lib/mediaPipeIntegration.ts` (395 líneas)
- `src/features/ai/lib/claudeIntegration.ts` (519 líneas)

**Pero estos archivos NO EXISTEN en el código actual.**

#### Realidad Actual:

**Vision Guard (`visionGuard.ts`):**
```typescript
// ❌ SIMULADO - No hay integración real de MediaPipe
analyzeFrame(videoFrame?: HTMLVideoElement): FatigueMetrics {
  // Simulación para demo - en producción usar MediaPipe real
  const ear = Math.random() * 0.4 + 0.15;  // DATOS FALSOS
  const mar = Math.random() * 0.5 + 0.2;   // DATOS FALSOS
  // ...
}
```

**Neuro-Core (`neuroCore.ts`):**
```typescript
// ❌ SIMULADO - No hay llamadas a Claude API
private searchKnowledgeBase(query: string): DocumentReference[] {
  // Búsqueda simple por keywords (en producción: usar embeddings)
  const queryLower = query.toLowerCase();
  // ... keyword matching, NO embeddings
}

async function callLLMAPI(messages, context): Promise<string> {
  // Template vacío
  throw new Error('LLM API not configured - using mock responses');
}
```

#### Impacto:
- **Vision Guard NO detecta fatiga real** (solo genera números aleatorios)
- **Neuro-Core NO usa IA generativa** (solo respuestas pre-escritas)
- **Route Genius SÍ funciona** (algoritmo VRP es real ✅)

#### Solución Requerida:

**CREAR los archivos faltantes:**

1. **`src/features/ai/lib/mediaPipeIntegration.ts`** (CRÍTICO)
```typescript
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

export class MediaPipeDetector {
  private faceMesh: FaceMesh;

  async initialize(): Promise<void> {
    this.faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });

    this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
  }

  calculateEAR(landmarks: FaceLandmarks[], eyeIndices): number {
    // Implementación REAL usando landmarks de MediaPipe
    // Usar índices reales: 159, 145, 158, 23, 133, 33 (ojo derecho)
    // Fórmula: EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
  }

  calculateMAR(landmarks: FaceLandmarks[]): number {
    // Implementación REAL
    // Usar índices: 13 (labio superior), 14 (labio inferior)
  }

  calculateHeadPose(landmarks: FaceLandmarks[]): HeadPose {
    // Implementación REAL usando geometría 3D
  }
}
```

2. **`src/features/ai/lib/claudeIntegration.ts`** (CRÍTICO)
```typescript
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export class OpenAIEmbeddings {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true // Solo para demo, usar backend en prod
    });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float'
    });
    return response.data[0].embedding; // 1536 dimensions
  }
}

export class ClaudeAPI {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY
    });
  }

  async generateResponse(
    messages: ChatMessage[],
    systemPrompt: string,
    context: string
  ): Promise<string> {
    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 2048,
      system: `${systemPrompt}\n\nContexto relevante:\n${context}`,
      messages: messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))
    });

    return response.content[0].type === 'text'
      ? response.content[0].text
      : '';
  }
}

export class RAGChatbot {
  private embeddings: OpenAIEmbeddings;
  private claude: ClaudeAPI;

  async searchKnowledgeBase(query: string, knowledgeBase: any[], topK: number = 3) {
    // 1. Generar embedding del query
    const queryEmbedding = await this.embeddings.generateEmbedding(query);

    // 2. Calcular cosine similarity con cada documento
    const results = await Promise.all(
      knowledgeBase.map(async (doc) => {
        if (!doc.embedding) {
          // Generar embedding si no existe
          doc.embedding = await this.embeddings.generateEmbedding(doc.content);
        }
        const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);
        return { ...doc, relevanceScore: similarity };
      })
    );

    // 3. Ordenar por relevancia y retornar top K
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, topK);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
}
```

**Esfuerzo Estimado:** 3-4 días
**Dependencias:** API keys (OpenAI, Anthropic)

---

### 2. ❌ SUPABASE - BASE DE DATOS NO INICIALIZADA

#### Problema:
El schema está **definido en TypeScript** pero **no existe en Supabase real**.

**Archivos con Schema:**
- ✅ `src/lib/supabase.ts` - Tipos TypeScript completos
- ✅ Hooks funcionan (`useRouteOptimization.ts`, `useFatigueMonitoring.ts`, `useChatbot.ts`)
- ❌ **PERO: No hay migration files**
- ❌ **No hay tablas creadas en Supabase**
- ❌ **No hay RLS policies configuradas**

#### Estado Actual:
```typescript
// env.ts
export const env = {
  features: {
    useMockData: getBoolEnv('VITE_USE_MOCK_DATA', true), // DEFAULT: DEMO MODE
  }
}
```

**TODO está funcionando en MODO DEMO** (sin persistencia real).

#### Solución Requerida:

**CREAR migration file para Supabase:**

**`supabase/migrations/20260215_create_ai_tables.sql`**

```sql
-- =====================================================
-- MIGRATION: AI Modules Tables
-- =====================================================

-- 1. Tabla: optimized_routes
CREATE TABLE optimized_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  route_name TEXT,
  optimization_date TIMESTAMPTZ DEFAULT NOW(),
  vehicles JSONB NOT NULL,
  deliveries JSONB NOT NULL,
  routes JSONB NOT NULL,
  total_distance NUMERIC NOT NULL,
  total_cost NUMERIC NOT NULL,
  fuel_consumption NUMERIC NOT NULL,
  co2_reduction NUMERIC NOT NULL,
  efficiency_gain NUMERIC NOT NULL,
  unassigned_deliveries JSONB DEFAULT '[]'::jsonb,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes TEXT
);

-- Índices para optimized_routes
CREATE INDEX idx_optimized_routes_created_by ON optimized_routes(created_by);
CREATE INDEX idx_optimized_routes_status ON optimized_routes(status);
CREATE INDEX idx_optimized_routes_optimization_date ON optimized_routes(optimization_date DESC);

-- RLS para optimized_routes
ALTER TABLE optimized_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own routes"
  ON optimized_routes FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own routes"
  ON optimized_routes FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own routes"
  ON optimized_routes FOR UPDATE
  USING (auth.uid() = created_by);

-- =====================================================

-- 2. Tabla: fatigue_monitoring_sessions
CREATE TABLE fatigue_monitoring_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID, -- FK a vehicles (futuro)
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
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

-- Índices
CREATE INDEX idx_fatigue_sessions_driver ON fatigue_monitoring_sessions(driver_id);
CREATE INDEX idx_fatigue_sessions_status ON fatigue_monitoring_sessions(session_status);
CREATE INDEX idx_fatigue_sessions_start_time ON fatigue_monitoring_sessions(start_time DESC);

-- RLS
ALTER TABLE fatigue_monitoring_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view their own sessions"
  ON fatigue_monitoring_sessions FOR SELECT
  USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can create sessions"
  ON fatigue_monitoring_sessions FOR INSERT
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can update their own sessions"
  ON fatigue_monitoring_sessions FOR UPDATE
  USING (auth.uid() = driver_id);

-- =====================================================

-- 3. Tabla: fatigue_alerts
CREATE TABLE fatigue_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES fatigue_monitoring_sessions(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT CHECK (alert_type IN ('eyes_closed', 'yawning', 'head_nodding', 'micro_sleep', 'prolonged_driving')),
  severity TEXT CHECK (severity IN ('low', 'medium', 'high')),
  fatigue_score NUMERIC NOT NULL,
  fatigue_level TEXT CHECK (fatigue_level IN ('green', 'yellow', 'red')),
  metrics JSONB NOT NULL, -- FatigueMetrics completo
  description TEXT,
  action_taken TEXT,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  latitude NUMERIC,
  longitude NUMERIC
);

-- Índices
CREATE INDEX idx_fatigue_alerts_session ON fatigue_alerts(session_id);
CREATE INDEX idx_fatigue_alerts_driver ON fatigue_alerts(driver_id);
CREATE INDEX idx_fatigue_alerts_severity ON fatigue_alerts(severity);
CREATE INDEX idx_fatigue_alerts_timestamp ON fatigue_alerts(timestamp DESC);

-- RLS
ALTER TABLE fatigue_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers and managers can view alerts"
  ON fatigue_alerts FOR SELECT
  USING (
    auth.uid() = driver_id OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "System can create alerts"
  ON fatigue_alerts FOR INSERT
  WITH CHECK (auth.uid() = driver_id);

-- =====================================================

-- 4. Tabla: chatbot_knowledge_base
CREATE TABLE chatbot_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT CHECK (category IN ('vehicle_manual', 'rndc_regulation', 'company_policy', 'incident_history', 'other')),
  content TEXT NOT NULL,
  summary TEXT,
  document_metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  embedding VECTOR(1536), -- OpenAI text-embedding-3-small
  url TEXT,
  file_path TEXT,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Índices
CREATE INDEX idx_knowledge_base_category ON chatbot_knowledge_base(category);
CREATE INDEX idx_knowledge_base_published ON chatbot_knowledge_base(published);
CREATE INDEX idx_knowledge_base_embedding ON chatbot_knowledge_base USING ivfflat (embedding vector_cosine_ops);

-- RLS
ALTER TABLE chatbot_knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published docs are viewable by all authenticated users"
  ON chatbot_knowledge_base FOR SELECT
  USING (published = TRUE AND auth.role() = 'authenticated');

-- =====================================================

-- 5. Tabla: chatbot_conversations
CREATE TABLE chatbot_conversations (
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

-- Índices
CREATE INDEX idx_conversations_user ON chatbot_conversations(user_id);
CREATE INDEX idx_conversations_status ON chatbot_conversations(status);
CREATE INDEX idx_conversations_last_message ON chatbot_conversations(last_message_at DESC);

-- RLS
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
  ON chatbot_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create conversations"
  ON chatbot_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON chatbot_conversations FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================

-- 6. Tabla: chatbot_messages
CREATE TABLE chatbot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  confidence NUMERIC,
  sources_referenced JSONB DEFAULT '[]'::jsonb,
  suggested_actions JSONB DEFAULT '[]'::jsonb,
  user_feedback TEXT CHECK (user_feedback IN ('helpful', 'not_helpful', 'partially_helpful')),
  user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_messages_conversation ON chatbot_messages(conversation_id);
CREATE INDEX idx_messages_timestamp ON chatbot_messages(timestamp DESC);

-- RLS
ALTER TABLE chatbot_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from their conversations"
  ON chatbot_messages FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM chatbot_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

-- =====================================================

-- FUNCIONES RPC

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
    SUM(s.total_alerts)::BIGINT AS total_alerts,
    SUM(s.critical_alerts)::BIGINT AS critical_alerts,
    AVG(s.avg_fatigue_score)::NUMERIC AS avg_fatigue_score,
    (SUM(s.duration_minutes) / 60.0)::NUMERIC AS total_driving_hours
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

-- =====================================================

-- SEED DATA: Knowledge Base inicial

INSERT INTO chatbot_knowledge_base (title, category, content, tags, published) VALUES
('Manual Camión NAR-123', 'vehicle_manual', 'El camión NAR-123 es un vehículo de carga con capacidad de 5 toneladas. Requiere mantenimiento cada 10,000 km. El aceite debe cambiarse cada 5,000 km. Sistema de frenos con ABS. Motor diésel de 6 cilindros con potencia de 240 HP.', ARRAY['NAR-123', 'mantenimiento', 'camión', 'frenos', 'aceite'], TRUE),

('Regulación RNDC - Manifiestos', 'rndc_regulation', 'Resolución 3888 - Todo transporte de carga debe generar manifiesto electrónico antes de iniciar el viaje. El cumplido debe registrarse dentro de las 24 horas posteriores. Multas por incumplimiento: hasta 30 SMLMV. El manifiesto debe contener: información del remitente, destinatario, vehículo, conductor, carga y ruta.', ARRAY['RNDC', 'manifiestos', 'MinTransporte', 'regulación'], TRUE),

('Tiempos de Conducción - Normativa', 'rndc_regulation', 'Tiempo máximo de conducción continua: 5 horas. Descanso mínimo obligatorio: 15 minutos cada 5 horas. Descanso diario mínimo: 8 horas continuas. Jornada máxima de conducción: 10 horas diarias. Prohibido conducir bajo efectos de alcohol o sustancias psicoactivas.', ARRAY['conductor', 'descansos', 'normativa', 'seguridad'], TRUE),

('Política de Combustible', 'company_policy', 'Todos los vehículos deben repostar en estaciones autorizadas por la empresa. Reportar consumo anormal (>10% variación) al supervisor inmediatamente. Uso de combustible premium (ACPM Extra) obligatorio para tractomulas. Llevar registro diario de consumo en el formato digital disponible en la app móvil.', ARRAY['combustible', 'política', 'costos', 'aprovisionamiento'], TRUE),

('Incidente Batería NAR-456', 'incident_history', 'Fecha: 2026-01-15. Vehículo NAR-456 presentó falla de batería en ruta Pasto-Cali (km 182). Se reemplazó batería de emergencia en sitio. Causa raíz: fin de vida útil (batería instalada hace 3 años y 4 meses). Prevención: establecer protocolo de revisión de baterías cada 6 meses. Costo de incidente: $380,000 COP (batería + mano de obra + tiempo perdido).', ARRAY['NAR-456', 'batería', 'mantenimiento', 'incidente', 'prevención'], TRUE),

('Manual Sistema de Frenos', 'vehicle_manual', 'Los frenos deben inspeccionarse cada 5,000 km o cada 3 meses. Indicadores de desgaste: vibración, ruidos anormales, recorrido excesivo del pedal. Vida útil de pastillas: 30,000 km aproximadamente. Líquido de frenos debe cambiarse cada 2 años. Sistema ABS requiere diagnóstico electrónico anual.', ARRAY['frenos', 'mantenimiento', 'seguridad', 'ABS'], TRUE);
```

**Pasos de Implementación:**
1. Ejecutar migration en Supabase Dashboard o CLI
2. Verificar que todas las tablas se crearon
3. Verificar que RLS está habilitado
4. Insertar seed data de knowledge base
5. Cambiar `VITE_USE_MOCK_DATA=false` en `.env`
6. Configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`

**Esfuerzo Estimado:** 1 día
**Dependencias:** Acceso a Supabase proyecto

---

### 3. ❌ COMPONENTES UI - USANDO DATOS MOCK

#### Problema:
Los 3 componentes de IA existen pero **no están aprovechando las capacidades completas**:

**`RouteOptimizerPanel.tsx`:** ✅ BIEN (usa algoritmo VRP real)
**`FatigueMonitor.tsx`:** ❌ No procesa video real, solo simula
**`ChatbotInterface.tsx`:** ❌ No usa RAG real, solo keyword matching

#### Código Actual:

**FatigueMonitor.tsx (líneas 59-91):**
```typescript
intervalRef.current = setInterval(async () => {
  // ❌ analyzeFrame() genera números aleatorios, no usa MediaPipe
  const currentMetrics = visionGuard.current.analyzeFrame();
  setMetrics(currentMetrics);

  const currentState = visionGuard.current.evaluateFatigue(currentMetrics);
  setFatigueState(currentState);
  // ...
}, 1000);
```

**ChatbotInterface.tsx (líneas 122-140):**
```typescript
setTimeout(async () => {
  // ❌ chat() usa respuestas pre-escritas, no Claude API
  const response = await neuroCore.current.chat(userInput);
  setMessages((prev) => [...prev, response]);
  // ...
}, 1000);
```

#### Solución:

**ACTUALIZAR FatigueMonitor.tsx** para usar MediaPipe real:

```typescript
// Importar MediaPipe detector
import { MediaPipeDetector } from '../lib/mediaPipeIntegration';

// En el componente
const mediaPipeDetector = useRef<MediaPipeDetector>(null);
const videoRef = useRef<HTMLVideoElement>(null);

// Inicializar MediaPipe
useEffect(() => {
  async function initCamera() {
    mediaPipeDetector.current = new MediaPipeDetector();
    await mediaPipeDetector.current.initialize();

    // Iniciar cámara
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' }
    });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }
  initCamera();
}, []);

// En el loop de análisis
intervalRef.current = setInterval(async () => {
  if (!videoRef.current || !mediaPipeDetector.current) return;

  // ✅ Procesar frame real con MediaPipe
  const landmarks = await mediaPipeDetector.current.detectFace(videoRef.current);

  if (landmarks) {
    const metrics = {
      eyeAspectRatio: mediaPipeDetector.current.calculateEAR(landmarks),
      yawnDetected: mediaPipeDetector.current.calculateMAR(landmarks) > 0.6,
      headPose: mediaPipeDetector.current.calculateHeadPose(landmarks),
      blinkRate: visionGuard.current.calculateBlinkRate(),
      microSleepEvents: metrics.eyeAspectRatio < 0.15 ?
        visionGuard.current.microSleepCount++ :
        visionGuard.current.microSleepCount
    };

    setMetrics(metrics);
    const currentState = visionGuard.current.evaluateFatigue(metrics);
    setFatigueState(currentState);
  }
}, 100); // 10 FPS
```

**ACTUALIZAR ChatbotInterface.tsx** para usar RAG real:

```typescript
import { RAGChatbot } from '../lib/claudeIntegration';

const ragChatbot = useRef<RAGChatbot>(null);
const { data: knowledgeBase } = useKnowledgeBase(); // Hook de Supabase

useEffect(() => {
  ragChatbot.current = new RAGChatbot();
}, []);

const handleSendMessage = async () => {
  // ...

  // ✅ Usar RAG real con embeddings + Claude
  const response = await ragChatbot.current.chat(userInput, knowledgeBase || []);

  setMessages((prev) => [...prev, response]);
  // ...
};
```

**Esfuerzo Estimado:** 2-3 días
**Dependencias:** MediaPipe library, API keys configuradas

---

## 🟡 GAPS IMPORTANTES (PRIORIDAD ALTA)

### 4. ❌ FALTA VISUALIZACIÓN DE MAPAS

#### Problema:
`RouteOptimizerPanel.tsx` muestra las rutas en **lista/tabla**, pero **no hay mapa interactivo**.

#### Solución:
Integrar **Leaflet** o **Mapbox** para mostrar:
- Ubicaciones de entregas (markers)
- Rutas optimizadas (polylines)
- Vehículos (iconos personalizados)
- Colores por prioridad

**Código a agregar:**

```typescript
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// En el componente RouteOptimizerPanel
<MapContainer
  center={[1.2136, -77.2811]} // Pasto, Colombia
  zoom={13}
  style={{ height: '600px', width: '100%' }}
>
  <TileLayer
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    attribution='&copy; OpenStreetMap contributors'
  />

  {/* Markers para entregas */}
  {deliveries.map(delivery => (
    <Marker
      key={delivery.id}
      position={[delivery.lat, delivery.lng]}
    >
      <Popup>
        <strong>{delivery.address}</strong><br/>
        Peso: {delivery.weight} kg<br/>
        Prioridad: {delivery.priority}
      </Popup>
    </Marker>
  ))}

  {/* Polylines para rutas optimizadas */}
  {result?.routes.map((route, idx) => {
    const positions = route.sequence.map(deliveryId => {
      const delivery = route.deliveries.find(d => d.id === deliveryId);
      return [delivery.lat, delivery.lng];
    });

    return (
      <Polyline
        key={idx}
        positions={positions}
        color={['blue', 'green', 'purple'][idx]}
        weight={3}
      />
    );
  })}
</MapContainer>
```

**Esfuerzo:** 1-2 días

---

### 5. ❌ TESTS NO CUBREN INTEGRACIONES REALES

#### Problema:
Los tests existentes son **buenos para lógica pura**, pero **no prueban las APIs**:

**Tests actuales:**
- ✅ `routeOptimizer.test.ts` - Algoritmo VRP (COMPLETO)
- ❌ `mediaPipeIntegration.test.ts` - Solo mock data
- ❌ `claudeIntegration.test.ts` - Solo mock data

**Ejemplo de test que no prueba nada real:**
```typescript
it('should generate embeddings for text', async () => {
  const text = 'Este es un texto de prueba';
  const embedding = await embeddings.generateEmbedding(text);

  expect(Array.isArray(embedding)).toBe(true);
  expect(embedding.length).toBe(1536); // ❌ Siempre pasa, no llama a OpenAI real
});
```

#### Solución:
Crear **tests de integración** que usen APIs reales en entorno de desarrollo:

```typescript
// claudeIntegration.integration.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { OpenAIEmbeddings, RAGChatbot } from '../claudeIntegration';

describe('Claude Integration - REAL API', () => {
  let embeddings: OpenAIEmbeddings;
  let chatbot: RAGChatbot;

  beforeAll(() => {
    // ⚠️ Requiere VITE_OPENAI_API_KEY y VITE_ANTHROPIC_API_KEY
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      throw new Error('VITE_OPENAI_API_KEY not set - skipping integration tests');
    }
    embeddings = new OpenAIEmbeddings();
    chatbot = new RAGChatbot();
  });

  it('should call real OpenAI API and generate 1536-dimensional embedding', async () => {
    const text = 'Vehicle maintenance schedule for NAR-123';
    const embedding = await embeddings.generateEmbedding(text);

    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBe(1536);
    expect(embedding.every(v => typeof v === 'number')).toBe(true);
    expect(Math.abs(embedding.reduce((sum, v) => sum + v*v, 0) - 1) < 0.01).toBe(true); // Normalized
  }, 30000); // 30s timeout

  it('should call real Claude API and generate contextual response', async () => {
    const knowledgeBase = [/* mock docs */];
    const response = await chatbot.chat('¿Cuándo debo hacer mantenimiento?', knowledgeBase);

    expect(response.content).toBeTruthy();
    expect(response.content.length).toBeGreaterThan(50); // Respuesta real no vacía
    expect(response.metadata.confidence).toBeGreaterThan(0);
  }, 60000); // 60s timeout
});
```

**Ejecutar solo en CI/CD:**
```bash
npm run test:integration  # Solo con API keys configuradas
```

**Esfuerzo:** 2 días

---

### 6. ❌ NO HAY MIGRACIÓN DE DATOS HISTÓRICOS

#### Problema:
Si ya existe data en un sistema anterior, **no hay plan de migración**.

#### Solución:
Crear scripts de migración:

```typescript
// scripts/migrateHistoricalData.ts
import { supabase } from '../src/lib/supabase';
import { readFile } from 'fs/promises';

async function migrateRoutes(csvPath: string) {
  const csv = await readFile(csvPath, 'utf-8');
  const lines = csv.split('\n').slice(1); // Skip header

  for (const line of lines) {
    const [date, vehicleId, distance, cost, status] = line.split(',');

    await supabase.from('optimized_routes').insert({
      route_name: `Historical Route ${date}`,
      optimization_date: date,
      total_distance: parseFloat(distance),
      total_cost: parseFloat(cost),
      status: status || 'completed',
      // ... mapear otros campos
    });
  }
}

migrateRoutes('./data/historical_routes.csv');
```

**Esfuerzo:** 1-2 días

---

## 🟢 MEJORAS RECOMENDADAS (PRIORIDAD MEDIA)

### 7. 📱 RESPONSIVE DESIGN INCOMPLETO

#### Problema:
Dashboards están optimizados para desktop, pero en **mobile/tablet** tienen problemas:

**Ejemplos:**
- Gráficos Recharts no responsivos
- Tabs horizontal scroll en mobile
- Tablas no colapsan

#### Solución:

```typescript
// Hook para breakpoints
import { useMediaQuery } from '@/hooks/useMediaQuery';

const isMobile = useMediaQuery('(max-width: 768px)');
const isTablet = useMediaQuery('(max-width: 1024px)');

// Ajustar componentes
<Tabs orientation={isMobile ? 'vertical' : 'horizontal'}>
  {/* ... */}
</Tabs>

<ResponsiveContainer width="100%" height={isMobile ? 250 : 400}>
  <AreaChart data={data}>
    {/* ... */}
  </AreaChart>
</ResponsiveContainer>

// Tabla responsive
{isMobile ? (
  <div className="space-y-2">
    {data.map(item => (
      <Card key={item.id}>
        <CardContent>
          <p>{item.name}: {item.value}</p>
        </CardContent>
      </Card>
    ))}
  </div>
) : (
  <Table>
    {/* Desktop table */}
  </Table>
)}
```

**Esfuerzo:** 2-3 días

---

### 8. 🔒 SEGURIDAD - MEJORAS RLS

#### Problema Actual:
Las políticas RLS son **básicas**. Faltan:
- Multi-tenancy (por empresa/tenant)
- Permisos granulares por rol
- Audit logs

#### Solución:

```sql
-- Agregar campo tenant_id a todas las tablas
ALTER TABLE optimized_routes ADD COLUMN tenant_id UUID REFERENCES tenants(id);

-- RLS por tenant
CREATE POLICY "Users can only view data from their tenant"
  ON optimized_routes FOR SELECT
  USING (
    tenant_id = (
      SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- Audit log automático
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT,
  operation TEXT,
  old_data JSONB,
  new_data JSONB,
  user_id UUID,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para audit
CREATE OR REPLACE FUNCTION log_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (table_name, operation, old_data, new_data, user_id)
  VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), row_to_json(NEW), auth.uid());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_optimized_routes
AFTER INSERT OR UPDATE OR DELETE ON optimized_routes
FOR EACH ROW EXECUTE FUNCTION log_changes();
```

**Esfuerzo:** 1-2 días

---

### 9. ⚡ PERFORMANCE - CODE SPLITTING

#### Problema:
Bundle inicial es grande debido a:
- Recharts (~200KB)
- Leaflet (~140KB)
- MediaPipe SDK
- Todas las áreas de Asegurar IA cargadas

#### Solución:

```typescript
// Lazy load de visualizaciones pesadas
const AreaChart = lazy(() => import('recharts').then(m => ({ default: m.AreaChart })));
const MapContainer = lazy(() => import('react-leaflet').then(m => ({ default: m.MapContainer })));

// Vite config - manual chunks
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-charts': ['recharts'],
          'vendor-maps': ['leaflet', 'react-leaflet'],
          'vendor-ai': ['@mediapipe/face_mesh', '@anthropic-ai/sdk'],
        }
      }
    }
  }
});
```

**Resultado esperado:**
- Bundle inicial: 500KB → 250KB
- Charts chunk: ~200KB (lazy)
- Maps chunk: ~140KB (lazy)
- AI chunk: ~300KB (lazy)

**Esfuerzo:** 1 día

---

### 10. 📊 ANALYTICS Y MONITORING

#### Falta:
- No hay tracking de uso
- No hay error monitoring
- No hay performance metrics

#### Solución:

**Sentry para errores:**
```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0
});
```

**PostHog para analytics:**
```typescript
import posthog from 'posthog-js';

posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
  api_host: 'https://app.posthog.com'
});

// Track eventos
posthog.capture('route_optimized', {
  total_distance: result.metrics.totalDistance,
  efficiency_gain: result.metrics.efficiencyGain
});
```

**Esfuerzo:** 1 día

---

## 📝 DOCUMENTACIÓN FALTANTE

### 11. ❌ NO HAY GUÍA DE DEPLOYMENT

**Crear:**
- `docs/DEPLOYMENT.md` - Guía paso a paso
- `.env.example` - Variables requeridas
- Docker Compose setup (opcional)
- CI/CD con GitHub Actions

### 12. ❌ NO HAY GUÍA DE USUARIO

**Crear:**
- `docs/USER_GUIDE.md` - Manual de usuario
- Screenshots de cada módulo
- Videos tutoriales (Loom)

---

## 🎯 ROADMAP PRIORIZADO

### 🔴 SPRINT 1 (Semana 1-2) - CRÍTICO
**Objetivo:** Hacer funcionar las integraciones de IA realmente

1. ✅ **Crear `mediaPipeIntegration.ts`** (2 días)
   - Integración real de MediaPipe
   - Procesamiento de video
   - Cálculos EAR/MAR/HeadPose reales

2. ✅ **Crear `claudeIntegration.ts`** (2 días)
   - Integración OpenAI Embeddings
   - Integración Claude API
   - RAG completo con cosine similarity

3. ✅ **Actualizar `FatigueMonitor.tsx`** (1 día)
   - Usar MediaPipe real
   - Stream de cámara
   - Métricas en tiempo real

4. ✅ **Actualizar `ChatbotInterface.tsx`** (1 día)
   - Usar RAG real
   - Embeddings + Claude
   - Respuestas contextuales

5. ✅ **Migration de Supabase** (1 día)
   - Ejecutar SQL migration
   - Crear seed data
   - Verificar RLS

**Total: 7-8 días**

---

### 🟡 SPRINT 2 (Semana 3) - IMPORTANTE

6. ✅ **Agregar mapa interactivo** (1-2 días)
   - Leaflet integration
   - Visualización de rutas

7. ✅ **Tests de integración** (2 días)
   - Tests con APIs reales
   - CI/CD setup

8. ✅ **Responsive design** (2-3 días)
   - Mobile/tablet optimization
   - Touch interactions

**Total: 5-7 días**

---

### 🟢 SPRINT 3 (Semana 4) - MEJORAS

9. ✅ **Seguridad RLS avanzada** (1-2 días)
10. ✅ **Performance optimization** (1 día)
11. ✅ **Analytics + Monitoring** (1 día)
12. ✅ **Documentación** (2 días)

**Total: 5-6 días**

---

## 📊 MÉTRICAS DE COMPLETITUD REAL

| Módulo | Reportado | Real | Gap |
|--------|-----------|------|-----|
| Route Genius (VRP) | 100% | 95% | 5% (mapa) |
| Vision Guard (Fatigue) | 100% | 40% | **60%** ❌ |
| Neuro-Core (Chatbot) | 100% | 35% | **65%** ❌ |
| Supabase Integration | 100% | 50% | **50%** ❌ |
| Tests | 100% | 60% | 40% |
| Asegurar IA Dashboards | 100% | 100% | 0% ✅ |
| **PROMEDIO TOTAL** | **100%** | **71%** | **29%** |

---

## 🎓 CONCLUSIONES Y RECOMENDACIONES

### ✅ LO QUE ESTÁ BIEN

1. **Asegurar IA:** Completamente funcional y bien diseñado
2. **Route Genius:** Algoritmo VRP funcionando correctamente
3. **Arquitectura:** Código bien estructurado, TypeScript estricto
4. **Hooks de Supabase:** Bien implementados y listos para usar
5. **Tests unitarios:** Buena cobertura de lógica de negocio

### ❌ LO QUE FALTA (CRÍTICO)

1. **MediaPipe NO está integrado** - Solo simulación
2. **Claude API NO está integrado** - Solo respuestas pre-escritas
3. **Supabase NO tiene datos** - Todo en modo demo
4. **Tests NO prueban APIs reales** - Solo mocks
5. **No hay deployment guide** - Falta documentación operativa

### 🎯 ACCIÓN INMEDIATA RECOMENDADA

**Prioridad #1:** Crear `mediaPipeIntegration.ts` y `claudeIntegration.ts` con integraciones REALES.

**Razón:** Estos son los **componentes core** del valor del producto. Sin ellos, la plataforma no cumple su propuesta de valor de IA.

**Tiempo estimado:** 3-4 días con 1 desarrollador

**ROI:** Alto - Convierte demos en funcionalidad real

---

## 📞 PRÓXIMOS PASOS

### Para el Equipo de Desarrollo:

1. **Revisar este informe completo** con el equipo técnico
2. **Priorizar Sprint 1** (integraciones de IA)
3. **Configurar API keys** en entorno de desarrollo:
   - OpenAI API Key (embeddings)
   - Anthropic API Key (Claude)
   - Supabase credentials
4. **Ejecutar migration de Supabase**
5. **Comenzar implementación** siguiendo roadmap

### Para Product/Management:

1. **Ajustar expectativas** de completitud (71% real vs 100% reportado)
2. **Aprobar presupuesto** para API keys ($50-100 USD/mes aprox)
3. **Definir prioridades** si hay restricciones de tiempo
4. **Validar UX** de dashboards en mobile

---

**FIN DEL ANÁLISIS**

*Generado por Claude Sonnet 4.5*
*15 de febrero de 2026*
