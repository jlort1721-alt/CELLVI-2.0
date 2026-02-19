import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, CheckCircle2 } from 'lucide-react';

const EmptyState: React.FC = () => {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <Eye className="h-24 w-24 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">Sistema de Detección de Fatiga</h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          Vision Guard utiliza inteligencia artificial para detectar signos de fatiga en
          conductores en tiempo real, incluyendo:
        </p>
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>Detección de ojos cerrados</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>Análisis de bostezos</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>Monitoreo de cabeceo</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>Detección de microsueños</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Haz clic en &quot;Iniciar Monitoreo&quot; para comenzar el análisis
        </p>
      </CardContent>
    </Card>
  );
};

EmptyState.displayName = 'EmptyState';

export default React.memo(EmptyState);
