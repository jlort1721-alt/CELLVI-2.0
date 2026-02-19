import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Activity, Clock, Bell, Eye, AlertTriangle } from 'lucide-react';
import type { FatigueState, FatigueMetrics } from '../../lib/visionGuard';

export interface StatusOverviewGridProps {
  fatigueState: FatigueState;
  metrics: FatigueMetrics;
  formatDuration: (ms: number) => string;
  getLevelColor: (level: 'green' | 'yellow' | 'red') => string;
  getLevelText: (level: 'green' | 'yellow' | 'red') => string;
}

const StatusOverviewGrid: React.FC<StatusOverviewGridProps> = ({
  fatigueState,
  metrics,
  formatDuration,
  getLevelColor,
  getLevelText,
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className={fatigueState.level === 'green' ? 'border-green-500' : fatigueState.level === 'yellow' ? 'border-yellow-500' : 'border-red-500'}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Estado</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${getLevelColor(fatigueState.level)} ${fatigueState.level === 'red' ? 'animate-pulse' : ''}`} />
            <span className="text-2xl font-bold">{getLevelText(fatigueState.level)}</span>
          </div>
          <Progress
            value={fatigueState.score}
            className={`mt-2 ${fatigueState.level === 'red' ? 'bg-red-200' : fatigueState.level === 'yellow' ? 'bg-yellow-200' : 'bg-green-200'}`}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Score: {fatigueState.score}/100
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tiempo Conduciendo</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatDuration(fatigueState.drivingDuration)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {fatigueState.drivingDuration > 7200000 ? (
              <span className="text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Excede 2 horas
              </span>
            ) : (
              'Dentro del límite'
            )}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alertas Activas</CardTitle>
          <Bell className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {fatigueState.alerts.filter((a) => a.severity === 'high').length}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Severidad alta
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Microsueños</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.microSleepEvents}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Eventos detectados
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

StatusOverviewGrid.displayName = 'StatusOverviewGrid';

export default React.memo(StatusOverviewGrid);
