import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Eye,
  Coffee,
  Play,
  Square,
  HardDrive,
  Database,
  History,
} from 'lucide-react';

export interface FatigueHeaderProps {
  useMockData: boolean;
  isMonitoring: boolean;
  showStats: boolean;
  onToggleStats: () => void;
  onStartMonitoring: () => void;
  onStopMonitoring: () => void;
  onTakeBreak: () => void;
}

const FatigueHeader: React.FC<FatigueHeaderProps> = ({
  useMockData,
  isMonitoring,
  showStats,
  onToggleStats,
  onStartMonitoring,
  onStopMonitoring,
  onTakeBreak,
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Eye className="h-8 w-8 text-primary" />
          Vision Guard
        </h1>
        <p className="text-muted-foreground mt-1 flex items-center gap-2">
          Detección de fatiga en tiempo real con IA
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
        {!useMockData && !isMonitoring && (
          <Button
            onClick={onToggleStats}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <History className="h-4 w-4" />
            {showStats ? 'Ocultar' : 'Ver'} Estadísticas
          </Button>
        )}
        {!isMonitoring ? (
          <Button onClick={onStartMonitoring} size="lg" className="gap-2">
            <Play className="h-4 w-4" />
            Iniciar Monitoreo
          </Button>
        ) : (
          <>
            <Button onClick={onTakeBreak} variant="outline" size="lg" className="gap-2">
              <Coffee className="h-4 w-4" />
              Tomar Descanso
            </Button>
            <Button
              onClick={onStopMonitoring}
              variant="destructive"
              size="lg"
              className="gap-2"
            >
              <Square className="h-4 w-4" />
              Detener
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

FatigueHeader.displayName = 'FatigueHeader';

export default React.memo(FatigueHeader);
