import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Bot,
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
} from 'lucide-react';
import type { ChatMessage } from '../../lib/neuroCore';

interface ChatMessageListProps {
  messages: ChatMessage[];
  isTyping: boolean;
  onActionClick: (action: any) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

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

const ChatMessageList = React.memo<ChatMessageListProps>(
  ({ messages, isTyping, onActionClick, messagesEndRef }) => {
    return (
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
                                onClick={() => onActionClick(action)}
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
    );
  }
);

ChatMessageList.displayName = 'ChatMessageList';

export default ChatMessageList;
