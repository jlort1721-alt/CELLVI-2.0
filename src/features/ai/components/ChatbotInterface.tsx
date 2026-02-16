import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Bot,
  Send,
  FileText,
  ExternalLink,
  Lightbulb,
  TrendingUp,
  Sparkles,
  User,
  Clock,
  BarChart3,
  Bell,
  Settings,
  Trash2,
  Database,
  HardDrive,
  History,
  Plus,
} from 'lucide-react';
import { NeuroCore, type ChatMessage } from '../lib/neuroCore';
import { RAGChatbot } from '../lib/claudeIntegration';
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

export default function ChatbotInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showConversations, setShowConversations] = useState(false);
  const [ragReady, setRagReady] = useState(false);
  const [ragError, setRagError] = useState<string | null>(null);
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
  const { data: currentConversation } = useConversation(currentConversationId);
  const createConversation = useCreateConversation();
  const addMessage = useAddMessage();
  const archiveConversation = useArchiveConversation();
  const { data: kbStats } = useKnowledgeBaseStats();

  // Load conversation messages when current conversation changes
  useEffect(() => {
    if (currentConversation && !useMockData) {
      // Convert Supabase messages to ChatMessage format
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize RAGChatbot when not in demo mode
  useEffect(() => {
    const initializeRAG = async () => {
      if (!useMockData && !ragReady) {
        try {
          setRagError(null);

          // Fetch knowledge base documents from Supabase
          const { data: documents, error } = await supabase
            .from('chatbot_knowledge_base')
            .select('id, title, category, content, tags')
            .eq('published', true);

          if (error) throw error;

          if (!documents || documents.length === 0) {
            throw new Error('No se encontraron documentos en la base de conocimiento');
          }

          // Initialize RAGChatbot and OpenAI Embeddings
          ragChatbot.current = new RAGChatbot();
          const { OpenAIEmbeddings } = await import('../lib/claudeIntegration');
          const embeddingsAPI = new OpenAIEmbeddings();

          // Generate embeddings for each document
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

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userInput = input.trim();
    setInput('');
    setIsTyping(true);

    try {
      let conversationId = currentConversationId;

      // Create new conversation if needed (when not in demo mode)
      if (!useMockData && !conversationId) {
        const newConversation = await createConversation.mutateAsync({
          title: `${userInput.substring(0, 50)}...`,
          initial_message: userInput,
        });
        conversationId = newConversation.id;
        setCurrentConversationId(conversationId);
      }

      // Create user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: userInput,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      // Save user message to Supabase when not in demo mode
      if (!useMockData && conversationId) {
        await addMessage.mutateAsync({
          conversation_id: conversationId,
          message: userMessage,
        });
      }

      // Generate AI response (real RAG or simulated)
      const generateResponse = async () => {
        let response: ChatMessage;

        if (!useMockData && ragReady && ragChatbot.current && knowledgeBase.length > 0) {
          // REAL: Use RAGChatbot with Claude API
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
          // SIMULATED: Use NeuroCore for demo
          response = await neuroCore.current.chat(userInput);
        }

        setMessages((prev) => [...prev, response]);

        // Save AI response to Supabase when not in demo mode
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

      // Add slight delay for better UX
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
  };

  const handleExampleQuestion = (question: string) => {
    setInput(question);
  };

  const handleClearHistory = async () => {
    try {
      // Archive current conversation in Supabase when not in demo mode
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
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    neuroCore.current.clearHistory();
  };

  const handleActionClick = (action: any) => {
    console.log('Action clicked:', action);
    // In production, this would navigate or trigger actions
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'navigate':
        return <ExternalLink className="h-4 w-4" />;
      case 'generate_report':
        return <BarChart3 className="h-4 w-4" />;
      case 'create_alert':
        return <Bell className="h-4 w-4" />;
      case 'schedule_maintenance':
        return <Settings className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

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
            {/* Messages */}
            <div className="h-[600px] overflow-y-auto space-y-4 p-4 bg-secondary/20 rounded-lg">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <Bot className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    ¡Hola! Soy Neuro-Core
                  </h3>
                  <p className="text-muted-foreground max-w-md mb-4">
                    Puedo ayudarte con consultas sobre mantenimiento de vehículos,
                    regulaciones RNDC, políticas de la empresa y más.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Selecciona una pregunta de ejemplo o escribe la tuya abajo
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <Bot className="h-5 w-5 text-primary-foreground" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] ${message.role === 'user' ? 'order-first' : ''}`}
                  >
                    <div
                      className={`p-4 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background border'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                      {/* Metadata for assistant messages */}
                      {message.role === 'assistant' && message.metadata && (
                        <div className="mt-3 space-y-3">
                          {/* Confidence */}
                          {message.metadata.confidence !== undefined && (
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                Confianza:{' '}
                                <Badge variant="outline" className="ml-1">
                                  {(message.metadata.confidence * 100).toFixed(0)}%
                                </Badge>
                              </span>
                            </div>
                          )}

                          {/* Sources */}
                          {message.metadata.sources && message.metadata.sources.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                Fuentes consultadas:
                              </p>
                              {message.metadata.sources.map((source) => (
                                <div
                                  key={source.id}
                                  className="text-xs p-2 bg-secondary rounded border"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <p className="font-medium">{source.title}</p>
                                      <p className="text-muted-foreground mt-1">
                                        {source.snippet}
                                      </p>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                      {(source.relevanceScore * 100).toFixed(0)}%
                                    </Badge>
                                  </div>
                                  {source.url && (
                                    <a
                                      href={source.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline flex items-center gap-1 mt-1"
                                    >
                                      Ver documento
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Suggested Actions */}
                          {message.metadata.suggestedActions &&
                            message.metadata.suggestedActions.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-xs font-medium flex items-center gap-1">
                                  <Lightbulb className="h-3 w-3" />
                                  Acciones sugeridas:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {message.metadata.suggestedActions.map((action, idx) => (
                                    <Button
                                      key={idx}
                                      onClick={() => handleActionClick(action)}
                                      variant="outline"
                                      size="sm"
                                      className="h-8 text-xs gap-1"
                                    >
                                      {getActionIcon(action.type)}
                                      {action.label}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {message.timestamp.toLocaleTimeString('es-CO')}
                    </p>
                  </div>

                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <User className="h-5 w-5 text-secondary-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="bg-background border p-4 rounded-lg">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      />
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: '0.4s' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

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
        <div className="space-y-6">
          {/* Example Questions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Preguntas de Ejemplo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {exampleQuestions.map((question, idx) => (
                <Button
                  key={idx}
                  onClick={() => handleExampleQuestion(question)}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3 px-3"
                  disabled={isTyping}
                >
                  <span className="text-xs line-clamp-2">{question}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Knowledge Base Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Base de Conocimiento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {kbStats ? (
                <>
                  <div className="flex items-center justify-between p-2 bg-secondary rounded">
                    <span className="text-xs font-medium">Total Documentos</span>
                    <Badge variant="default">{kbStats.total}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-secondary rounded">
                    <span className="text-xs font-medium">Manuales de Vehículos</span>
                    <Badge variant="secondary">{kbStats.byCategory.vehicle_manual || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-secondary rounded">
                    <span className="text-xs font-medium">Regulaciones RNDC</span>
                    <Badge variant="secondary">{kbStats.byCategory.rndc_regulation || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-secondary rounded">
                    <span className="text-xs font-medium">Políticas Empresa</span>
                    <Badge variant="secondary">{kbStats.byCategory.company_policy || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-secondary rounded">
                    <span className="text-xs font-medium">Historial Incidentes</span>
                    <Badge variant="secondary">{kbStats.byCategory.incident_history || 0}</Badge>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between p-2 bg-secondary rounded">
                    <span className="text-xs font-medium">Manuales de Vehículos</span>
                    <Badge variant="secondary">2</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-secondary rounded">
                    <span className="text-xs font-medium">Regulaciones RNDC</span>
                    <Badge variant="secondary">2</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-secondary rounded">
                    <span className="text-xs font-medium">Políticas Empresa</span>
                    <Badge variant="secondary">2</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-secondary rounded">
                    <span className="text-xs font-medium">Historial Incidentes</span>
                    <Badge variant="secondary">1</Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Capabilities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Capacidades
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5" />
                <span>Búsqueda semántica en documentos</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5" />
                <span>Respuestas contextuales con referencias</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5" />
                <span>Sugerencia de acciones relevantes</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5" />
                <span>Análisis de historial de incidentes</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-yellow-500 mt-1.5" />
                <span className="text-muted-foreground">
                  Integración con Claude API (próximamente)
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          {messages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Estadísticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Mensajes totales</span>
                  <Badge>{messages.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Preguntas del usuario</span>
                  <Badge>{messages.filter((m) => m.role === 'user').length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Respuestas de IA</span>
                  <Badge>{messages.filter((m) => m.role === 'assistant').length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Confianza promedio</span>
                  <Badge variant="outline">
                    {messages
                      .filter((m) => m.role === 'assistant' && m.metadata?.confidence)
                      .reduce((sum, m) => sum + (m.metadata!.confidence! * 100), 0) /
                      messages.filter((m) => m.role === 'assistant' && m.metadata?.confidence).length || 0}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
