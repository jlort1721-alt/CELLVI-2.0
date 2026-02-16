/**
 * Tests for Claude API Integration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RAGChatbot, OpenAIEmbeddings } from '../claudeIntegration';

describe('Claude Integration', () => {
  describe('OpenAIEmbeddings', () => {
    let embeddings: OpenAIEmbeddings;

    beforeEach(() => {
      embeddings = new OpenAIEmbeddings();
    });

    it('should generate embeddings for text', async () => {
      const text = 'Este es un texto de prueba para generar embeddings';
      const embedding = await embeddings.generateEmbedding(text);

      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBe(1536); // text-embedding-3-small dimensions
      expect(embedding.every((val) => typeof val === 'number')).toBe(true);
    });

    it('should generate consistent embeddings for same text', async () => {
      const text = 'Texto consistente';
      const embedding1 = await embeddings.generateEmbedding(text);
      const embedding2 = await embeddings.generateEmbedding(text);

      // Embeddings should be identical for same input
      expect(embedding1).toEqual(embedding2);
    });

    it('should generate different embeddings for different text', async () => {
      const text1 = 'Primer texto';
      const text2 = 'Segundo texto completamente diferente';

      const embedding1 = await embeddings.generateEmbedding(text1);
      const embedding2 = await embeddings.generateEmbedding(text2);

      // Embeddings should be different
      expect(embedding1).not.toEqual(embedding2);
    });
  });

  describe('RAGChatbot', () => {
    let chatbot: RAGChatbot;
    let mockKnowledgeBase: any[];

    beforeEach(() => {
      chatbot = new RAGChatbot();
      mockKnowledgeBase = [
        {
          id: '1',
          title: 'Manual de Mantenimiento',
          content:
            'El mantenimiento preventivo debe realizarse cada 10,000 km. Incluye cambio de aceite, filtros y revisión de frenos.',
          category: 'vehicle_manual',
        },
        {
          id: '2',
          title: 'Regulación RNDC',
          content:
            'El Registro Nacional de Despacho de Carga es obligatorio. Debe registrarse antes de cada viaje con información completa del vehículo y carga.',
          category: 'rndc_regulation',
        },
        {
          id: '3',
          title: 'Optimización de Rutas',
          content:
            'Para optimizar rutas, considere la distancia, el tráfico y las ventanas de entrega. Use algoritmos VRP para calcular la ruta más eficiente.',
          category: 'company_policy',
        },
      ];
    });

    it('should search knowledge base and return relevant documents', async () => {
      const query = '¿Cada cuánto debo hacer mantenimiento?';
      const results = await chatbot.searchKnowledgeBase(query, mockKnowledgeBase, 2);

      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('title');
      expect(results[0]).toHaveProperty('relevanceScore');
      expect(results[0].relevanceScore).toBeGreaterThanOrEqual(0);
      expect(results[0].relevanceScore).toBeLessThanOrEqual(1);
    });

    it('should return documents sorted by relevance', async () => {
      const query = 'RNDC registro de carga';
      const results = await chatbot.searchKnowledgeBase(query, mockKnowledgeBase, 3);

      // Results should be sorted by relevance (descending)
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].relevanceScore).toBeGreaterThanOrEqual(results[i + 1].relevanceScore);
      }
    });

    it('should generate chat response with RAG', async () => {
      const userMessage = '¿Cómo funciona el RNDC?';
      const response = await chatbot.chat(userMessage, mockKnowledgeBase);

      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('confidence');
      expect(response).toHaveProperty('sources');
      expect(response).toHaveProperty('suggestedActions');

      expect(typeof response.content).toBe('string');
      expect(response.content.length).toBeGreaterThan(0);
      expect(response.confidence).toBeGreaterThanOrEqual(0);
      expect(response.confidence).toBeLessThanOrEqual(1);
      expect(Array.isArray(response.sources)).toBe(true);
      expect(Array.isArray(response.suggestedActions)).toBe(true);
    });

    it('should include relevant sources in response', async () => {
      const userMessage = 'Información sobre mantenimiento preventivo';
      const response = await chatbot.chat(userMessage, mockKnowledgeBase);

      expect(response.sources.length).toBeGreaterThan(0);
      expect(response.sources[0]).toHaveProperty('title');
      expect(response.sources[0]).toHaveProperty('snippet');
      expect(response.sources[0]).toHaveProperty('relevanceScore');
    });

    it('should generate suggested actions based on context', async () => {
      const userMessage = 'Quiero programar un mantenimiento';
      const response = await chatbot.chat(userMessage, mockKnowledgeBase);

      // Should suggest maintenance-related action
      const maintenanceAction = response.suggestedActions.find(
        (action) => action.type === 'schedule_maintenance'
      );
      expect(maintenanceAction).toBeDefined();
    });

    it('should maintain conversation history', async () => {
      await chatbot.chat('¿Qué es el RNDC?', mockKnowledgeBase);
      await chatbot.chat('¿Y cada cuánto debo registrarlo?', mockKnowledgeBase);

      const history = chatbot.getHistory();

      expect(history.length).toBe(4); // 2 user messages + 2 assistant responses
      expect(history[0].role).toBe('user');
      expect(history[1].role).toBe('assistant');
      expect(history[2].role).toBe('user');
      expect(history[3].role).toBe('assistant');
    });

    it('should clear conversation history', async () => {
      await chatbot.chat('Primera pregunta', mockKnowledgeBase);
      await chatbot.chat('Segunda pregunta', mockKnowledgeBase);

      chatbot.clearHistory();
      const history = chatbot.getHistory();

      expect(history).toHaveLength(0);
    });

    it('should handle empty knowledge base gracefully', async () => {
      const response = await chatbot.chat('Una pregunta cualquiera', []);

      expect(response.content).toBeTruthy();
      expect(response.sources).toHaveLength(0);
    });

    it('should calculate confidence based on source relevance', async () => {
      const query = 'Pregunta muy específica sobre RNDC';
      const response = await chatbot.chat(query, mockKnowledgeBase);

      // Confidence should be calculated from source relevance
      expect(response.confidence).toBeGreaterThan(0);

      // With mock data, confidence should not exceed 1
      expect(response.confidence).toBeLessThanOrEqual(1);
    });
  });
});
