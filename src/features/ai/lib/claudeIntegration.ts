/**
 * Claude API Integration for Intelligent Chatbot Responses
 *
 * SECURITY: All AI API calls go through the /ai-proxy Edge Function.
 * API keys are NEVER exposed to the client.
 *
 * Features:
 * - Semantic search using server-side OpenAI embeddings
 * - Context-aware responses via server-side Claude API
 * - Source attribution and confidence scoring
 * - Suggested actions based on context
 * - Automatic fallback to simulated responses when API unavailable
 */

import { env } from '@/config/env';
import { supabase } from '@/lib/supabase';

// Types for Claude API
export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeResponse {
  id: string;
  content: Array<{ type: string; text: string }>;
  model: string;
  role: 'assistant';
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface RAGContext {
  query: string;
  relevantDocuments: Array<{
    id: string;
    title: string;
    content: string;
    category: string;
    relevanceScore: number;
  }>;
}

export interface ChatResponse {
  content: string;
  confidence: number;
  sources: Array<{
    id: string;
    title: string;
    snippet: string;
    relevanceScore: number;
    url?: string;
  }>;
  suggestedActions: Array<{
    type: string;
    label: string;
    description: string;
  }>;
}

/**
 * OpenAI Embeddings Configuration
 */
const OPENAI_CONFIG = {
  model: 'text-embedding-3-small',
  dimensions: 1536,
};

/**
 * System prompts for different contexts
 */
const SYSTEM_PROMPTS = {
  general: `Eres un asistente experto de ASEGURAR LTDA, una plataforma de gestión de flotas de transporte en Colombia.

Tu función es ayudar a los usuarios con:
- Consultas sobre mantenimiento de vehículos
- Regulaciones RNDC (Registro Nacional de Despacho de Carga)
- Políticas de la empresa
- Historial de incidentes y mejores prácticas
- Optimización de rutas y operaciones

Debes:
- Proporcionar respuestas claras, concisas y precisas
- Citar las fuentes cuando sea relevante
- Sugerir acciones concretas cuando sea apropiado
- Mantener un tono profesional pero amigable
- Si no estás seguro de algo, admítelo y sugiere alternativas

IMPORTANTE: Basa tus respuestas en la información proporcionada en el contexto. Si la información no está disponible, indícalo claramente.`,

  maintenance: `Eres un experto en mantenimiento de vehículos de transporte pesado.
Proporciona guías detalladas, cronogramas de mantenimiento y mejores prácticas.`,

  regulations: `Eres un experto en regulaciones de transporte en Colombia, especialmente RNDC.
Explica las normativas de forma clara y proporciona ejemplos prácticos.`,

  incidents: `Eres un analista de incidentes de transporte.
Ayuda a entender patrones, causas raíz y medidas preventivas.`,
};

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Call the AI proxy Edge Function securely
 */
async function callAIProxy(payload: Record<string, unknown>): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(env.ai.proxyEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return response;
}

/**
 * OpenAI Embeddings Wrapper (via server-side proxy)
 */
export class OpenAIEmbeddings {
  /**
   * Generate embedding for text via Edge Function proxy
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (env.features.useMockData) {
      return this.simulateEmbedding(text);
    }

    try {
      const response = await callAIProxy({
        action: 'embeddings',
        text,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `AI proxy error: ${response.status}`);
      }

      const data = await response.json();
      return data.embedding;
    } catch (error) {
      console.error('Error generating embedding via proxy:', error);
      return this.simulateEmbedding(text);
    }
  }

  /**
   * Simulate embedding for demo mode
   */
  private simulateEmbedding(text: string): number[] {
    const hash = this.hashCode(text);
    const embedding: number[] = [];

    for (let i = 0; i < OPENAI_CONFIG.dimensions; i++) {
      embedding.push(Math.sin(hash + i) * 0.5);
    }

    return embedding;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash;
  }

  /**
   * Check if AI proxy is available (Supabase must be configured)
   */
  static isConfigured(): boolean {
    return Boolean(env.supabase.url && !env.features.useMockData);
  }
}

/**
 * Claude API Wrapper (via server-side proxy)
 */
export class ClaudeAPI {
  /**
   * Generate response using Claude via Edge Function proxy
   */
  async generateResponse(
    messages: ClaudeMessage[],
    systemPrompt: string = SYSTEM_PROMPTS.general,
    context?: string
  ): Promise<ClaudeResponse> {
    if (env.features.useMockData) {
      return this.simulateResponse(messages);
    }

    try {
      const response = await callAIProxy({
        action: 'chat',
        messages,
        systemPrompt,
        context,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `AI proxy error: ${response.status}`);
      }

      const data: ClaudeResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error calling Claude via proxy:', error);
      return this.simulateResponse(messages);
    }
  }

  /**
   * Simulate response for demo mode
   */
  private simulateResponse(messages: ClaudeMessage[]): ClaudeResponse {
    const lastMessage = messages[messages.length - 1];
    const query = lastMessage.content.toLowerCase();

    let response = 'Entiendo tu consulta. ';

    if (query.includes('mantenimiento')) {
      response +=
        'Para el mantenimiento preventivo de vehículos de carga, se recomienda seguir el cronograma del fabricante. Los intervalos típicos son cada 10,000 km o 3 meses para cambio de aceite, y revisión de frenos cada 20,000 km.';
    } else if (query.includes('rndc')) {
      response +=
        'El Registro Nacional de Despacho de Carga (RNDC) es obligatorio en Colombia. Debes registrar cada viaje antes de iniciarlo, incluyendo información del vehículo, conductor y carga.';
    } else if (query.includes('ruta')) {
      response +=
        'Para optimizar rutas, considera factores como distancia, tráfico, restricciones vehiculares y ventanas de entrega. El sistema Route Genius puede ayudarte a calcular la ruta más eficiente.';
    } else {
      response +=
        'Estoy aquí para ayudarte con consultas sobre mantenimiento, regulaciones, rutas y operaciones de transporte. ¿Podrías ser más específico sobre lo que necesitas?';
    }

    return {
      id: `simulated-${Date.now()}`,
      content: [{ type: 'text', text: response }],
      model: 'claude-3-5-sonnet-20241022',
      role: 'assistant',
      stop_reason: 'end_turn',
      usage: {
        input_tokens: lastMessage.content.length,
        output_tokens: response.length,
      },
    };
  }

  /**
   * Check if Claude API is available via proxy
   */
  static isConfigured(): boolean {
    return Boolean(env.supabase.url && !env.features.useMockData);
  }
}

/**
 * RAG (Retrieval-Augmented Generation) System
 *
 * Combines semantic search with Claude API for context-aware responses.
 * All API calls routed through secure server-side proxy.
 */
export class RAGChatbot {
  private claudeAPI: ClaudeAPI;
  private embeddings: OpenAIEmbeddings;
  private conversationHistory: ClaudeMessage[] = [];

  constructor() {
    this.claudeAPI = new ClaudeAPI();
    this.embeddings = new OpenAIEmbeddings();
  }

  /**
   * Search knowledge base using semantic similarity
   */
  async searchKnowledgeBase(
    query: string,
    documents: Array<{
      id: string;
      title: string;
      content: string;
      category: string;
      embedding?: number[];
    }>,
    topK: number = 3
  ): Promise<RAGContext['relevantDocuments']> {
    const queryEmbedding = await this.embeddings.generateEmbedding(query);

    const similarities = documents.map((doc) => {
      const docEmbedding = doc.embedding || [];
      const similarity =
        docEmbedding.length > 0 ? cosineSimilarity(queryEmbedding, docEmbedding) : 0;

      return {
        id: doc.id,
        title: doc.title,
        content: doc.content,
        category: doc.category,
        relevanceScore: similarity,
      };
    });

    return similarities.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, topK);
  }

  /**
   * Generate chat response with RAG
   */
  async chat(
    userMessage: string,
    knowledgeBase: Array<{
      id: string;
      title: string;
      content: string;
      category: string;
      embedding?: number[];
      url?: string;
    }>
  ): Promise<ChatResponse> {
    try {
      const relevantDocs = await this.searchKnowledgeBase(userMessage, knowledgeBase, 3);

      const context = relevantDocs
        .map((doc) => `### ${doc.title}\n${doc.content}`)
        .join('\n\n');

      this.conversationHistory.push({
        role: 'user',
        content: userMessage,
      });

      const claudeResponse = await this.claudeAPI.generateResponse(
        this.conversationHistory,
        SYSTEM_PROMPTS.general,
        context
      );

      const responseText = claudeResponse.content[0]?.text || '';

      this.conversationHistory.push({
        role: 'assistant',
        content: responseText,
      });

      const avgRelevance =
        relevantDocs.reduce((sum, doc) => sum + doc.relevanceScore, 0) / relevantDocs.length;
      const confidence = Math.min(avgRelevance * 1.2, 1.0);

      const sources = relevantDocs.map((doc) => ({
        id: doc.id,
        title: doc.title,
        snippet: doc.content.substring(0, 150) + '...',
        relevanceScore: doc.relevanceScore,
        url: knowledgeBase.find((kb) => kb.id === doc.id)?.url,
      }));

      const suggestedActions = this.generateSuggestedActions(userMessage, relevantDocs);

      return {
        content: responseText,
        confidence,
        sources,
        suggestedActions,
      };
    } catch (error) {
      console.error('Error in RAG chat:', error);

      return {
        content:
          'Lo siento, hubo un error al procesar tu consulta. Por favor, intenta de nuevo o contacta al soporte.',
        confidence: 0,
        sources: [],
        suggestedActions: [],
      };
    }
  }

  /**
   * Generate suggested actions based on query and context
   */
  private generateSuggestedActions(
    query: string,
    relevantDocs: RAGContext['relevantDocuments']
  ): ChatResponse['suggestedActions'] {
    const actions: ChatResponse['suggestedActions'] = [];
    const queryLower = query.toLowerCase();

    if (queryLower.includes('mantenimiento') || queryLower.includes('revisión')) {
      actions.push({
        type: 'schedule_maintenance',
        label: 'Programar Mantenimiento',
        description: 'Agenda un servicio de mantenimiento preventivo',
      });
    }

    if (queryLower.includes('ruta') || queryLower.includes('optimizar')) {
      actions.push({
        type: 'navigate',
        label: 'Ir a Route Genius',
        description: 'Optimiza tus rutas de entrega',
      });
    }

    if (queryLower.includes('reporte') || queryLower.includes('incidente')) {
      actions.push({
        type: 'generate_report',
        label: 'Generar Reporte',
        description: 'Crea un reporte detallado',
      });
    }

    if (
      queryLower.includes('alerta') ||
      queryLower.includes('notificación') ||
      queryLower.includes('avisar')
    ) {
      actions.push({
        type: 'create_alert',
        label: 'Crear Alerta',
        description: 'Configura una alerta personalizada',
      });
    }

    return actions;
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  getHistory(): ClaudeMessage[] {
    return [...this.conversationHistory];
  }

  static isFullyConfigured(): boolean {
    return ClaudeAPI.isConfigured() && OpenAIEmbeddings.isConfigured();
  }
}

/**
 * Create and return RAG chatbot instance
 */
export function createRAGChatbot(): RAGChatbot {
  const chatbot = new RAGChatbot();

  if (!RAGChatbot.isFullyConfigured()) {
    console.warn(
      'RAG system running in demo mode. Configure Supabase and set AI keys in Edge Function secrets for production.'
    );
  }

  return chatbot;
}
