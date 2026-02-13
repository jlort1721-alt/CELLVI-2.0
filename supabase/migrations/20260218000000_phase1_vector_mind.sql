/*
  # Innovación: CELLVI Vector Mind (Fase 1)
  # Fecha: 2026-02-18
  # Autor: Antigravity AI

  1. Habilitar extensión `vector` para almacenamiento de embeddings.
  2. Crear tabla `knowledge_base` para manuales, leyes (RNDC) y procedimientos.
  3. Crear tabla `vehicle_health_vectors` para análisis de patrones de conducción anómalos (Embedding de series de tiempo).
  4. Función de búsqueda semántica para el Chatbot Operativo.
*/

SET search_path = public, extensions;

-- 1. Activar pgvector
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "extensions";

-- 2. Base de Conocimiento (RAG)
-- Almacena fragmentos de texto (chunks) de manuales de camiones, regulaciones y reportes pasados.
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  content TEXT NOT NULL, -- El texto real (ej: "La presión de llantas óptima para Kenworth T800 es 110 PSI")
  metadata JSONB DEFAULT '{}', -- { source: "manual_t800.pdf", page: 45, category: "maintenance" }
  embedding vector(1536), -- Compatible con OpenAI text-embedding-3-small
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants view own knowledge" ON public.knowledge_base
  FOR SELECT USING (tenant_id = get_user_tenant_id() OR tenant_id IS NULL); -- NULL = Conocimiento Global (Leyes RNDC)

-- Índice IVFFlat para búsqueda rápida (requiere >2000 filas para ser efectivo, pero lo preparamos)
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding 
ON public.knowledge_base USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 3. Función de Búsqueda Semántica (El "Cerebro")
CREATE OR REPLACE FUNCTION public.match_knowledge (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_tenant_id uuid
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.content,
    kb.metadata,
    1 - (kb.embedding <=> query_embedding) as similarity
  FROM public.knowledge_base kb
  WHERE 1 - (kb.embedding <=> query_embedding) > match_threshold
  AND (kb.tenant_id = filter_tenant_id OR kb.tenant_id IS NULL)
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 4. Historial de Chat Inteligente
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  context_used JSONB, -- Qué documentos usó la IA para responder (Transparencia)
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own sessions" ON public.chat_sessions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users own messages" ON public.chat_messages
  FOR ALL USING (session_id IN (SELECT id FROM public.chat_sessions WHERE user_id = auth.uid()));

