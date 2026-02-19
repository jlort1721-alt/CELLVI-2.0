import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AIInsight } from '../shared/ExecutiveWidgets';
import { Brain } from 'lucide-react';

const aiInsights = [
  { type: 'prediction' as const, title: 'Proyeccion Crecimiento Q2', description: 'Se proyecta crecimiento del 22% para el proximo trimestre. Areas de mayor impacto: CRM (+28%) y Comercial (+34%).', confidence: 87, timestamp: 'Hace 12 minutos' },
  { type: 'recommendation' as const, title: 'Optimizar Cobertura Tests', description: 'Desarrollo tiene cobertura al 78%. Asignar 2 sprints podria llevarla al 90%, reduciendo bugs criticos en 35%.', confidence: 92, timestamp: 'Hace 28 minutos' },
  { type: 'achievement' as const, title: 'CCO-RACK: Meta Superada', description: 'Centro de Control redujo tiempo de respuesta en 8.7%, superando la meta con promedio de 4.2 min.', confidence: 99, timestamp: 'Hace 1 hora' },
  { type: 'warning' as const, title: 'Cartera por Vencer', description: '3 cuentas con saldo significativo por vencer esta semana. Accion inmediata recomendada en Contabilidad.', confidence: 94, timestamp: 'Hace 2 horas' },
  { type: 'recommendation' as const, title: 'Expansion Sector Salud', description: 'Oportunidad en cadena de frio para sector salud. ROI estimado 340% con inversion moderada.', confidence: 78, timestamp: 'Hace 3 horas' },
  { type: 'prediction' as const, title: 'Pico de Carga Operativa', description: 'Aumento del 40% en monitoreo la proxima semana por temporada alta. Reforzar turnos en CCO.', confidence: 83, timestamp: 'Hace 4 horas' },
];

const AICommandPanel = memo(() => (
  <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
    <CardHeader className="pb-3">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-amber-500/10">
          <Brain className="w-4 h-4 text-amber-500" />
        </div>
        <div>
          <CardTitle className="text-sm">Centro de Comando IA</CardTitle>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Analisis predictivo y recomendaciones inteligentes
          </p>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {aiInsights.map((insight, i) => (
          <AIInsight key={i} {...insight} />
        ))}
      </div>
    </CardContent>
  </Card>
));

AICommandPanel.displayName = 'AICommandPanel';

export default AICommandPanel;
