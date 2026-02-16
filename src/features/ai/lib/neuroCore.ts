/**
 * Neuro-Core - Chatbot Inteligente con RAG
 * Sistema de Q&A sobre la flota y normativa RNDC
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    sources?: DocumentReference[];
    confidence?: number;
    suggestedActions?: Action[];
  };
}

export interface DocumentReference {
  id: string;
  title: string;
  snippet: string;
  relevanceScore: number;
  url?: string;
}

export interface Action {
  type: 'navigate' | 'generate_report' | 'create_alert' | 'schedule_maintenance';
  label: string;
  data: any;
}

export interface KnowledgeBase {
  vehicleManuals: Document[];
  rndcRegulations: Document[];
  companyPolicies: Document[];
  incidentHistory: Document[];
}

interface Document {
  id: string;
  title: string;
  content: string;
  category: 'manual' | 'regulation' | 'policy' | 'incident';
  tags: string[];
  embeddings?: number[]; // Vector embeddings para búsqueda semántica
}

/**
 * Clase principal del chatbot inteligente
 */
export class NeuroCore {
  private conversationHistory: ChatMessage[] = [];
  private knowledgeBase: KnowledgeBase;

  constructor(knowledgeBase?: KnowledgeBase) {
    this.knowledgeBase = knowledgeBase || this.getDefaultKnowledgeBase();
  }

  /**
   * Conocimiento base por defecto (demo)
   */
  private getDefaultKnowledgeBase(): KnowledgeBase {
    return {
      vehicleManuals: [
        {
          id: 'vm1',
          title: 'Manual Camión NAR-123',
          content: 'El camión NAR-123 es un vehículo de carga con capacidad de 5 toneladas. Requiere mantenimiento cada 10,000 km. El aceite debe cambiarse cada 5,000 km.',
          category: 'manual',
          tags: ['NAR-123', 'mantenimiento', 'camión']
        },
        {
          id: 'vm2',
          title: 'Manual Sistema de Frenos',
          content: 'Los frenos deben inspeccionarse cada 5,000 km. Si se detecta vibración o ruido, revisar inmediatamente. Vida útil de pastillas: 30,000 km aprox.',
          category: 'manual',
          tags: ['frenos', 'mantenimiento', 'seguridad']
        }
      ],
      rndcRegulations: [
        {
          id: 'rr1',
          title: 'Resolución 3888 - Manifiestos RNDC',
          content: 'Todo transporte de carga debe generar manifiesto electrónico antes de iniciar el viaje. El cumplido debe registrarse dentro de las 24 horas posteriores.',
          category: 'regulation',
          tags: ['RNDC', 'manifiestos', 'MinTransporte']
        },
        {
          id: 'rr2',
          title: 'Tiempos de Conducción',
          content: 'Tiempo máximo de conducción continua: 5 horas. Descanso mínimo: 15 minutos cada 5 horas. Descanso diario mínimo: 8 horas.',
          category: 'regulation',
          tags: ['conductor', 'descansos', 'normativa']
        }
      ],
      companyPolicies: [
        {
          id: 'cp1',
          title: 'Política de Combustible',
          content: 'Todos los vehículos deben repostar en estaciones autorizadas. Reportar consumo anormal (>10% variación). Uso de combustible premium obligatorio para tractomulas.',
          category: 'policy',
          tags: ['combustible', 'política', 'costos']
        }
      ],
      incidentHistory: [
        {
          id: 'ih1',
          title: 'Incidente NAR-456 - Falla de Batería',
          content: 'El 2026-01-15, el vehículo NAR-456 presentó falla de batería en ruta Pasto-Cali. Se reemplazó batería. Causa: fin de vida útil (3 años). Prevención: revisar baterías cada 6 meses.',
          category: 'incident',
          tags: ['NAR-456', 'batería', 'mantenimiento']
        }
      ]
    };
  }

  /**
   * Búsqueda semántica en knowledge base
   * En producción: usar embeddings con pgvector o similar
   */
  private searchKnowledgeBase(query: string): DocumentReference[] {
    const allDocs = [
      ...this.knowledgeBase.vehicleManuals,
      ...this.knowledgeBase.rndcRegulations,
      ...this.knowledgeBase.companyPolicies,
      ...this.knowledgeBase.incidentHistory
    ];

    const queryLower = query.toLowerCase();

    // Búsqueda simple por keywords (en producción: usar embeddings)
    const results = allDocs
      .map(doc => {
        let relevanceScore = 0;
        const contentLower = (doc.title + ' ' + doc.content + ' ' + doc.tags.join(' ')).toLowerCase();

        // Contar coincidencias de palabras
        const queryWords = queryLower.split(' ').filter(w => w.length > 3);
        queryWords.forEach(word => {
          const matches = (contentLower.match(new RegExp(word, 'g')) || []).length;
          relevanceScore += matches;
        });

        if (relevanceScore === 0) return null;

        return {
          id: doc.id,
          title: doc.title,
          snippet: doc.content.substring(0, 150) + '...',
          relevanceScore,
          url: `/docs/${doc.category}/${doc.id}`
        };
      })
      .filter((ref): ref is DocumentReference => ref !== null)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3); // Top 3 resultados

    return results;
  }

  /**
   * Genera respuesta basada en contexto
   * En producción: llamar a Claude API o GPT-4
   */
  private generateResponse(query: string, sources: DocumentReference[]): string {
    // Respuestas predefinidas para demo
    const responses: Record<string, string> = {
      'mantenimiento': `Basado en los manuales, el mantenimiento preventivo debe realizarse cada 10,000 km para camiones y cada 5,000 km para cambio de aceite. Los frenos requieren inspección cada 5,000 km.`,
      'rndc': `Según la Resolución 3888, todo transporte de carga debe generar manifiesto electrónico RNDC antes de iniciar el viaje. El cumplido debe registrarse dentro de las 24 horas posteriores a la finalización del viaje.`,
      'combustible': `De acuerdo con la política de la empresa, todos los vehículos deben repostar en estaciones autorizadas. Las tractomulas requieren combustible premium. Cualquier consumo anormal (>10% variación) debe reportarse.`,
      'conductor': `Según la normativa, el tiempo máximo de conducción continua es de 5 horas, con descanso mínimo de 15 minutos. El descanso diario mínimo obligatorio es de 8 horas.`,
      'batería': `Basado en el historial de incidentes, las baterías tienen vida útil aproximada de 3 años. Se recomienda revisión cada 6 meses para prevenir fallas en ruta.`
    };

    // Encontrar respuesta más relevante
    for (const [keyword, response] of Object.entries(responses)) {
      if (query.toLowerCase().includes(keyword)) {
        return response;
      }
    }

    // Respuesta genérica si no hay match
    if (sources.length > 0) {
      return `He encontrado ${sources.length} documento(s) relevante(s) en la base de conocimiento. ${sources[0].snippet}`;
    }

    return 'No encontré información específica sobre tu consulta. ¿Podrías reformularla o ser más específico?';
  }

  /**
   * Sugiere acciones basadas en la consulta
   */
  private suggestActions(query: string): Action[] {
    const actions: Action[] = [];

    if (query.toLowerCase().includes('mantenimiento')) {
      actions.push({
        type: 'schedule_maintenance',
        label: 'Agendar Mantenimiento',
        data: { type: 'preventive' }
      });
      actions.push({
        type: 'generate_report',
        label: 'Ver Historial de Mantenimientos',
        data: { reportType: 'maintenance' }
      });
    }

    if (query.toLowerCase().includes('alerta')) {
      actions.push({
        type: 'navigate',
        label: 'Ver Centro de Alertas',
        data: { route: '/platform/alerts' }
      });
    }

    if (query.toLowerCase().includes('rndc')) {
      actions.push({
        type: 'navigate',
        label: 'Ir a Módulo RNDC',
        data: { route: '/platform/rndc' }
      });
    }

    return actions;
  }

  /**
   * Procesa un mensaje del usuario
   */
  async chat(userMessage: string): Promise<ChatMessage> {
    // Guardar mensaje del usuario
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    this.conversationHistory.push(userMsg);

    // Buscar en knowledge base
    const sources = this.searchKnowledgeBase(userMessage);

    // Generar respuesta
    const responseText = this.generateResponse(userMessage, sources);

    // Sugerir acciones
    const suggestedActions = this.suggestActions(userMessage);

    // Calcular confianza (mock - en producción viene del LLM)
    const confidence = sources.length > 0 ? 0.85 : 0.3;

    // Crear mensaje de respuesta
    const assistantMsg: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: responseText,
      timestamp: new Date(),
      metadata: {
        sources,
        confidence,
        suggestedActions
      }
    };

    this.conversationHistory.push(assistantMsg);

    return assistantMsg;
  }

  /**
   * Obtiene historial de conversación
   */
  getHistory(limit?: number): ChatMessage[] {
    return limit
      ? this.conversationHistory.slice(-limit)
      : this.conversationHistory;
  }

  /**
   * Limpia historial
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Ejemplos de preguntas que puede responder
   */
  static getExampleQuestions(): string[] {
    return [
      '¿Cuándo debo hacer el mantenimiento del NAR-123?',
      '¿Qué dice la normativa RNDC sobre manifiestos?',
      '¿Cuál es la política de combustible?',
      '¿Cuánto tiempo puede conducir un conductor sin descanso?',
      '¿Por qué falló la batería del NAR-456?',
      '¿Cada cuánto se revisan los frenos?',
      'Mostrar alertas críticas',
      'Generar reporte de mantenimiento'
    ];
  }
}

/**
 * Integración con API de LLM (producción)
 */
export async function callLLMAPI(
  messages: ChatMessage[],
  context: string
): Promise<string> {
  // En producción, llamar a:
  // - Claude API (Anthropic)
  // - GPT-4 (OpenAI)
  // - O modelo local con Ollama

  // Ejemplo con Claude API:
  /*
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      system: `You are Neuro-Core, an AI assistant for CELLVI fleet management system. ${context}`
    })
  });

  const data = await response.json();
  return data.content[0].text;
  */

  throw new Error('LLM API not configured - using mock responses');
}
