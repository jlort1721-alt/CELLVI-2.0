import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
} from 'lucide-react';
import { NeuroCore, type ChatMessage } from '../lib/neuroCore';

export default function ChatbotInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const neuroCore = useRef(new NeuroCore());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(async () => {
      const response = await neuroCore.current.chat(input);
      setMessages((prev) => [...prev, response]);
      setIsTyping(false);
    }, 1000);
  };

  const handleExampleQuestion = (question: string) => {
    setInput(question);
  };

  const handleClearHistory = () => {
    neuroCore.current.clearHistory();
    setMessages([]);
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
          <p className="text-muted-foreground mt-1">
            Asistente inteligente con RAG para consultas operativas
          </p>
        </div>
        {messages.length > 0 && (
          <Button onClick={handleClearHistory} variant="outline" className="gap-2">
            <Trash2 className="h-4 w-4" />
            Limpiar Historial
          </Button>
        )}
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
