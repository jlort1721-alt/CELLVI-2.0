import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ChatMessage } from '../lib/neuroCore';

// =====================================================
// TYPES
// =====================================================

export interface ConversationRecord {
  id: string;
  user_id: string;
  title: string | null;
  messages: ChatMessage[];
  message_count: number;
  avg_confidence: number | null;
  total_sources_referenced: number;
  status: 'active' | 'archived' | 'deleted';
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

export interface KnowledgeBaseDocument {
  id: string;
  title: string;
  category: 'vehicle_manual' | 'rndc_regulation' | 'company_policy' | 'incident_history' | 'other';
  content: string;
  summary: string | null;
  document_metadata: any;
  tags: string[];
  embedding: number[] | null;
  url: string | null;
  file_path: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface MessageRecord {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  confidence: number | null;
  sources_referenced: any[];
  suggested_actions: any[];
  user_feedback: 'helpful' | 'not_helpful' | 'partially_helpful' | null;
  user_rating: number | null;
  timestamp: string;
}

export interface CreateConversationInput {
  title?: string;
  initial_message?: string;
}

export interface AddMessageInput {
  conversation_id: string;
  message: ChatMessage;
}

export interface UpdateMessageFeedbackInput {
  message_id: string;
  feedback: 'helpful' | 'not_helpful' | 'partially_helpful';
  rating?: number;
}

// =====================================================
// HOOKS - Conversaciones
// =====================================================

/**
 * Hook para obtener conversaciones del usuario
 */
export function useConversations(status: ConversationRecord['status'] = 'active') {
  return useQuery({
    queryKey: ['chatbot-conversations', status],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return [];

      const { data, error } = await supabase
        .from('chatbot_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', status)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      return data as ConversationRecord[];
    },
  });
}

/**
 * Hook para obtener una conversación específica
 */
export function useConversation(conversationId?: string) {
  return useQuery({
    queryKey: ['chatbot-conversation', conversationId],
    queryFn: async () => {
      if (!conversationId) return null;

      const { data, error } = await supabase
        .from('chatbot_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) throw error;
      return data as ConversationRecord;
    },
    enabled: !!conversationId,
  });
}

/**
 * Hook para crear una nueva conversación
 */
export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateConversationInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Usuario no autenticado');

      const initialMessages = input.initial_message
        ? [
            {
              id: `msg-${Date.now()}`,
              role: 'user' as const,
              content: input.initial_message,
              timestamp: new Date(),
            },
          ]
        : [];

      const { data, error } = await supabase
        .from('chatbot_conversations')
        .insert({
          user_id: user.id,
          title: input.title || 'Nueva Conversación',
          messages: initialMessages,
          message_count: initialMessages.length,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return data as ConversationRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-conversations'] });
    },
  });
}

/**
 * Hook para agregar un mensaje a una conversación
 */
export function useAddMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddMessageInput) => {
      // Obtener conversación actual
      const { data: conversation, error: fetchError } = await supabase
        .from('chatbot_conversations')
        .select('messages, message_count')
        .eq('id', input.conversation_id)
        .single();

      if (fetchError) throw fetchError;

      const currentMessages = conversation.messages as ChatMessage[];
      const updatedMessages = [...currentMessages, input.message];

      // Calcular avg_confidence si el mensaje es del assistant
      let avg_confidence = null;
      if (input.message.role === 'assistant' && input.message.metadata?.confidence) {
        const assistantMessages = updatedMessages.filter(
          (m) => m.role === 'assistant' && m.metadata?.confidence
        );
        avg_confidence =
          assistantMessages.reduce((sum, m) => sum + (m.metadata!.confidence || 0), 0) /
          assistantMessages.length;
      }

      // Contar sources referenciadas
      const total_sources =
        input.message.role === 'assistant' && input.message.metadata?.sources
          ? (conversation.total_sources_referenced || 0) + input.message.metadata.sources.length
          : conversation.total_sources_referenced || 0;

      // Actualizar conversación
      const { data, error } = await supabase
        .from('chatbot_conversations')
        .update({
          messages: updatedMessages,
          message_count: updatedMessages.length,
          avg_confidence,
          total_sources_referenced: total_sources,
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.conversation_id)
        .select()
        .single();

      if (error) throw error;

      // Crear registro individual del mensaje
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase.from('chatbot_messages').insert({
          conversation_id: input.conversation_id,
          user_id: user.id,
          role: input.message.role,
          content: input.message.content,
          confidence: input.message.metadata?.confidence,
          sources_referenced: input.message.metadata?.sources || [],
          suggested_actions: input.message.metadata?.suggestedActions || [],
          timestamp: input.message.timestamp.toISOString(),
        });
      }

      return data as ConversationRecord;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-conversation', data.id] });
      queryClient.invalidateQueries({ queryKey: ['chatbot-conversations'] });
    },
  });
}

/**
 * Hook para actualizar el título de una conversación
 */
export function useUpdateConversationTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, title }: { conversationId: string; title: string }) => {
      const { data, error } = await supabase
        .from('chatbot_conversations')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', conversationId)
        .select()
        .single();

      if (error) throw error;
      return data as ConversationRecord;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-conversation', data.id] });
      queryClient.invalidateQueries({ queryKey: ['chatbot-conversations'] });
    },
  });
}

/**
 * Hook para archivar una conversación
 */
export function useArchiveConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { data, error } = await supabase
        .from('chatbot_conversations')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('id', conversationId)
        .select()
        .single();

      if (error) throw error;
      return data as ConversationRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-conversations'] });
    },
  });
}

/**
 * Hook para eliminar una conversación
 */
export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase
        .from('chatbot_conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-conversations'] });
    },
  });
}

// =====================================================
// HOOKS - Knowledge Base
// =====================================================

/**
 * Hook para obtener documentos de la knowledge base
 */
export function useKnowledgeBase(category?: KnowledgeBaseDocument['category']) {
  return useQuery({
    queryKey: ['knowledge-base', category],
    queryFn: async () => {
      let query = supabase
        .from('chatbot_knowledge_base')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as KnowledgeBaseDocument[];
    },
  });
}

/**
 * Hook para buscar en la knowledge base por tags
 */
export function useSearchKnowledgeBase(searchTerm?: string) {
  return useQuery({
    queryKey: ['knowledge-base-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm) return [];

      const { data, error } = await supabase
        .from('chatbot_knowledge_base')
        .select('*')
        .eq('published', true)
        .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`);

      if (error) throw error;
      return data as KnowledgeBaseDocument[];
    },
    enabled: !!searchTerm && searchTerm.length >= 3,
  });
}

/**
 * Hook para obtener estadísticas de la knowledge base
 */
export function useKnowledgeBaseStats() {
  return useQuery({
    queryKey: ['knowledge-base-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chatbot_knowledge_base')
        .select('category, published')
        .eq('published', true);

      if (error) throw error;

      const stats = {
        total: data.length,
        byCategory: data.reduce((acc: any, doc) => {
          acc[doc.category] = (acc[doc.category] || 0) + 1;
          return acc;
        }, {}),
      };

      return stats;
    },
  });
}

// =====================================================
// HOOKS - Mensajes y Feedback
// =====================================================

/**
 * Hook para dar feedback a un mensaje
 */
export function useUpdateMessageFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateMessageFeedbackInput) => {
      const { data, error } = await supabase
        .from('chatbot_messages')
        .update({
          user_feedback: input.feedback,
          user_rating: input.rating,
        })
        .eq('id', input.message_id)
        .select()
        .single();

      if (error) throw error;
      return data as MessageRecord;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-conversation', data.conversation_id] });
    },
  });
}

/**
 * Hook para obtener conversaciones activas (función helper)
 */
export function useActiveConversations(limit: number = 20) {
  return useQuery({
    queryKey: ['active-conversations', limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_active_conversations', {
        limit_count: limit,
      });

      if (error) {
        // Fallback si la función no existe
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return [];

        const { data: conversations, error: convError } = await supabase
          .from('chatbot_conversations')
          .select('id, title, message_count, last_message_at, user_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('last_message_at', { ascending: false })
          .limit(limit);

        if (convError) throw convError;
        return conversations;
      }

      return data;
    },
  });
}
