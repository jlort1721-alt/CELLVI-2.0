/**
 * Claude API Integration for Intelligent Chatbot Responses
 *
 * This module provides integration with Anthropic's Claude API for
 * generating intelligent, context-aware responses using RAG
 * (Retrieval-Augmented Generation) with OpenAI embeddings.
 *
 * Features:
 * - Semantic search using OpenAI embeddings
 * - Context-aware responses via Claude API
 * - Source attribution and confidence scoring
 * - Suggested actions based on context
 *
 * @requires openai
 * @requires @anthropic-ai/sdk
 */

import { env } from '@/config/env';

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
 * Claude API Configuration
 */
const CLAUDE_CONFIG = {
  model: 'claude-3-5-sonnet-20241022',
  maxTokens: 1024,
  temperature: 0.7,
};

/**
 * System prompts for different contexts
 */
const SYSTEM_PROMPTS = {
  general: `Eres un asistente experto de CELLVI, una plataforma de gestión de flotas de transporte en Colombia.

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
 * OpenAI Embeddings Wrapper
 */
export class OpenAIEmbeddings {
  private apiKey: string;
  private baseURL = 'https://api.openai.com/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || env.ai.openaiApiKey || '';
    if (!this.apiKey) {
      console.warn('⚠️ OpenAI API key not configured. Embeddings will be simulated.');
    }
  }

  /**
   * Generate embedding for text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.apiKey) {
      // Return simulated embedding for demo
      return this.simulateEmbedding(text);
    }

    try {
      const response = await fetch(`${this.baseURL}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: OPENAI_CONFIG.model,
          input: text,
          dimensions: OPENAI_CONFIG.dimensions,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      return this.simulateEmbedding(text);
    }
  }

  /**
   * Simulate embedding for demo mode
   */
  private simulateEmbedding(text: string): number[] {
    // Simple hash-based simulation
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
   * Check if OpenAI is configured
   */
  static isConfigured(): boolean {
    return Boolean(env.ai.openaiApiKey);
  }
}

/**
 * Claude API Wrapper
 */
export class ClaudeAPI {
  private apiKey: string;
  private baseURL = 'https://api.anthropic.com/v1';
  private apiVersion = '2023-06-01';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || env.ai.anthropicApiKey || '';
    if (!this.apiKey) {
      console.warn('⚠️ Claude API key not configured. Responses will be simulated.');
    }
  }

  /**
   * Generate response using Claude
   */
  async generateResponse(
    messages: ClaudeMessage[],
    systemPrompt: string = SYSTEM_PROMPTS.general,
    context?: string
  ): Promise<ClaudeResponse> {
    if (!this.apiKey) {
      return this.simulateResponse(messages);
    }

    try {
      // Add context to system prompt if provided
      const fullSystemPrompt = context
        ? `${systemPrompt}\n\n## Contexto relevante:\n${context}`
        : systemPrompt;

      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': this.apiVersion,
        },
        body: JSON.stringify({
          model: CLAUDE_CONFIG.model,
          max_tokens: CLAUDE_CONFIG.maxTokens,
          temperature: CLAUDE_CONFIG.temperature,
          system: fullSystemPrompt,
          messages: messages,
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.statusText}`);
      }

      const data: ClaudeResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error calling Claude API:', error);
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
   * Check if Claude is configured
   */
  static isConfigured(): boolean {
    return Boolean(env.ai.anthropicApiKey);
  }
}

/**
 * RAG (Retrieval-Augmented Generation) System
 *
 * Combines semantic search with Claude API for context-aware responses
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
    // Generate query embedding
    const queryEmbedding = await this.embeddings.generateEmbedding(query);

    // Calculate similarity for each document
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

    // Sort by relevance and return top K
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
      // 1. Search knowledge base for relevant documents
      const relevantDocs = await this.searchKnowledgeBase(userMessage, knowledgeBase, 3);

      // 2. Build context from relevant documents
      const context = relevantDocs
        .map((doc) => `### ${doc.title}\n${doc.content}`)
        .join('\n\n');

      // 3. Add user message to history
      this.conversationHistory.push({
        role: 'user',
        content: userMessage,
      });

      // 4. Generate response using Claude with context
      const claudeResponse = await this.claudeAPI.generateResponse(
        this.conversationHistory,
        SYSTEM_PROMPTS.general,
        context
      );

      const responseText = claudeResponse.content[0]?.text || '';

      // 5. Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: responseText,
      });

      // 6. Calculate confidence based on relevance scores
      const avgRelevance =
        relevantDocs.reduce((sum, doc) => sum + doc.relevanceScore, 0) / relevantDocs.length;
      const confidence = Math.min(avgRelevance * 1.2, 1.0);

      // 7. Extract sources
      const sources = relevantDocs.map((doc) => ({
        id: doc.id,
        title: doc.title,
        snippet: doc.content.substring(0, 150) + '...',
        relevanceScore: doc.relevanceScore,
        url: knowledgeBase.find((kb) => kb.id === doc.id)?.url,
      }));

      // 8. Generate suggested actions based on context
      const suggestedActions = this.generateSuggestedActions(userMessage, relevantDocs);

      return {
        content: responseText,
        confidence,
        sources,
        suggestedActions,
      };
    } catch (error) {
      console.error('Error in RAG chat:', error);

      // Fallback response
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

    // Maintenance-related actions
    if (queryLower.includes('mantenimiento') || queryLower.includes('revisión')) {
      actions.push({
        type: 'schedule_maintenance',
        label: 'Programar Mantenimiento',
        description: 'Agenda un servicio de mantenimiento preventivo',
      });
    }

    // Route-related actions
    if (queryLower.includes('ruta') || queryLower.includes('optimizar')) {
      actions.push({
        type: 'navigate',
        label: 'Ir a Route Genius',
        description: 'Optimiza tus rutas de entrega',
      });
    }

    // Report-related actions
    if (queryLower.includes('reporte') || queryLower.includes('incidente')) {
      actions.push({
        type: 'generate_report',
        label: 'Generar Reporte',
        description: 'Crea un reporte detallado',
      });
    }

    // Alert-related actions
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

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Get conversation history
   */
  getHistory(): ClaudeMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Check if RAG system is fully configured
   */
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
      '⚠️ RAG system not fully configured. Using simulated responses.\n' +
        'Configure VITE_ANTHROPIC_API_KEY and VITE_OPENAI_API_KEY for production use.'
    );
  }

  return chatbot;
}

/**
 * Integration Instructions:
 *
 * 1. Install required packages:
 *
 * npm install openai @anthropic-ai/sdk
 *
 * 2. Configure environment variables in .env:
 *
 * VITE_ANTHROPIC_API_KEY=sk-ant-api03-...
 * VITE_OPENAI_API_KEY=sk-...
 *
 * 3. Generate embeddings for knowledge base documents:
 *
 * const embeddings = new OpenAIEmbeddings();
 * for (const doc of knowledgeBase) {
 *   doc.embedding = await embeddings.generateEmbedding(doc.content);
 *   // Save to Supabase
 * }
 *
 * 4. Use in ChatbotInterface component:
 *
 * const ragChatbot = createRAGChatbot();
 * const response = await ragChatbot.chat(userMessage, knowledgeBaseDocuments);
 *
 * 5. Display sources and suggested actions in UI
 */
