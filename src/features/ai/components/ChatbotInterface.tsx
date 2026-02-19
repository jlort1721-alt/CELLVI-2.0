import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Bot,
  Send,
  Database,
  HardDrive,
  History,
  Plus,
  Trash2,
} from 'lucide-react';
import { NeuroCore, type ChatMessage } from '../lib/neuroCore';
import type { RAGChatbot } from '../lib/claudeIntegration';
import {
  useConversations,
  useConversation,
  useCreateConversation,
  useAddMessage,
  useArchiveConversation,
  useKnowledgeBaseStats,
} from '../hooks/useChatbot';
import { env } from '@/config/env';
import { supabase } from '@/lib/supabase';
import ChatMessageList from './chatbot/ChatMessageList';
import ChatSidebar from './chatbot/ChatSidebar';

export default function ChatbotInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showConversations, setShowConversations] = useState(false);
  const [ragReady, setRagReady] = useState(false);
  const [_ragError, setRagError] = useState<string | null>(null);
  const [knowledgeBase, setKnowledgeBase] = useState<
    Array<{
      id: string;
      title: string;
      content: string;
      category: string;
      embedding?: number[];
    }>
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const neuroCore = useRef(new NeuroCore());
  const ragChatbot = useRef<RAGChatbot | null>(null);
  const { toast } = useToast();

  // Supabase hooks (only used when not in demo mode)
  const useMockData = env.features.useMockData;
  const { data: conversations } = useConversations('active');
  const { data: currentConversation } = useConversation(currentConversationId ?? undefined);
  const createConversation = useCreateConversation();
  const addMessage = useAddMessage();
  const archiveConversation = useArchiveConversation();
  const { data: kbStats } = useKnowledgeBaseStats();

  // Load conversation messages when current conversation changes
  useEffect(() => {
    if (currentConversation && !useMockData) {
      const chatMessages: ChatMessage[] = currentConversation.messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        metadata: msg.confidence ? {
          confidence: msg.confidence,
          sources: msg.sources_referenced || [],
          suggestedActions: msg.suggested_actions || [],
        } : undefined,
      }));
      setMessages(chatMessages);
    }
  }, [currentConversation, useMockData]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Initialize RAGChatbot when not in demo mode
  useEffect(() => {
    const initializeRAG = async () => {
      if (!useMockData && !ragReady) {
        try {
          setRagError(null);

          const { data: documents, error } = await supabase
            .from('chatbot_knowledge_base')
            .select('id, title, category, content, tags')
            .eq('published', true);

          if (error) throw error;

          if (!documents || documents.length === 0) {
            throw new Error('No se encontraron documentos en la base de conocimiento');
          }

          const { RAGChatbot: RAGChatbotClass, OpenAIEmbeddings } = await import('../lib/claudeIntegration');
          ragChatbot.current = new RAGChatbotClass();
          const embeddingsAPI = new OpenAIEmbeddings();

          const documentsWithEmbeddings = await Promise.all(
            documents.map(async (doc: any) => {
              try {
                const embedding = await embeddingsAPI.generateEmbedding(doc.content);
                return {
                  id: doc.id,
                  title: doc.title,
                  category: doc.category,
                  content: doc.content,
                  embedding,
                };
              } catch (embeddingError) {
                console.error(`Error generating embedding for doc ${doc.id}:`, embeddingError);
                return {
                  id: doc.id,
                  title: doc.title,
                  category: doc.category,
                  content: doc.content,
                };
              }
            })
          );

          setKnowledgeBase(documentsWithEmbeddings);
          setRagReady(true);

          toast({
            title: '✅ RAG Inicializado',
            description: `${documentsWithEmbeddings.length} documentos cargados para consulta`,
          });
        } catch (error: any) {
          console.error('Error initializing RAG:', error);
          setRagError(error.message || 'Error al inicializar RAG');

          toast({
            title: '⚠️ RAG No Disponible',
            description: 'Continuando en modo demo. ' + (error.message || ''),
            variant: 'destructive',
          });
        }
      }
    };

    initializeRAG();
  }, [useMockData, ragReady, toast]);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim()) return;

    const userInput = input.trim();
    setInput('');
    setIsTyping(true);

    try {
      let conversationId = currentConversationId;

      if (!useMockData && !conversationId) {
        const newConversation = await createConversation.mutateAsync({
          title: `${userInput.substring(0, 50)}...`,
          initial_message: userInput,
        });
        conversationId = newConversation.id;
        setCurrentConversationId(conversationId);
      }

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: userInput,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      if (!useMockData && conversationId) {
        await addMessage.mutateAsync({
          conversation_id: conversationId,
          message: userMessage,
        });
      }

      const generateResponse = async () => {
        let response: ChatMessage;

        if (!useMockData && ragReady && ragChatbot.current && knowledgeBase.length > 0) {
          const ragResponse = await ragChatbot.current.chat(userInput, knowledgeBase);

          response = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: ragResponse.content,
            timestamp: new Date(),
            metadata: {
              confidence: ragResponse.confidence,
              sources: ragResponse.sources,
              suggestedActions: (ragResponse.suggestedActions || []).map((action) => ({
                type: action.type as 'navigate' | 'generate_report' | 'create_alert' | 'schedule_maintenance',
                label: action.label,
                description: action.description,
                data: {},
              })),
            },
          };
        } else {
          response = await neuroCore.current.chat(userInput);
        }

        setMessages((prev) => [...prev, response]);

        if (!useMockData && conversationId) {
          await addMessage.mutateAsync({
            conversation_id: conversationId,
            message: response,
          });

          toast({
            title: '✅ Mensaje guardado',
            description: ragReady ? 'Respuesta de Claude API guardada' : 'Conversación guardada',
          });
        }

        setIsTyping(false);
      };

      setTimeout(generateResponse, 500);
    } catch (error) {
      toast({
        title: '❌ Error',
        description: 'Error al guardar mensaje',
        variant: 'destructive',
      });
      console.error('Error sending message:', error);
      setIsTyping(false);
    }
  }, [input, currentConversationId, useMockData, ragReady, knowledgeBase, createConversation, addMessage, toast]);

  const handleExampleQuestion = useCallback((question: string) => {
    setInput(question);
  }, []);

  const handleClearHistory = useCallback(async () => {
    try {
      if (!useMockData && currentConversationId) {
        await archiveConversation.mutateAsync(currentConversationId);
        setCurrentConversationId(null);

        toast({
          title: '✅ Conversación archivada',
          description: 'La conversación se archivó exitosamente',
        });
      }

      neuroCore.current.clearHistory();
      setMessages([]);
    } catch (error) {
      toast({
        title: '❌ Error',
        description: 'Error al archivar conversación',
        variant: 'destructive',
      });
      console.error('Error archiving conversation:', error);
    }
  }, [useMockData, currentConversationId, archiveConversation, toast]);

  const handleNewConversation = useCallback(() => {
    setCurrentConversationId(null);
    setMessages([]);
    neuroCore.current.clearHistory();
  }, []);

  const handleActionClick = useCallback((_action: any) => {
    // Navigate or trigger actions based on AI suggestion
  }, []);

  const exampleQuestions = NeuroCore.getExampleQuestions();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            Neuro-Core
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            Asistente inteligente con RAG para consultas operativas
            {useMockData ? (
              <Badge variant="outline" className="gap-1">
                <HardDrive className="h-3 w-3" />
                Modo Demo
              </Badge>
            ) : (
              <Badge variant="default" className="gap-1">
                <Database className="h-3 w-3" />
                Conectado a Supabase
              </Badge>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!useMockData && conversations && conversations.length > 0 && (
            <Button
              onClick={() => setShowConversations(!showConversations)}
              variant="outline"
              className="gap-2"
            >
              <History className="h-4 w-4" />
              Conversaciones
            </Button>
          )}
          {messages.length > 0 && (
            <>
              <Button onClick={handleNewConversation} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Nueva
              </Button>
              <Button onClick={handleClearHistory} variant="outline" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Archivar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Chat Container */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Chat */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Chat</CardTitle>
            <CardDescription>
              Haz preguntas sobre vehículos, normativas, políticas y más
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ChatMessageList
              messages={messages}
              isTyping={isTyping}
              onActionClick={handleActionClick}
              messagesEndRef={messagesEndRef}
            />

            {/* Input */}
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Escribe tu pregunta aquí..."
                className="flex-1"
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isTyping}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Enviar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <ChatSidebar
          exampleQuestions={exampleQuestions}
          kbStats={kbStats}
          messages={messages}
          isTyping={isTyping}
          onExampleClick={handleExampleQuestion}
          useMockData={useMockData}
        />
      </div>
    </div>
  );
}
