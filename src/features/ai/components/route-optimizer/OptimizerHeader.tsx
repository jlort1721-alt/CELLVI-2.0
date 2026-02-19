import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Navigation,
  Zap,
  History,
  Database,
  HardDrive,
} from 'lucide-react';

export interface OptimizerHeaderProps {
  useMockData: boolean;
  isOptimizing: boolean;
  showHistory: boolean;
  onToggleHistory: () => void;
  onOptimize: () => void;
}

const OptimizerHeader: React.FC<OptimizerHeaderProps> = ({
  useMockData,
  isOptimizing,
  showHistory,
  onToggleHistory,
  onOptimize,
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Navigation className="h-8 w-8 text-primary" />
          Route Genius
        </h1>
        <p className="text-muted-foreground mt-1 flex items-center gap-2">
          Optimización inteligente de rutas con algoritmo VRP
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
        {!useMockData && (
          <Button
            onClick={onToggleHistory}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <History className="h-4 w-4" />
            {showHistory ? 'Ocultar' : 'Ver'} Historial
          </Button>
        )}
        <Button
          onClick={onOptimize}
          disabled={isOptimizing}
          size="lg"
          className="gap-2"
        >
          {isOptimizing ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Optimizando...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Optimizar Rutas
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

OptimizerHeader.displayName = 'OptimizerHeader';

export default React.memo(OptimizerHeader);
