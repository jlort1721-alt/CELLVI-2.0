import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Lightbulb,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import type { ChatMessage } from '../../lib/neuroCore';

interface KBStats {
  total: number;
  byCategory: {
    vehicle_manual?: number;
    rndc_regulation?: number;
    company_policy?: number;
    incident_history?: number;
  };
}

interface ChatSidebarProps {
  exampleQuestions: string[];
  kbStats: KBStats | null;
  messages: ChatMessage[];
  isTyping: boolean;
  onExampleClick: (question: string) => void;
  useMockData: boolean;
}

const ChatSidebar = React.memo<ChatSidebarProps>(
  ({ exampleQuestions, kbStats, messages, isTyping, onExampleClick, useMockData }) => {
    return (
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
                onClick={() => onExampleClick(question)}
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
    );
  }
);

ChatSidebar.displayName = 'ChatSidebar';

export default ChatSidebar;
