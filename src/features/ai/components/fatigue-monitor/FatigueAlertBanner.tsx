import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

export interface FatigueAlertBannerProps {
  level: 'green' | 'yellow' | 'red';
  score: number;
}

const FatigueAlertBanner: React.FC<FatigueAlertBannerProps> = ({ level, score }) => {
  if (level === 'red') {
    return (
      <Alert variant="destructive" className="border-2 animate-pulse">
        <ShieldAlert className="h-5 w-5" />
        <AlertTitle className="text-lg font-bold">¡ALERTA CRÍTICA DE FATIGA!</AlertTitle>
        <AlertDescription className="text-base">
          Se ha detectado fatiga severa. El conductor debe detenerse INMEDIATAMENTE y
          descansar. Nivel de fatiga: {score}/100
        </AlertDescription>
      </Alert>
    );
  }

  if (level === 'yellow') {
    return (
      <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
        <AlertTriangle className="h-5 w-5 text-yellow-600" />
        <AlertTitle className="text-yellow-900 dark:text-yellow-100">
          Advertencia de Fatiga
        </AlertTitle>
        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
          Se detectan signos de fatiga. Planificar descanso en los próximos 15-30 minutos.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

FatigueAlertBanner.displayName = 'FatigueAlertBanner';

export default React.memo(FatigueAlertBanner);
